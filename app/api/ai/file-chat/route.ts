import { inflateRawSync } from "node:zlib";

type FileChatRequest = {
  question?: string;
  file?: {
    name?: string;
    type?: string;
    size?: number;
    url?: string | null;
  };
  files?: Array<{
    name?: string;
    type?: string;
    size?: number;
    url?: string | null;
  }>;
};

export const runtime = "nodejs";

const TEXT_EXTENSIONS = new Set(["txt", "md", "json", "xml", "css", "js", "ts", "tsx", "jsx", "csv", "log"]);
const OFFICE_EXTENSIONS = new Set(["pptx", "docx", "xlsx"]);

function getExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? "" : "";
}

function getFileKind(name: string, type: string) {
  const ext = getExtension(name);

  if (TEXT_EXTENSIONS.has(ext) || OFFICE_EXTENSIONS.has(ext) || ext === "pdf") return ext;
  if (type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "pptx";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("text/")) return "txt";

  return ext;
}

function getResponseText(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return "";

  return choices
    .map((choice) => {
      if (!choice || typeof choice !== "object") return "";
      const message = (choice as { message?: { content?: unknown } }).message;
      const content = message?.content;

      if (typeof content === "string") return content;
      if (!Array.isArray(content)) return "";

      return content
        .map((part) => {
          if (!part || typeof part !== "object") return "";
          return (part as { text?: unknown }).text;
        })
        .filter((text): text is string => typeof text === "string")
        .join("\n");
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractXmlText(xml: string) {
  return Array.from(xml.matchAll(/<[^:>]*:?t[^>]*>([\s\S]*?)<\/[^:>]*:?t>/g))
    .map((match) => decodeXmlText(match[1].replace(/<[^>]+>/g, "")))
    .filter(Boolean)
    .join(" ");
}

function readZipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  const endSignature = 0x06054b50;
  let endOffset = -1;

  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i -= 1) {
    if (buffer.readUInt32LE(i) === endSignature) {
      endOffset = i;
      break;
    }
  }

  if (endOffset === -1) return entries;

  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);

  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(centralOffset) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralOffset + 42);
    const fileName = buffer
      .subarray(centralOffset + 46, centralOffset + 46 + fileNameLength)
      .toString("utf8");

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);

    if (compressionMethod === 0) {
      entries.set(fileName, compressedData);
    } else if (compressionMethod === 8) {
      entries.set(fileName, inflateRawSync(compressedData));
    }

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function extractOfficeText(buffer: Buffer, ext: string) {
  const entries = readZipEntries(buffer);

  const fileNames = Array.from(entries.keys())
    .filter((name) => {
      if (ext === "pptx") return /^ppt\/(slides|notesSlides)\/.+\.xml$/.test(name);
      if (ext === "docx") return /^word\/.+\.xml$/.test(name);
      if (ext === "xlsx") return /^xl\/(sharedStrings|worksheets)\/.+\.xml$/.test(name);
      return false;
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return fileNames
    .map((name) => {
      const text = extractXmlText(entries.get(name)?.toString("utf8") ?? "");
      return text ? `${name}:\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 120_000);
}

function extractPdfText(buffer: Buffer) {
  const content = buffer.toString("latin1");
  return Array.from(content.matchAll(/\(([^()]*)\)\s*Tj|\[((?:.|\n)*?)\]\s*TJ/g))
    .map((match) => decodeXmlText((match[1] || match[2] || "").replace(/\\([()\\])/g, "$1")))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120_000);
}

async function getFileContext(file: NonNullable<FileChatRequest["file"]>) {
  const name = file.name ?? "Untitled file";
  const type = file.type ?? "application/octet-stream";
  const fileKind = getFileKind(name, type);
  const canReadText = type.startsWith("text/") || TEXT_EXTENSIONS.has(fileKind);
  const canReadOfficeText = OFFICE_EXTENSIONS.has(fileKind);
  const canReadPdfText = fileKind === "pdf";
  const canInspectMedia = type.startsWith("image/");

  if (canInspectMedia) {
    return {
      textContext: "",
      note: "The image is attached for visual inspection. Use the image itself to answer visual questions.",
    };
  }

  if (!file.url || (!canReadText && !canReadOfficeText && !canReadPdfText)) {
    return {
      textContext: "",
      note: canReadText || canReadOfficeText || canReadPdfText ? "The file URL was not available." : "This file type is not text-readable yet.",
    };
  }

  const response = await fetch(file.url);
  if (!response.ok) {
    return {
      textContext: "",
      note: "The file content could not be downloaded.",
    };
  }

  if (canReadOfficeText) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = extractOfficeText(buffer, fileKind);

    return {
      textContext: text,
      note: text
        ? "Office document text was extracted from the file. Formatting, images, and charts may be incomplete."
        : "No readable text was found inside this Office file.",
    };
  }

  if (canReadPdfText) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = extractPdfText(buffer);

    return {
      textContext: text,
      note: text
        ? "PDF text was extracted from the file. Scanned image-only PDFs may have incomplete text."
        : "No readable text was found inside this PDF. It may be a scanned image PDF.",
    };
  }

  const text = await response.text();
  return {
    textContext: text.slice(0, 120_000),
    note: text.length > 120_000 ? "The file text was truncated to fit the chat context." : "",
  };
}

async function getInlineMediaPart(file: NonNullable<FileChatRequest["file"]>) {
  const type = file.type ?? "application/octet-stream";
  const canInline = type.startsWith("image/");

  if (!file.url || !canInline) return null;

  const response = await fetch(file.url);
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    type: "image_url",
    image_url: {
      url: `data:${type};base64,${buffer.toString("base64")}`,
    },
  };
}

async function buildFileParts(files: NonNullable<FileChatRequest["files"]>, question: string) {
  const parts: Array<Record<string, unknown>> = [];
  const fileSummaries: string[] = [];
  let contextLength = 0;
  let attachedImages = 0;

  for (const [index, file] of files.entries()) {
    if (!file.url || !file.name) continue;

    const type = file.type ?? "application/octet-stream";
    const supportsVision = type.startsWith("image/");
    const mediaPart = supportsVision && attachedImages < 4 ? await getInlineMediaPart(file) : null;
    const { textContext, note } = await getFileContext(file);
    const remainingContext = Math.max(0, 180_000 - contextLength);
    const clippedText = textContext.slice(0, remainingContext);
    contextLength += clippedText.length;

    if (mediaPart) {
      parts.push(mediaPart);
      attachedImages += 1;
    }

    fileSummaries.push(
      [
        `File ${index + 1}: ${file.name}`,
        `Type: ${type}`,
        `Size: ${file.size ?? 0} bytes`,
        note ? `Note: ${note}` : "",
        supportsVision && !mediaPart ? "Image note: not attached because the drive chat already attached several images." : "",
        clippedText ? `Extracted file text:\n${clippedText}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    if (contextLength >= 180_000) break;
  }

  parts.push({
    type: "text",
    text: [
      `The user is asking about all files in their drive.`,
      `Readable files included: ${fileSummaries.length}`,
      fileSummaries.join("\n\n---\n\n"),
      `User question: ${question}`,
    ].join("\n\n"),
  });

  return parts;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing OPENROUTER_API_KEY in .env.local. Add it, then restart the dev server." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as FileChatRequest;
  const question = body.question?.trim();
  const file = body.file;
  const files = body.files?.filter((item) => item.name && item.url) ?? [];

  if (!question || (!file?.name && files.length === 0)) {
    return Response.json({ error: "Question and at least one file are required." }, { status: 400 });
  }

  if (files.length > 0) {
    const parts = await buildFileParts(files, question);
    return await askOpenRouter(apiKey, parts, true);
  }

  if (!file?.name) {
    return Response.json({ error: "File is required." }, { status: 400 });
  }

  if (!file.url) {
    return Response.json(
      { error: "The file is still preparing. Wait a moment, then ask again." },
      { status: 400 }
    );
  }

  const type = file.type ?? "application/octet-stream";
  const { textContext, note } = await getFileContext(file);
  const supportsVision = type.startsWith("image/");
  const mediaPart = supportsVision ? await getInlineMediaPart(file) : null;
  const parts: Array<Record<string, unknown>> = [
    ...(mediaPart ? [mediaPart] : []),
    {
      type: "text",
      text: [
        `File name: ${file.name}`,
        `File type: ${type}`,
        `File size: ${file.size ?? 0} bytes`,
        note ? `Note: ${note}` : "",
        textContext ? `Extracted file text:\n${textContext}` : "",
        `User question: ${question}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];

  return await askOpenRouter(apiKey, parts, false);
}

async function askOpenRouter(apiKey: string, parts: Array<Record<string, unknown>>, isDriveChat: boolean) {
  const model = process.env.OPENROUTER_MODEL ?? "openrouter/free";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "NextDrive",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            isDriveChat
              ? "You are a helpful drive assistant. Answer questions across all provided drive files. Use extracted document text and any attached images. Mention file names when useful. If the requested detail is not present in the provided files, say that clearly."
              : "You are a helpful file assistant inside a drive app. For image files, inspect the attached image directly when provided. For PDFs and Office/text files, use the extracted text. Do not claim you cannot read a file if extracted text or an image is provided. If the requested detail is not visible or present, say that clearly.",
        },
        {
          role: "user",
          content: parts,
        },
      ],
      max_tokens: 700,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: data?.error?.message ?? "The OpenRouter request failed." },
      { status: response.status }
    );
  }

  return Response.json({ answer: getResponseText(data) || "I could not generate an answer." });
}

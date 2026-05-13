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
const FREE_TEXT_FALLBACK_MODELS = [
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
];
const FREE_VISION_FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
];

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
      const { message, text } = choice as {
        message?: { content?: unknown };
        text?: unknown;
      };
      const content = message?.content ?? text;

      if (typeof content === "string") return content;
      if (!Array.isArray(content)) return "";

      return content
        .map((part) => {
          if (!part || typeof part !== "object") return "";
          const { text, type } = part as { text?: unknown; type?: unknown };
          if (typeof text === "string") return text;
          if (type === "text" || type === "output_text") {
            const outputText = (part as { content?: unknown }).content;
            return typeof outputText === "string" ? outputText : "";
          }
          return "";
        })
        .filter((text): text is string => typeof text === "string")
        .join("\n");
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getEmptyResponseMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return "The AI provider returned an empty response.";
  }

  const { choices, model, id } = data as {
    choices?: unknown;
    model?: unknown;
    id?: unknown;
  };
  const choice = Array.isArray(choices) && choices[0] && typeof choices[0] === "object" ? choices[0] : null;
  const finishReason = choice
    ? (choice as { finish_reason?: unknown; native_finish_reason?: unknown }).finish_reason ??
      (choice as { finish_reason?: unknown; native_finish_reason?: unknown }).native_finish_reason
    : undefined;
  const details = [
    typeof model === "string" ? `model: ${model}` : "",
    typeof finishReason === "string" ? `finish reason: ${finishReason}` : "",
    typeof id === "string" ? `request id: ${id}` : "",
  ].filter(Boolean);

  return `The AI provider returned an empty response${details.length ? ` (${details.join(", ")})` : ""}. Please try again.`;
}

function getProviderErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return "The OpenRouter request failed.";

  const error = (data as { error?: unknown }).error;
  if (!error || typeof error !== "object") return "The OpenRouter request failed.";

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : "The OpenRouter request failed.";
}

function isRetryableProviderError(status: number, message: string) {
  const lowerMessage = message.toLowerCase();
  return (
    status >= 500 ||
    lowerMessage.includes("provider returned error") ||
    lowerMessage.includes("provider error") ||
    lowerMessage.includes("upstream") ||
    lowerMessage.includes("overloaded") ||
    lowerMessage.includes("rate limit")
  );
}

function isFallbackEligibleProviderError(status: number, message: string) {
  const lowerMessage = message.toLowerCase();
  return (
    status === 400 ||
    status === 404 ||
    status === 422 ||
    lowerMessage.includes("no endpoints found") ||
    lowerMessage.includes("requested output modalities") ||
    lowerMessage.includes("model not found") ||
    lowerMessage.includes("not supported") ||
    lowerMessage.includes("provider unavailable")
  );
}

function getOpenRouterModels(parts: Array<Record<string, unknown>>) {
  const configuredModelRaw = process.env.OPENROUTER_MODEL?.trim() ?? "";
  const hasImage = parts.some((part) => part.type === "image_url");
  const fallbacks = hasImage ? FREE_VISION_FALLBACK_MODELS : FREE_TEXT_FALLBACK_MODELS;
  const configuredModel =
    configuredModelRaw && configuredModelRaw !== "openrouter/free" ? configuredModelRaw : "";

  return Array.from(new Set([configuredModel, ...fallbacks])).filter(Boolean);
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

async function callOpenRouter(
  apiKey: string,
  model: string,
  parts: Array<Record<string, unknown>>,
  isDriveChat: boolean
) {
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
      max_completion_tokens: 1200,
      reasoning: {
        effort: "none",
        exclude: true,
      },
    }),
  });

  const responseText = await response.text();
  let data: unknown = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = {
      error: {
        message: responseText || "The OpenRouter request failed with a non-JSON response.",
      },
    };
  }

  return { data, response };
}

async function askOpenRouter(apiKey: string, parts: Array<Record<string, unknown>>, isDriveChat: boolean) {
  const failures: string[] = [];
  const attemptWithModels = async (attemptParts: Array<Record<string, unknown>>) => {
    const models = getOpenRouterModels(attemptParts);

    for (const model of models) {
      const { data, response } = await callOpenRouter(apiKey, model, attemptParts, isDriveChat);

      if (!response.ok) {
        const message = getProviderErrorMessage(data);
        failures.push(`${model}: ${message}`);

        if (isRetryableProviderError(response.status, message) || isFallbackEligibleProviderError(response.status, message)) {
          continue;
        }

        return Response.json({ error: message }, { status: response.status });
      }

      const answer = getResponseText(data);
      if (answer) {
        return Response.json({ answer });
      }

      failures.push(`${model}: ${getEmptyResponseMessage(data)}`);
    }

    return null;
  };

  const firstAttempt = await attemptWithModels(parts);
  if (firstAttempt) return firstAttempt;

  const hasInlineImage = parts.some((part) => part.type === "image_url");
  if (hasInlineImage) {
    const textOnlyParts = parts.filter((part) => part.type !== "image_url");
    if (textOnlyParts.length > 0) {
      const secondAttempt = await attemptWithModels(textOnlyParts);
      if (secondAttempt) return secondAttempt;
      failures.push("text-only retry: all fallback models failed");
    }
  }

  return Response.json(
    {
      error: failures.length
        ? `The AI providers did not return a usable answer. ${failures
            .slice(-2)
            .join(" | ")}`
        : "The AI providers did not return a usable answer. Please try again in a moment.",
      details: failures.slice(-3),
    },
    { status: 502 }
  );
}

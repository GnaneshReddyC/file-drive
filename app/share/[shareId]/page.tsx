"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { FileIcon } from "lucide-react";

function formatFileSize(size: number) {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatExpiry(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export default function SharedFilePage() {
  const params = useParams<{ shareId: string }>();
  const sharedFile = useQuery(api.files.getSharedFile, { shareId: params.shareId });

  if (sharedFile === undefined) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <p className="text-sm text-gray-500">Loading shared file...</p>
      </div>
    );
  }

  if (!sharedFile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <FileIcon className="mx-auto mb-4 size-12 text-gray-400" />
          <h1 className="mb-2 text-2xl font-semibold text-slate-950">Link not found</h1>
          <p className="text-sm text-gray-500">This share link does not exist or the file was removed.</p>
        </div>
      </div>
    );
  }

  if (sharedFile.expired) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <FileIcon className="mx-auto mb-4 size-12 text-gray-400" />
          <h1 className="mb-2 text-2xl font-semibold text-slate-950">Link expired</h1>
          <p className="text-sm text-gray-500">Ask the file owner to create a new share link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-lg bg-slate-900 text-white">
          <FileIcon className="size-7" />
        </div>
        <h1 className="mb-2 truncate text-2xl font-semibold text-slate-950" title={sharedFile.name}>
          {sharedFile.name}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {formatFileSize(sharedFile.size)} · Expires {formatExpiry(sharedFile.expiresAt)}
        </p>
        <Button asChild className="w-full">
          <a href={sharedFile.url ?? "#"} target="_blank" rel="noreferrer">
            Open file
          </a>
        </Button>
      </div>
    </div>
  );
}

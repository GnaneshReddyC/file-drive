"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Folder } from "lucide-react";

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

export default function SharedItemPage() {
  const params = useParams<{ shareId: string }>();
  const sharedItem = useQuery(api.files.getSharedItem, { shareId: params.shareId });

  if (sharedItem === undefined) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <p className="text-sm text-gray-500">Loading shared item...</p>
      </div>
    );
  }

  if (!sharedItem) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <FileIcon className="mx-auto mb-4 size-12 text-gray-400" />
          <h1 className="mb-2 text-2xl font-semibold text-slate-950">Link not found</h1>
          <p className="text-sm text-gray-500">This share link does not exist or the item was removed.</p>
        </div>
      </div>
    );
  }

  if (sharedItem.expired) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <FileIcon className="mx-auto mb-4 size-12 text-gray-400" />
          <h1 className="mb-2 text-2xl font-semibold text-slate-950">Link expired</h1>
          <p className="text-sm text-gray-500">Ask the owner to create a new share link.</p>
        </div>
      </div>
    );
  }

  if (sharedItem.kind === "folder") {
    const itemCount = sharedItem.files.length + sharedItem.folders.length;

    return (
      <div className="min-h-[70vh] px-6 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Folder className="size-7" />
            </div>
            <h1 className="mb-2 truncate text-2xl font-semibold text-slate-950" title={sharedItem.name}>
              {sharedItem.name}
            </h1>
            <p className="text-sm text-gray-500">
              {itemCount} item{itemCount === 1 ? "" : "s"} - Expires {formatExpiry(sharedItem.expiresAt)}
            </p>
          </div>

          <div className="space-y-2">
            {sharedItem.folders.map((folder) => (
              <div key={folder.id} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white">
                  <Folder className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950" title={folder.name}>
                    {folder.name}
                  </p>
                  <p className="text-xs text-gray-500">Folder</p>
                </div>
              </div>
            ))}
            {sharedItem.files.map((file) => (
              <div key={file.id} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                  <FileIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <a href={file.url ?? "#"} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`}>
                    <Download className="size-4" />
                  </a>
                </Button>
              </div>
            ))}
            {itemCount === 0 && (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
                This shared folder is empty.
              </div>
            )}
          </div>
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
        <h1 className="mb-2 truncate text-2xl font-semibold text-slate-950" title={sharedItem.name}>
          {sharedItem.name}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {formatFileSize(sharedItem.size)} - Expires {formatExpiry(sharedItem.expiresAt)}
        </p>
        <Button asChild className="w-full">
          <a href={sharedItem.url ?? "#"} target="_blank" rel="noreferrer">
            Open file
          </a>
        </Button>
      </div>
    </div>
  );
}

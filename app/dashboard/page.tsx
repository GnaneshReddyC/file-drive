"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadButton } from "@/app/upload-button";
import { FileCard, FileListItem } from "@/app/file-card";
import { FileViewMode, FileViewToggle } from "@/app/file-view-toggle";
import { DeleteSelectedButton } from "@/app/delete-selected-button";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { SearchComponent } from "@/app/search-component";
import { EmptySketch } from "@/app/empty-sketch";
import { useState } from "react";
import { useFileMultiSelect } from "@/app/use-file-multi-select";

function formatFileSize(size: number) {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function EmptyState({ orgId }: { orgId: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <div className="empty-state mx-auto max-w-2xl px-10 py-14 text-center">
        <EmptySketch />
        <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-950">
          No files yet
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Your digital space is waiting.
          <br />
        </p>
        <UploadButton orgId={orgId} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
      <div className="h-1 w-full bg-gray-300" />
      <div className="h-28 bg-gray-200" />
      <div className="p-3 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="h-3 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="w-4 h-4 bg-gray-300 rounded" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, deleteSelectedFiles } = useFileMultiSelect();
  const files = useQuery(api.files.getFiles, { orgId });
  const isLoading = files === undefined;

  const filteredFiles = files?.filter((file) => {
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const totalSize = files?.reduce((sum, file) => sum + file.size, 0) ?? 0;
  const favoriteCount = files?.filter((file) => file.isFavorite).length ?? 0;
  const pinnedCount = files?.filter((file) => file.isPinned).length ?? 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="h-3 bg-gray-300 rounded w-32 mb-3 animate-pulse" />
            <div className="h-8 bg-gray-300 rounded w-48 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-300 rounded-lg w-28 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (files?.length === 0) {
    return <EmptyState orgId={orgId} />;
  }

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="workspace-kicker mb-2">
              {organization?.name ?? "Personal"} / {filteredFiles?.length || 0} files
            </p>
            <h1 className="workspace-title">
              Your Files
            </h1>
            <p className="workspace-subtitle mt-2">Upload, preview, organize, and ask AI about your files.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {files?.length ?? 0} files
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {formatFileSize(totalSize)} used
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {favoriteCount} favorites
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {pinnedCount} pinned
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
            <SearchComponent 
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              resultCount={filteredFiles?.length || 0}
            />
            <FileViewToggle value={viewMode} onChange={setViewMode} />
            <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
            {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
            <UploadButton orgId={orgId} />
          </div>
        </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles?.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(file._id)}
                onSelectionChange={(selectedFile) => toggleSelectedFile(selectedFile._id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-4 px-3 text-xs font-medium uppercase tracking-wide text-gray-400 sm:grid-cols-[minmax(0,1fr)_88px_72px] md:grid-cols-[minmax(0,1fr)_88px_110px_72px]">
              <span>Name</span>
              <span className="hidden sm:block">Size</span>
              <span className="hidden md:block">Added</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredFiles?.map((file) => (
              <FileListItem
                key={file._id}
                file={file}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(file._id)}
                onSelectionChange={(selectedFile) => toggleSelectedFile(selectedFile._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

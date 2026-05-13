"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Star } from "lucide-react";
import { useState } from "react";
import { EmptySketch } from "@/app/empty-sketch";
import { FileCard as DriveFileCard, FileListItem } from "@/app/file-card";
import { FileViewMode, FileViewToggle } from "@/app/file-view-toggle";
import { DeleteSelectedButton } from "@/app/delete-selected-button";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { useFileMultiSelect } from "@/app/use-file-multi-select";

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

function EmptyFavoritesState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="empty-reveal"><EmptySketch tone="favorite" /></div>
      <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-950 empty-reveal empty-reveal-delay-1">No favorites yet</h2>
      <p className="text-gray-500 text-lg empty-reveal empty-reveal-delay-2">Starred files will be collected here for quick access.</p>
    </div>
  );
}


export default function FavoritesPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, deleteSelectedFiles } = useFileMultiSelect();
  const files = useQuery(api.files.getFiles, { orgId });
  const isLoading = files === undefined;

  const favoriteFiles = files?.filter((file) => file.isFavorite === true);

  return (
    <div className="workspace-page">
      {isLoading ? (
        <div className="workspace-container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="h-3 bg-gray-300 rounded w-32 mb-3 animate-pulse" />
              <div className="h-8 bg-gray-300 rounded w-48 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : favoriteFiles?.length === 0 ? (
        <EmptyFavoritesState />
      ) : (
        <div className="workspace-container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <p className="workspace-kicker empty-reveal empty-reveal-delay-2">
                  {organization?.name ?? "Personal"} / {favoriteFiles?.length || 0} favorites
                </p>
              </div>
              <h1 className="workspace-title">
                Your Favorites
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <FileViewToggle value={viewMode} onChange={setViewMode} />
              <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
              {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favoriteFiles?.map((file) => (
                <DriveFileCard
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
              {favoriteFiles?.map((file) => (
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
      )}
    </div>
  );
}






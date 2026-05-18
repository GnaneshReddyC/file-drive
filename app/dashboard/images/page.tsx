"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileCard, FileListItem } from "@/app/file-card";
import { FileViewMode, FileViewToggle } from "@/app/file-view-toggle";
import { DeleteSelectedButton } from "@/app/delete-selected-button";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { useFileMultiSelect } from "@/app/use-file-multi-select";
import { EmptySketch } from "@/app/empty-sketch";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export default function ImagesPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, selectAllFiles, clearSelectedFiles, deleteSelectedFiles } = useFileMultiSelect();
  const files = useQuery(api.files.getFiles, { orgId });

  const imageFiles = files?.filter((file) => 
    file.type?.startsWith("image/") || 
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(file.name?.split(".").pop()?.toLowerCase() ?? '')
  );
  const selectableFileIds = imageFiles?.map((file) => file._id) ?? [];
  const hasSelectableFiles = selectableFileIds.length > 0;
  const areAllSelectableFilesSelected = hasSelectableFiles && selectableFileIds.every((id) => selectedIds.has(id));

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-5 h-5 text-rose-500" />
              <p className="workspace-kicker empty-reveal empty-reveal-delay-2">
                {organization?.name ?? "Personal"} / {imageFiles?.length || 0} images
              </p>
            </div>
            <h1 className="workspace-title">
              Images
            </h1>
          </div>
          {(imageFiles?.length || 0) > 0 && (
            <div className="flex items-center gap-3">
              <FileViewToggle value={viewMode} onChange={setViewMode} />
              <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
              {hasSelectableFiles && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isSelecting}
                  onClick={() => (areAllSelectableFilesSelected ? clearSelectedFiles() : selectAllFiles(selectableFileIds))}
                >
                  {areAllSelectableFilesSelected ? "Clear" : "Select all"}
                </Button>
              )}
              {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
            </div>
          )}
        </div>

        {imageFiles?.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="empty-reveal"><EmptySketch tone="image" /></div>
            <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-950 empty-reveal empty-reveal-delay-1">No images yet</h2>
            <p className="text-gray-500 text-lg empty-reveal empty-reveal-delay-2">Image files will appear here when you upload them.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {imageFiles?.map((file) => (
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
            {imageFiles?.map((file) => (
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



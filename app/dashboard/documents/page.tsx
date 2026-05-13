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
import { FileText } from "lucide-react";
import { useState } from "react";

export default function DocumentsPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, deleteSelectedFiles } = useFileMultiSelect();
  const files = useQuery(api.files.getFiles, { orgId });

  const documentFiles = files?.filter((file) => {
    const ext = file.name?.split(".").pop()?.toLowerCase();
    return file.type?.startsWith("text/") || 
      ["txt", "md", "doc", "docx", "odt", "rtf", "tex"].includes(ext || "");
  });

  if (files === undefined) {
    return (
      <div className="workspace-container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
              <div className="h-1 w-full bg-gray-300" />
              <div className="h-28 bg-gray-200" />
              <div className="p-3">
                <div className="h-3 bg-gray-300 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <p className="workspace-kicker empty-reveal empty-reveal-delay-2">
                {organization?.name ?? "Personal"} / {documentFiles?.length || 0} documents
              </p>
            </div>
            <h1 className="workspace-title">
              Documents
            </h1>
          </div>
          {(documentFiles?.length || 0) > 0 && (
            <div className="flex items-center gap-3">
              <FileViewToggle value={viewMode} onChange={setViewMode} />
              <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
              {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
            </div>
          )}
        </div>

        {documentFiles?.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="empty-reveal"><EmptySketch tone="document" /></div>
            <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-950 empty-reveal empty-reveal-delay-1">No documents found</h2>
            <p className="text-gray-500 text-lg empty-reveal empty-reveal-delay-2">Documents will appear here.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {documentFiles?.map((file) => (
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
            {documentFiles?.map((file) => (
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


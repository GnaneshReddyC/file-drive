"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrashFileCard } from "@/app/trash-file-card";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { EmptySketch } from "@/app/empty-sketch";
import Link from "next/link";
import { RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

function getToastErrorMessage(error: unknown) {
  const data = error && typeof error === "object" && "data" in error ? error.data : undefined;
  if (typeof data === "string") return data;
  return error instanceof Error ? error.message : "Something went wrong, please try again.";
}

export default function TrashPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const deletedFiles = useQuery(api.files.getTrashFiles, { orgId });
  const restoreFile = useMutation(api.files.restoreFile);
  const permanentDeleteFile = useMutation(api.files.permanentDeleteFile);
  const restoreFiles = useMutation(api.files.restoreFiles);
  const permanentDeleteFiles = useMutation(api.files.permanentDeleteFiles);
  
  const [restoring, setRestoring] = useState<Id<"files"> | null>(null);
  const [deleting, setDeleting] = useState<Id<"files"> | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"files">>>(new Set());

  const toggleSelecting = () => {
    setIsSelecting((current) => {
      if (current) setSelectedIds(new Set());
      return !current;
    });
  };

  const toggleSelectedFile = (fileId: Id<"files">) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleRestore = async (fileId: Id<"files">) => {
    setRestoring(fileId);
    try {
      const restoredFile = await restoreFile({ id: fileId });
      if (!restoredFile.success) {
        toast.error("Failed to restore file", {
          description: restoredFile.message,
        });
        return;
      }

      toast.success("File restored");
    } catch (error) {
      toast.error("Failed to restore file", {
        description: getToastErrorMessage(error),
      });
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (fileId: Id<"files">) => {
    setDeleting(fileId);
    try {
      await permanentDeleteFile({ id: fileId });
      toast.success("File permanently deleted");
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  const handleRestoreSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const result = await restoreFiles({ ids });
      if (!result.success) {
        toast.error("Failed to restore selected files", {
          description: result.message,
        });
        return;
      }

      toast.success(`${ids.length} file${ids.length === 1 ? "" : "s"} restored`);
      setSelectedIds(new Set());
      setIsSelecting(false);
    } catch (error) {
      toast.error("Failed to restore selected files", {
        description: getToastErrorMessage(error),
      });
    }
  };

  const handlePermanentDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await permanentDeleteFiles({ ids });
      toast.success(`${ids.length} file${ids.length === 1 ? "" : "s"} permanently deleted`);
      setSelectedIds(new Set());
      setIsSelecting(false);
    } catch (error) {
      toast.error("Failed to delete selected files", {
        description: getToastErrorMessage(error),
      });
    }
  };

  if (deletedFiles === undefined) {
    return (
      <div className="workspace-container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(3)].map((_, i) => (
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
              <Trash2 className="w-5 h-5 text-red-500" />
              <p className="workspace-kicker empty-reveal empty-reveal-delay-2">
                {organization?.name ?? "Personal"} / {deletedFiles?.length || 0} deleted files
              </p>
            </div>
            <h1 className="workspace-title">Trash</h1> 
          </div>
          {deletedFiles.length > 0 && (
            <div className="flex items-center gap-3">
              <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleRestoreSelected}
                    className="inline-flex h-10 min-w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="Restore selected files"
                    title="Restore selected files"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePermanentDeleteSelected}
                    className="inline-flex h-10 min-w-12 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="Delete selected files forever"
                    title="Delete selected files forever"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {deletedFiles?.length === 0 ? (

          <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="empty-state w-full max-w-xl px-8 py-12 text-center">
              <div className="empty-reveal"><EmptySketch tone="trash" /></div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 empty-reveal empty-reveal-delay-1">Trash is empty</h2>
              <p className="mt-3 text-sm text-slate-600 empty-reveal empty-reveal-delay-2">Deleted files will appear here for 30 days before permanent removal.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Go to files
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {deletedFiles?.map((file) => (
              <TrashFileCard
                key={file._id}
                file={file}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                isRestoring={restoring === file._id}
                isDeleting={deleting === file._id}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(file._id)}
                onSelectionChange={toggleSelectedFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



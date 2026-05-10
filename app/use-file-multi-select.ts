"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useFileMultiSelect() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"files">>>(new Set());
  const deleteFiles = useMutation(api.files.deleteFiles);
  const moveFiles = useMutation(api.files.moveFiles);

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

  const deleteSelectedFiles = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await deleteFiles({ ids });
      toast.success(`${ids.length} file${ids.length === 1 ? "" : "s"} moved to trash`);
      setSelectedIds(new Set());
      setIsSelecting(false);
    } catch {
      toast.error("Failed to delete selected files");
    }
  };

  const moveSelectedFiles = async (folderId?: Id<"folders"> | null) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return false;

    try {
      const result = await moveFiles({ ids, folderId });
      if (!result.success) {
        toast.error("Failed to move selected files", {
          description: result.message,
        });
        return false;
      }

      toast.success(`${ids.length} file${ids.length === 1 ? "" : "s"} moved`);
      setSelectedIds(new Set());
      setIsSelecting(false);
      return true;
    } catch {
      toast.error("Failed to move selected files");
      return false;
    }
  };

  return {
    isSelecting,
    selectedIds,
    toggleSelecting,
    toggleSelectedFile,
    deleteSelectedFiles,
    moveSelectedFiles,
  };
}

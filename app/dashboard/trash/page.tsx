"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrashFileCard } from "@/app/trash-file-card";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrashPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const deletedFiles = useQuery(api.files.getTrashFiles, { orgId });
  const restoreFile = useMutation(api.files.restoreFile);
  const permanentDeleteFile = useMutation(api.files.permanentDeleteFile);
  
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleRestore = async (fileId: string) => {
    setRestoring(fileId);
    try {
      await restoreFile({ id: fileId as any });
      toast.success("File restored");
    } catch (error) {
      toast.error("Failed to restore file");
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (fileId: string) => {
    setDeleting(fileId);
    try {
      await permanentDeleteFile({ id: fileId as any });
      toast.success("File permanently deleted");
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  if (deletedFiles === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase">
              {organization?.name ?? "Personal"} · {deletedFiles?.length || 0} deleted files
            </p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
          <p className="text-gray-500 text-sm mt-1">Files here are kept for 30 days before permanent deletion</p>
        </div>

        {deletedFiles?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trash2 className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm">Trash is empty</p>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
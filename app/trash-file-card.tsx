"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckSquare, FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, MoreVertical, RefreshCw, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Doc, Id } from "@/convex/_generated/dataModel";

type FileDocument = Doc<"files">;

interface TrashFileCardProps {
  file: FileDocument;
  onRestore: (fileId: Id<"files">) => void;
  onPermanentDelete: (fileId: Id<"files">) => void;
  isRestoring: boolean;
  isDeleting: boolean;
  isSelecting?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (fileId: Id<"files">) => void;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return <ImageIcon className="w-8 h-8" />;
  if (["mp4", "mov", "avi", "mkv"].includes(ext ?? "")) return <VideoIcon className="w-8 h-8" />;
  if (["mp3", "wav", "flac"].includes(ext ?? "")) return <MusicIcon className="w-8 h-8" />;
  if (["pdf", "doc", "docx", "txt"].includes(ext ?? "")) return <FileTextIcon className="w-8 h-8" />;
  return <FileIcon className="w-8 h-8" />;
}

function getFileColor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return "bg-[#eef2ff]";
  if (["mp4", "mov", "avi", "mkv"].includes(ext ?? "")) return "bg-[#e0e7ff]";
  if (["mp3", "wav", "flac"].includes(ext ?? "")) return "bg-[#fef3c7]";
  if (["pdf", "doc", "docx", "txt"].includes(ext ?? "")) return "bg-[#dbeafe]";
  return "bg-[#dcfce7]";
}

export function TrashFileCard({
  file,
  onRestore,
  onPermanentDelete,
  isRestoring,
  isDeleting,
  isSelecting = false,
  isSelected = false,
  onSelectionChange,
}: TrashFileCardProps) {
  const { membership, organization } = useOrganization();
  const orgId = organization?.id || "";
  const canManage = !orgId || membership?.role === "org:admin";
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRestore = () => {
    onRestore(file._id);
  };

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    onPermanentDelete(file._id);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="file-card group relative overflow-hidden border border-gray-200 bg-white">
        {isSelecting && (
          <button
            type="button"
            onClick={() => onSelectionChange?.(file._id)}
            className="absolute left-2 top-2 z-10 rounded-md bg-white/85 p-1.5 text-slate-700 transition hover:bg-white"
            aria-label={isSelected ? "Deselect file" : "Select file"}
            title={isSelected ? "Deselect file" : "Select file"}
          >
            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        )}
        <div className={`relative flex h-24 items-center justify-center ${getFileColor(file.name)}`}>
          <span className="absolute right-2 top-2 rounded border border-indigo-200 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-indigo-600">
            {file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
          </span>
          <div className="text-indigo-500">{getFileIcon(file.name)}</div>
        </div>
        <div className="p-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-slate-800" title={file.name}>
              {file.name}
            </p>
            <p className="mt-1 text-[12px] text-slate-500 uppercase tracking-[0.04em]">
              {file.name.split(".").pop() ?? "file"}
            </p>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-slate-200 bg-white text-slate-800 shadow-lg">
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 focus:bg-slate-100 focus:text-slate-900"
                  onClick={handleRestore}
                  disabled={isRestoring}
                >
                  <RefreshCw className={`w-4 h-4 ${isRestoring ? "animate-spin" : ""}`} />
                  {isRestoring ? "Restoring..." : "Restore"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-600"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete Forever"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This file will be permanently deleted from storage and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Yes, delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

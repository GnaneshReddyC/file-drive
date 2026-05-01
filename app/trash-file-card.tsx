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
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return "from-rose-400 to-pink-600";
  if (["mp4", "mov", "avi", "mkv"].includes(ext ?? "")) return "from-violet-400 to-purple-600";
  if (["mp3", "wav", "flac"].includes(ext ?? "")) return "from-amber-400 to-orange-500";
  if (["pdf", "doc", "docx", "txt"].includes(ext ?? "")) return "from-sky-400 to-blue-600";
  return "from-emerald-400 to-teal-600";
}

export function TrashFileCard({ file, onRestore, onPermanentDelete, isRestoring, isDeleting }: any) {
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
      <div className="file-card group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg">
        <div className={`h-1 w-full bg-gradient-to-r ${getFileColor(file.name)}`} />
        <div className={`flex items-center justify-center h-28 bg-gradient-to-br ${getFileColor(file.name)} opacity-90`}>
          <div className="text-white">{getFileIcon(file.name)}</div>
        </div>
        <div className="p-3 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-gray-800 text-xs font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider">
              {file.name.split(".").pop() ?? "file"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-700 p-0.5 rounded flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2"
                onClick={handleRestore}
                disabled={isRestoring}
              >
                <RefreshCw className={`w-4 h-4 ${isRestoring ? "animate-spin" : ""}`} />
                {isRestoring ? "Restoring..." : "Restore"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 cursor-pointer flex items-center gap-2"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete Forever"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
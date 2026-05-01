"use client";

import { useState } from "react";
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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, MoreVertical, Trash2, Download, Star } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { FilePreviewModal } from "@/components/file-preview-modal";

function getFileIcon(fileType: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  if (fileType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) {
    return <ImageIcon className="w-8 h-8" />;
  }
  if (fileType?.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) {
    return <VideoIcon className="w-8 h-8" />;
  }
  if (fileType?.startsWith("audio/") || ["mp3", "wav", "flac", "aac", "ogg"].includes(ext ?? "")) {
    return <MusicIcon className="w-8 h-8" />;
  }
  if (fileType === "application/pdf" || ext === "pdf") {
    return <FileTextIcon className="w-8 h-8" />;
  }
  if (fileType?.startsWith("text/") || ["txt", "md", "doc", "docx"].includes(ext ?? "")) {
    return <FileTextIcon className="w-8 h-8" />;
  }
  return <FileIcon className="w-8 h-8" />;
}

function getFileColor(fileType: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  if (fileType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) {
    return "from-rose-400 to-pink-600";
  }
  if (fileType?.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) {
    return "from-violet-400 to-purple-600";
  }
  if (fileType?.startsWith("audio/") || ["mp3", "wav", "flac", "aac", "ogg"].includes(ext ?? "")) {
    return "from-amber-400 to-orange-500";
  }
  if (fileType === "application/pdf" || ext === "pdf") {
    return "from-red-400 to-rose-600";
  }
  if (fileType?.startsWith("text/") || ["txt", "md", "doc", "docx"].includes(ext ?? "")) {
    return "from-sky-400 to-blue-600";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext ?? "")) {
    return "from-gray-500 to-gray-700";
  }
  return "from-emerald-400 to-teal-600";
}

function FileDropdownMenu({ fileId, fileUrl }: { fileId: Id<"files">; fileUrl?: string }) {
  const deleteFile = useMutation(api.files.deleteFile);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<Id<"files"> | null>(null);

  const handleDeleteClick = (id: Id<"files">) => {
    setFileToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      try {
        await deleteFile({ id: fileToDelete });
        toast.success("File deleted successfully");
        setDeleteDialogOpen(false);
        setFileToDelete(null);
      } catch (error) {
        toast.error("Failed to delete file");
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-gray-400 hover:text-gray-700 p-0.5 rounded flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => window.open(fileUrl ?? "#", "_blank")}
          >
            <Download className="w-4 h-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 cursor-pointer flex items-center gap-2"
            onClick={() => handleDeleteClick(fileId)}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This file will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function FileCard({ file }: { file: any }) {
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const [isFavorited, setIsFavorited] = useState(file.isFavorite);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newState = await toggleFavorite({ id: file._id as Id<"files"> });
      setIsFavorited(newState);
      toast.success(newState ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  return (
    <>
      <div
        className="file-card group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer"
        onClick={() => setPreviewOpen(true)}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${getFileColor(file.type, file.name)}`} />
        <div className={`flex items-center justify-center h-28 bg-gradient-to-br ${getFileColor(file.type, file.name)} opacity-90 relative`}>
          <div className="text-white">{getFileIcon(file.type, file.name)}</div>
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-all backdrop-blur-sm z-10"
          >
            <Star className={`w-4 h-4 ${isFavorited ? "fill-yellow-500 text-yellow-500" : "text-white"}`} />
          </button>
        </div>
        <div className="p-3 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-gray-800 text-xs font-medium truncate" title={file.name}>
              {file.name}
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FileDropdownMenu fileId={file._id as Id<"files">} fileUrl={file.url} />
          </div>
        </div>
      </div>

      <FilePreviewModal file={file} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
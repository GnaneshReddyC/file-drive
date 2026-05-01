"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FilePreviewModalProps {
  file: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getFileType(file: any) {
  const ext = file.name?.split(".").pop()?.toLowerCase();
  if (file.type?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (file.type?.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (file.type?.startsWith("audio/") || ["mp3", "wav", "flac", "aac", "ogg"].includes(ext)) return "audio";
  if (file.type === "application/pdf" || ext === "pdf") return "pdf";
  if (file.type?.startsWith("text/") || ["txt", "md", "json", "xml", "css", "js"].includes(ext)) return "text";
  return "other";
}

export function FilePreviewModal({ file, open, onOpenChange }: FilePreviewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fetchedUrl = useQuery(api.files.getFileUrl, file?.fileId ? { storageId: file.fileId } : "skip");
  const fileType = file ? getFileType(file) : "other";

  useEffect(() => {
    if (fetchedUrl) {
      setFileUrl(fetchedUrl);
    } else if (file?.url) {
      setFileUrl(file.url);
    }
  }, [fetchedUrl, file]);

  if (!file) return null;

  const renderPreview = () => {
    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-pulse">Loading preview...</div>
        </div>
      );
    }

    switch (fileType) {
      case "image":
        return (
          <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
            <img src={fileUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          </div>
        );
      case "video":
        return (
          <video controls className="w-full max-h-[70vh] rounded-lg">
            <source src={fileUrl} type={file.type || "video/mp4"} />
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return (
          <audio controls className="w-full">
            <source src={fileUrl} type={file.type || "audio/mpeg"} />
          </audio>
        );
      case "pdf":
        return (
          <iframe src={`${fileUrl}#toolbar=1`} className="w-full h-[70vh] rounded-lg" title={file.name} />
        );
      case "text":
        return (
          <div className="w-full h-[70vh] overflow-auto bg-gray-50 rounded-lg p-4 border">
            <pre className="text-sm whitespace-pre-wrap font-mono">{fileUrl ? "Loading content..." : "No content"}</pre>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FileIcon className="w-20 h-20 text-gray-400" />
            <p className="text-gray-500">Preview not available for this file type</p>
            <a
              href={fileUrl}
              download={file.name}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Download file
            </a>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate pr-8">
            <span className="truncate">{file.name}</span>
            <span className="text-xs text-gray-400 font-normal">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
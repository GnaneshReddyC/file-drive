"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function UploadButton({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [titleError, setTitleError] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFile = useMutation(api.files.createFile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { isAuthenticated, isLoading } = useConvexAuth();

  function getFileType(file: File): string {
    const ext = file.name.split(".").pop()?.toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return "image";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) return "video";
    if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext ?? "")) return "audio";
    if (["pdf"].includes(ext ?? "")) return "pdf";
    if (["doc", "docx"].includes(ext ?? "")) return "document";
    if (["txt", "md"].includes(ext ?? "")) return "text";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext ?? "")) return "archive";
    
    return "other";
  }

  async function handleSubmit() {
    if (isLoading) {
      toast.info("Checking session", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    if (!isAuthenticated) {
      toast.error("You need to sign in first", {
        description: "Your session is not authenticated with Convex.",
      });
      return;
    }

    setTitleError("");
    setFileError("");
    let hasError = false;
    if (!title || title.length < 1) {
      setTitleError("String must contain at least 1 character(s)");
      hasError = true;
    }
    if (!file) {
      setFileError("Required");
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    
    try {
      const fileType = getFileType(file!);
      
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file!.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      await createFile({ 
        name: title, 
        orgId, 
        type: file?.type ?? "application/octet-stream",
        fileType: fileType,
        fileId: storageId,
        url: "", 
        size: file?.size ?? 0,
      });
      
      toast.success("File Uploaded");
      setOpen(false);
      setTitle("");
      setFile(null);
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Something went wrong, please try again.";
      const message =
        rawMessage.includes("Not authenticated") || rawMessage.includes("Not authorized")
          ? 'Session not ready. Sign in again and make sure Clerk JWT template "convex" is configured.'
          : rawMessage;

      toast.error("Upload Failed", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gray-900 text-white hover:bg-gray-700 px-5 py-2 rounded-lg text-sm font-medium"
      >
        Upload File
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload your File Here</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <Label className="text-red-500 text-sm">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              {titleError && <p className="text-red-500 text-xs">{titleError}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-red-500 text-sm">File</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all ${
                  isDragging ? "border-gray-900 bg-gray-100" : "border-gray-300 hover:border-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    📁
                  </div>
                  {file ? (
                    <>
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {getFileType(file)} • {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">Drop your file here</p>
                      <p className="text-xs text-gray-400">or click to browse</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {fileError && <p className="text-red-500 text-xs">{fileError}</p>}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gray-900 text-white w-32"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

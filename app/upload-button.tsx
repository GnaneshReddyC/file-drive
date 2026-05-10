"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud, X } from "lucide-react";

function getToastErrorMessage(error: unknown) {
  const data = error && typeof error === "object" && "data" in error ? error.data : undefined;
  if (typeof data === "string") return data;
  return error instanceof Error ? error.message : "Something went wrong, please try again.";
}

export function UploadButton({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [titleError, setTitleError] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFile = useMutation(api.files.createFile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { isAuthenticated, isLoading } = useConvexAuth();

  const selectedFileCount = files.length;
  const isBatchUpload = selectedFileCount > 1;

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

  function resetDialog() {
    setTitle("");
    setFiles([]);
    setTitleError("");
    setFileError("");
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

    const trimmedTitle = title.trim();
    let hasError = false;

    if (selectedFileCount === 0) {
      setFileError("Select at least one file");
      hasError = true;
    }

    if (!isBatchUpload && !trimmedTitle) {
      setTitleError("String must contain at least 1 character(s)");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      for (const selectedFile of files) {
        const fileType = getFileType(selectedFile);
        const uploadUrl = await generateUploadUrl({ orgId });

        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });

        const { storageId } = await result.json();

        const createdFile = await createFile({
          name: isBatchUpload ? selectedFile.name : trimmedTitle,
          orgId,
          type: selectedFile.type || "application/octet-stream",
          fileType,
          fileId: storageId,
          url: "",
          size: selectedFile.size,
        });

        if (!createdFile.success) {
          toast.error("Upload Failed", {
            description: `${selectedFile.name}: ${createdFile.message}`,
          });
          return;
        }
      }

      toast.success(isBatchUpload ? `${selectedFileCount} files uploaded` : "File Uploaded");
      setOpen(false);
      resetDialog();
    } catch (error) {
      const rawMessage = getToastErrorMessage(error);
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
    handleFileSelection(e.dataTransfer.files);
  }

  function handleFileSelection(fileList: FileList | null) {
    const selectedFiles = Array.from(fileList ?? []);
    setFiles(selectedFiles);
    setFileError("");
    if (selectedFiles.length > 1) setTitleError("");
  }

  function removeSelectedFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="primary-action h-10 gap-2 px-4 text-sm font-semibold"
      >
        <UploadCloud className="size-4" />
        Upload File
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) resetDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              Select one file with a custom title, or select multiple files to keep their original names.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm text-slate-700">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isBatchUpload ? "Batch uploads use original file names" : "Enter file title"}
                disabled={isBatchUpload}
              />
              {titleError && <p className="text-xs text-red-500">{titleError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm text-slate-700">Files</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                data-dragging={isDragging}
                className={`upload-zone cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="upload-icon flex size-11 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <UploadCloud className="size-5" />
                  </div>
                  {selectedFileCount > 0 ? (
                    <>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedFileCount} file{selectedFileCount === 1 ? "" : "s"} selected
                      </p>
                      <p className="text-xs text-gray-400">
                        {isBatchUpload
                          ? "Files will keep their original names"
                          : `${getFileType(files[0])} • ${(files[0].size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">Drop your files here</p>
                      <p className="text-xs text-gray-400">or click to browse</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelection(e.target.files)}
                />
              </div>
              {fileError && <p className="text-xs text-red-500">{fileError}</p>}
              {selectedFileCount > 0 && (
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                  {files.map((selectedFile, index) => (
                    <div
                      key={`${selectedFile.name}-${selectedFile.lastModified}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                        aria-label={`Remove ${selectedFile.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="primary-action w-32"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
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

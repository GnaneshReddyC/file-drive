"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckSquare, FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, MoreVertical, Trash2, Download, Star, Pencil, Square, Pin, PinOff, Share2, FolderInput } from "lucide-react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { FilePreviewModal } from "@/components/file-preview-modal";
import { useOrganization } from "@clerk/nextjs";

type FileDocument = Doc<"files">;

function getToastErrorMessage(error: unknown) {
  const data = error && typeof error === "object" && "data" in error ? error.data : undefined;
  if (typeof data === "string") return data;
  return error instanceof Error ? error.message : "Something went wrong, please try again.";
}

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
    return "bg-[#eef2ff]";
  }
  if (fileType?.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext ?? "")) {
    return "bg-[#e0e7ff]";
  }
  if (fileType?.startsWith("audio/") || ["mp3", "wav", "flac", "aac", "ogg"].includes(ext ?? "")) {
    return "bg-[#fef3c7]";
  }
  if (fileType === "application/pdf" || ext === "pdf") {
    return "bg-[#fee2e2]";
  }
  if (fileType?.startsWith("text/") || ["txt", "md", "doc", "docx"].includes(ext ?? "")) {
    return "bg-[#dbeafe]";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext ?? "")) {
    return "bg-[#e5e7eb]";
  }
  return "bg-[#dcfce7]";
}

function getFileTypeLabel(file: FileDocument) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (ext || file.type?.split("/")[1] || "file").toUpperCase();
}

function formatFileSize(size: number) {
  if (!size) return "0B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

function formatFileDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function FileDropdownMenu({ file }: { file: FileDocument }) {
  const deleteFile = useMutation(api.files.deleteFile);
  const renameFile = useMutation(api.files.renameFile);
  const togglePin = useMutation(api.files.togglePin);
  const createShareLink = useMutation(api.files.createShareLink);
  const moveFile = useMutation(api.files.moveFile);
  const { membership, organization } = useOrganization();
  const orgId = organization?.id || "";
  const canDelete = !orgId || membership?.role === "org:admin";
  const canRename = !orgId || membership?.role === "org:admin";
  const canPin = !orgId || membership?.role === "org:admin";
  const canMove = !orgId || membership?.role === "org:admin";
  const folders = useQuery(api.files.getAllFolders, { orgId });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<Id<"files"> | null>(null);
  const [newFileName, setNewFileName] = useState(file.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareExpiresInDays, setShareExpiresInDays] = useState(7);
  const [shareUrl, setShareUrl] = useState("");
  const [shareExpiresAt, setShareExpiresAt] = useState<number | null>(null);
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);
  const fileId = file._id as Id<"files">;
  const isPinned = Boolean(file.isPinned);
  const shareExpiryOptions = [1, 7, 14, 30];

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
      } catch {
        toast.error("Failed to delete file");
      }
    }
  };

  const handleRenameOpenChange = (open: boolean) => {
    setRenameDialogOpen(open);
    if (open) {
      setNewFileName(file.name);
    }
  };

  const handleRenameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newFileName.trim();
    if (!trimmedName) {
      toast.error("File name is required");
      return;
    }

    if (trimmedName === file.name) {
      setRenameDialogOpen(false);
      return;
    }

    try {
      setIsRenaming(true);
      const renamedFile = await renameFile({ id: fileId, name: trimmedName });
      if (!renamedFile.success) {
        toast.error("Failed to rename file", {
          description: renamedFile.message,
        });
        return;
      }

      toast.success("File renamed successfully");
      setRenameDialogOpen(false);
    } catch (error) {
      const message = getToastErrorMessage(error);
      toast.error("Failed to rename file", {
        description: message,
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      setIsPinning(true);
      const newState = await togglePin({ id: fileId });
      toast.success(newState ? "File pinned" : "File unpinned");
    } catch (error) {
      const message = getToastErrorMessage(error);
      toast.error("Failed to update pin", {
        description: message,
      });
    } finally {
      setIsPinning(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) {
      toast.error("No share link available for this file");
      return;
    }

    try {
      await copyText(shareUrl);
      toast.success("Share link copied");
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  const handleCreateShareLink = async () => {
    try {
      setIsCreatingShareLink(true);
      const share = await createShareLink({ id: fileId, expiresInDays: shareExpiresInDays });
      const url = `${window.location.origin}/share/${share.shareId}`;
      setShareUrl(url);
      setShareExpiresAt(share.expiresAt);
      await copyText(url);
      toast.success("Share link created and copied");
    } catch (error) {
      const message = getToastErrorMessage(error);
      toast.error("Failed to create share link", {
        description: message,
      });
    } finally {
      setIsCreatingShareLink(false);
    }
  };

  const handleMoveFile = async (folderId?: Id<"folders"> | null) => {
    try {
      setIsMoving(true);
      const result = await moveFile({ id: fileId, folderId });
      if (!result.success) {
        toast.error("Failed to move file", {
          description: result.message,
        });
        return;
      }

      toast.success(folderId ? "File moved to folder" : "File moved to root");
      setMoveDialogOpen(false);
    } catch (error) {
      const message = getToastErrorMessage(error);
      toast.error("Failed to move file", {
        description: message,
      });
    } finally {
      setIsMoving(false);
    }
  };

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`More actions for ${file.name}`}
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-slate-200 bg-white text-slate-800 shadow-lg">
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 focus:bg-slate-100 focus:text-slate-900"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            Share link
          </DropdownMenuItem>
          {canRename && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 focus:bg-slate-100 focus:text-slate-900"
              onClick={() => handleRenameOpenChange(true)}
            >
              <Pencil className="w-4 h-4" />
              Rename
            </DropdownMenuItem>
          )}
          {canMove && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 focus:bg-slate-100 focus:text-slate-900"
              onClick={() => {
                if (file.folderId) {
                  void handleMoveFile(null);
                  return;
                }

                setMoveDialogOpen(true);
              }}
              disabled={isMoving}
              aria-label={file.folderId ? "Move file out" : "Move file to folder"}
              title={file.folderId ? "Move out" : "Move to folder"}
            >
              <FolderInput className="w-4 h-4" />
              {file.folderId ? "Move out" : "Move to folder"}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-600"
              onClick={() => handleDeleteClick(fileId)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameDialogOpen} onOpenChange={handleRenameOpenChange}>
        <DialogContent>
          <form onSubmit={handleRenameSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename file</DialogTitle>
              <DialogDescription>Enter a new name for this file.</DialogDescription>
            </DialogHeader>
            <Input
              value={newFileName}
              onChange={(event) => setNewFileName(event.target.value)}
              autoFocus
              disabled={isRenaming}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenaming}>
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move file</DialogTitle>
            <DialogDescription>Choose where to place this file.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {folders === undefined ? (
              <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
                Loading folders...
              </p>
            ) : folders.length === 0 ? (
              <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
                No folders yet.
              </p>
            ) : (
              folders.map((folder) => (
                <Button
                  key={folder._id}
                  type="button"
                  variant={file.folderId === folder._id ? "default" : "outline"}
                  onClick={() => handleMoveFile(folder._id)}
                  disabled={isMoving || file.folderId === folder._id}
                  className="justify-start"
                >
                  {folder.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>
              Create a link that expires automatically after the selected number of days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-2">
              {shareExpiryOptions.map((days) => (
                <Button
                  key={days}
                  type="button"
                  variant={shareExpiresInDays === days ? "default" : "outline"}
                  onClick={() => setShareExpiresInDays(days)}
                >
                  {days}d
                </Button>
              ))}
            </div>
            <Button type="button" onClick={handleCreateShareLink} disabled={isCreatingShareLink}>
              {isCreatingShareLink ? "Creating..." : "Create share link"}
            </Button>
            {shareUrl && (
              <div className="grid gap-2">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input value={shareUrl} readOnly onFocus={(event) => event.target.select()} />
                  <Button type="button" onClick={handleCopyShareLink}>
                    Copy
                  </Button>
                </div>
                {shareExpiresAt && (
                  <p className="text-xs text-gray-500">
                    Expires {formatFileDate(shareExpiresAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This file will move to Trash. You can restore it later or delete it forever from the Trash page.
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

type SelectableFileProps = {
  file: FileDocument;
  isSelecting?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (file: FileDocument) => void;
};

export function FileCard({ file, isSelecting = false, isSelected = false, onSelectionChange }: SelectableFileProps) {
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const togglePin = useMutation(api.files.togglePin);
  const getFileDownloadUrl = useMutation(api.files.getFileDownloadUrl);
  const { membership, organization } = useOrganization();
  const orgId = organization?.id || "";
  const canPin = !orgId || membership?.role === "org:admin";
  const [isFavorited, setIsFavorited] = useState(file.isFavorite);
  const [isPinned, setIsPinned] = useState(Boolean(file.isPinned));
  const [isPinning, setIsPinning] = useState(false);
  const [pinPulse, setPinPulse] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardDelay = (String(file._id).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 8) * 30;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), cardDelay);
    return () => clearTimeout(timer);
  }, [cardDelay]);

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

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsPinning(true);
      const nextState = await togglePin({ id: file._id as Id<"files"> });
      setIsPinned(nextState);
      if (nextState) setPinPulse(true);
      toast.success(nextState ? "File pinned" : "File unpinned");
    } catch {
      toast.error("Failed to update pin");
    } finally {
      setIsPinning(false);
    }
  };

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const downloadUrl = await getFileDownloadUrl({ id: file._id as Id<"files"> });
      if (!downloadUrl) {
        toast.error("Download URL is unavailable for this file");
        return;
      }
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Failed to download file", {
        description: getToastErrorMessage(error),
      });
    }
  };

  return (
    <>
      <div
        className={`file-card file-card-neo group relative cursor-pointer overflow-hidden border ${isSelected ? "ring-1 ring-[#6366f1]" : ""} ${isVisible ? "card-enter-in" : "card-enter"}`}
        onClick={() => {
          if (isSelecting) {
            onSelectionChange?.(file);
            return;
          }
          setPreviewOpen(true);
        }}
      >
        {isSelecting && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectionChange?.(file);
            }}
            className="absolute left-2 top-2 z-10 rounded-md bg-white/85 p-1.5 text-slate-700 transition hover:bg-white"
            aria-label={isSelected ? "Deselect file" : "Select file"}
            title={isSelected ? "Deselect file" : "Select file"}
          >
            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        )}
        <div className={`relative flex h-24 items-center justify-center ${getFileColor(file.type, file.name)}`}>
          <span className="absolute right-2 top-2 rounded border border-indigo-200 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-indigo-600">
            {getFileTypeLabel(file)}
          </span>
          <div className="text-indigo-500">{getFileIcon(file.type, file.name)}</div>
          {isPinned && (
            <div className="absolute left-2 top-2 z-10 rounded-md border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-600 shadow-sm">
              <Pin className="w-4 h-4 fill-indigo-600 text-indigo-600" />
            </div>
          )}
          
        </div>
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-slate-800" title={file.name}>
              {file.name}
            </p>
            <p className="mt-1 truncate text-[12px] text-slate-500" title={formatFileSize(file.size)}>
              {formatFileSize(file.size)}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            {canPin && (
              <button
                onClick={handleTogglePin}
                disabled={isPinning}
                className="rounded p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500 disabled:opacity-50"
                aria-label={isPinned ? "Unpin file" : "Pin file"}
                title={isPinned ? "Unpin file" : "Pin file"}
              >
                <span className={pinPulse ? "pin-pop inline-flex" : "inline-flex"} onAnimationEnd={() => setPinPulse(false)}>
                  {isPinned ? (
                    <PinOff className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <Pin className="w-4 h-4" />
                  )}
                </span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="rounded p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500"
              aria-label="Download file"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="rounded p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={`w-4 h-4 ${isFavorited ? "fill-indigo-500 text-indigo-500" : ""}`} />
            </button>
            <FileDropdownMenu file={file} />
          </div>
        </div>
      </div>

      <FilePreviewModal file={file} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}

export function FileListItem({ file, isSelecting = false, isSelected = false, onSelectionChange }: SelectableFileProps) {
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const togglePin = useMutation(api.files.togglePin);
  const getFileDownloadUrl = useMutation(api.files.getFileDownloadUrl);
  const { membership, organization } = useOrganization();
  const orgId = organization?.id || "";
  const canPin = !orgId || membership?.role === "org:admin";
  const [isFavorited, setIsFavorited] = useState(file.isFavorite);
  const [isPinned, setIsPinned] = useState(Boolean(file.isPinned));
  const [isPinning, setIsPinning] = useState(false);
  const [pinPulse, setPinPulse] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardDelay = (String(file._id).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 8) * 30;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), cardDelay);
    return () => clearTimeout(timer);
  }, [cardDelay]);

  const handleToggleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const newState = await toggleFavorite({ id: file._id as Id<"files"> });
      setIsFavorited(newState);
      toast.success(newState ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const handleTogglePin = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      setIsPinning(true);
      const nextState = await togglePin({ id: file._id as Id<"files"> });
      setIsPinned(nextState);
      if (nextState) setPinPulse(true);
      toast.success(nextState ? "File pinned" : "File unpinned");
    } catch {
      toast.error("Failed to update pin");
    } finally {
      setIsPinning(false);
    }
  };

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const downloadUrl = await getFileDownloadUrl({ id: file._id as Id<"files"> });
      if (!downloadUrl) {
        toast.error("Download URL is unavailable for this file");
        return;
      }
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Failed to download file", {
        description: getToastErrorMessage(error),
      });
    }
  };

  return (
    <>
      <div
        className={`file-list-row group grid min-h-14 grid-cols-[minmax(0,1fr)_72px] items-center gap-4 rounded-lg border px-3 py-2 transition-all duration-150 sm:grid-cols-[minmax(0,1fr)_88px_72px] md:grid-cols-[minmax(0,1fr)_88px_110px_72px] ${isSelected ? "ring-1 ring-[#6366f1]" : ""} ${isVisible ? "card-enter-in" : "card-enter"}`}
        onClick={() => {
          if (isSelecting) {
            onSelectionChange?.(file);
            return;
          }
          setPreviewOpen(true);
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {isSelecting && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectionChange?.(file);
              }}
              className="rounded-md p-1 text-slate-400 transition-colors duration-150 hover:text-indigo-500"
              aria-label={isSelected ? "Deselect file" : "Select file"}
              title={isSelected ? "Deselect file" : "Select file"}
            >
              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
          )}
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${getFileColor(file.type, file.name)} text-indigo-500 [&_svg]:size-5`}>
            {getFileIcon(file.type, file.name)}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              {isPinned && <Pin className="size-3.5 shrink-0 fill-indigo-600 text-indigo-600" />}
              <p className="truncate text-[14px] font-medium text-slate-800" title={file.name}>
                {file.name}
              </p>
            </div>
            <p className="text-[12px] text-slate-500">{getFileTypeLabel(file)}</p>
          </div>
        </div>
        <p className="hidden text-[12px] text-slate-500 sm:block">{formatFileSize(file.size)}</p>
        <p className="hidden text-[12px] text-slate-500 md:block">{formatFileDate(file._creationTime)}</p>
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100" onClick={(event) => event.stopPropagation()}>
          {canPin && (
            <button
              onClick={handleTogglePin}
              disabled={isPinning}
              className="rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500 disabled:opacity-50"
              aria-label={isPinned ? "Unpin file" : "Pin file"}
              title={isPinned ? "Unpin file" : "Pin file"}
            >
              <span className={pinPulse ? "pin-pop inline-flex" : "inline-flex"} onAnimationEnd={() => setPinPulse(false)}>
                {isPinned ? <PinOff className="w-4 h-4 text-indigo-500" /> : <Pin className="w-4 h-4" />}
              </span>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500"
            aria-label="Download file"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleFavorite}
            className="rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:text-indigo-500"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`w-4 h-4 ${isFavorited ? "fill-indigo-500 text-indigo-500" : ""}`} />
          </button>
          <FileDropdownMenu file={file} />
        </div>
      </div>

      <FilePreviewModal file={file} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}






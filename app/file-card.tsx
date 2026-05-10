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

function getFileTypeLabel(file: FileDocument) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (ext || file.type?.split("/")[1] || "file").toUpperCase();
}

function formatFileSize(size: number) {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatFileDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label={`More actions for ${file.name}`}
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => window.open(file.url ?? "#", "_blank")}
          >
            <Download className="w-4 h-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            Share link
          </DropdownMenuItem>
          {canPin && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2"
              onClick={handleTogglePin}
              disabled={isPinning}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              {isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
          )}
          {canRename && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2"
              onClick={() => handleRenameOpenChange(true)}
            >
              <Pencil className="w-4 h-4" />
              Rename
            </DropdownMenuItem>
          )}
          {canMove && (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2"
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
              className="text-red-500 focus:text-red-500 cursor-pointer flex items-center gap-2"
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
        className={`file-card group relative cursor-pointer overflow-hidden border border-gray-200 bg-white ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
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
            className="absolute left-2 top-2 z-10 rounded-md bg-black/55 p-1.5 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/75"
            aria-label={isSelected ? "Deselect file" : "Select file"}
            title={isSelected ? "Deselect file" : "Select file"}
          >
            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        )}
        <div className={`h-1 w-full bg-gradient-to-r ${getFileColor(file.type, file.name)}`} />
        <div className={`flex items-center justify-center h-24 bg-gradient-to-br ${getFileColor(file.type, file.name)} opacity-90 relative`}>
          <div className="text-white">{getFileIcon(file.type, file.name)}</div>
          {file.isPinned && (
            <div className="absolute left-2 top-2 z-10 rounded-md bg-white/90 p-1.5 text-slate-700 shadow-sm backdrop-blur-sm">
              <Pin className="w-4 h-4 fill-slate-700" />
            </div>
          )}
          <button
            onClick={handleToggleFavorite}
            className="absolute right-2 top-2 z-10 rounded-md bg-white/90 p-1.5 text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-yellow-500"
          >
            <Star className={`w-4 h-4 ${isFavorited ? "fill-yellow-500 text-yellow-500" : ""}`} />
          </button>
        </div>
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="text-gray-800 text-xs font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {formatFileSize(file.size)} · {formatFileDate(file._creationTime)}
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
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
  const [isFavorited, setIsFavorited] = useState(file.isFavorite);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  return (
    <>
      <div
        className={`group grid min-h-14 grid-cols-[minmax(0,1fr)_72px] items-center gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2 transition hover:border-gray-300 hover:bg-gray-50 sm:grid-cols-[minmax(0,1fr)_88px_72px] md:grid-cols-[minmax(0,1fr)_88px_110px_72px] dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900 ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
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
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label={isSelected ? "Deselect file" : "Select file"}
              title={isSelected ? "Deselect file" : "Select file"}
            >
              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
          )}
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${getFileColor(file.type, file.name)} text-white [&_svg]:size-5`}>
            {getFileIcon(file.type, file.name)}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              {file.isPinned && <Pin className="size-3.5 shrink-0 fill-slate-500 text-slate-500" />}
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white" title={file.name}>
                {file.name}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getFileTypeLabel(file)}</p>
          </div>
        </div>
        <p className="hidden text-sm text-gray-500 sm:block dark:text-gray-400">{formatFileSize(file.size)}</p>
        <p className="hidden text-sm text-gray-500 md:block dark:text-gray-400">{formatFileDate(file._creationTime)}</p>
        <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <button
            onClick={handleToggleFavorite}
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`w-4 h-4 ${isFavorited ? "fill-yellow-500 text-yellow-500" : ""}`} />
          </button>
          <FileDropdownMenu file={file} />
        </div>
      </div>

      <FilePreviewModal file={file} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}

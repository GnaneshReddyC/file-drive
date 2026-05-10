"use client";

import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadButton } from "@/app/upload-button";
import { FileCard, FileListItem } from "@/app/file-card";
import { FileViewMode, FileViewToggle } from "@/app/file-view-toggle";
import { DeleteSelectedButton } from "@/app/delete-selected-button";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { SearchComponent } from "@/app/search-component";
import { EmptySketch } from "@/app/empty-sketch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Suspense, useState } from "react";
import { useFileMultiSelect } from "@/app/use-file-multi-select";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Folder, FolderInput, FolderPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type FolderDocument = Doc<"folders">;

function formatFileSize(size: number) {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function EmptyState({ orgId }: { orgId: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <div className="empty-state mx-auto max-w-2xl px-10 py-14 text-center">
        <EmptySketch />
        <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-950">
          No files yet
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Your digital space is waiting.
          <br />
        </p>
        <UploadButton orgId={orgId} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
      <div className="h-1 w-full bg-gray-300" />
      <div className="h-28 bg-gray-200" />
      <div className="p-3 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="h-3 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="w-4 h-4 bg-gray-300 rounded" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");
  const foldersOnly = searchParams.get("view") === "folders" && !folderParam;
  const currentFolderId = folderParam ? (folderParam as Id<"folders">) : null;
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<FolderDocument | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderDocument | null>(null);
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, deleteSelectedFiles, moveSelectedFiles } = useFileMultiSelect();
  const files = useQuery(api.files.getFiles, { orgId, folderId: currentFolderId });
  const folders = useQuery(api.files.getFolders, { orgId, parentId: currentFolderId });
  const allFolders = useQuery(api.files.getAllFolders, { orgId });
  const folderPath = useQuery(api.files.getFolderPath, currentFolderId ? { folderId: currentFolderId } : { folderId: null });
  const createFolder = useMutation(api.files.createFolder);
  const renameFolder = useMutation(api.files.renameFolder);
  const deleteFolder = useMutation(api.files.deleteFolder);
  const isLoading = files === undefined || folders === undefined || folderPath === undefined || allFolders === undefined;

  const filteredFiles = foldersOnly ? [] : files?.filter((file) => {
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const totalSize = files?.reduce((sum, file) => sum + file.size, 0) ?? 0;
  const favoriteCount = files?.filter((file) => file.isFavorite).length ?? 0;
  const pinnedCount = files?.filter((file) => file.isPinned).length ?? 0;
  const visibleFolders = folders?.filter((folder) => {
    if (searchQuery && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openFolder = (folderId: Id<"folders">) => {
    router.push(`/dashboard?folder=${folderId}`);
  };

  const openRoot = () => {
    router.push("/dashboard");
  };

  const openParentFolder = () => {
    const parentFolder = folderPath?.at(-2);
    if (parentFolder) {
      openFolder(parentFolder._id);
      return;
    }

    openRoot();
  };

  const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = folderName.trim();
    if (!name) {
      toast.error("Folder name is required");
      return;
    }

    try {
      setIsCreatingFolder(true);
      const result = await createFolder({
        name,
        orgId,
        parentId: currentFolderId ?? undefined,
      });

      if (!result.success) {
        toast.error("Failed to create folder", {
          description: result.message,
        });
        return;
      }

      toast.success("Folder created");
      setFolderName("");
      setFolderDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create folder", {
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const openRenameFolderDialog = (folder: FolderDocument) => {
    setFolderToRename(folder);
    setRenameFolderName(folder.name);
  };

  const handleRenameFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!folderToRename) return;

    const name = renameFolderName.trim();
    if (!name) {
      toast.error("Folder name is required");
      return;
    }

    try {
      setIsRenamingFolder(true);
      const result = await renameFolder({ id: folderToRename._id, name });
      if (!result.success) {
        toast.error("Failed to rename folder", {
          description: result.message,
        });
        return;
      }

      toast.success("Folder renamed");
      setFolderToRename(null);
      setRenameFolderName("");
    } catch (error) {
      toast.error("Failed to rename folder", {
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      setIsDeletingFolder(true);
      const result = await deleteFolder({ id: folderToDelete._id });
      if (!result.success) {
        toast.error("Failed to delete folder", {
          description: result.message,
        });
        return;
      }

      toast.success("Folder deleted");
      setFolderToDelete(null);
    } catch (error) {
      toast.error("Failed to delete folder", {
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const handleBulkMove = async (folderId?: Id<"folders"> | null) => {
    try {
      setIsBulkMoving(true);
      const moved = await moveSelectedFiles(folderId);
      if (moved) setBulkMoveDialogOpen(false);
    } finally {
      setIsBulkMoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="h-3 bg-gray-300 rounded w-32 mb-3 animate-pulse" />
            <div className="h-8 bg-gray-300 rounded w-48 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-300 rounded-lg w-28 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (files?.length === 0 && folders?.length === 0 && !currentFolderId) {
    return <EmptyState orgId={orgId} />;
  }

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {currentFolderId ? (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openParentFolder}
                  className="size-9 rounded-lg border-slate-200 bg-white p-0 shadow-sm"
                  aria-label="Back"
                  title="Back"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <h1 className="workspace-title">
                  {folderPath?.at(-1)?.name ?? "Folder"}
                </h1>
              </div>
            ) : (
              <>
                <p className="workspace-kicker mb-2">
                  {organization?.name ?? "Personal"} / {filteredFiles?.length || 0} files
                </p>
                <h1 className="workspace-title">{foldersOnly ? "Folders" : "Your Files"}</h1>
                <p className="workspace-subtitle mt-2">
                  {foldersOnly ? "Create and open folders to organize your workspace." : "Upload, preview, organize, and ask AI about your files."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {files?.length ?? 0} files
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {folders?.length ?? 0} folders
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {formatFileSize(totalSize)} used
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {favoriteCount} favorites
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {pinnedCount} pinned
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
            <SearchComponent 
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              resultCount={(filteredFiles?.length || 0) + (visibleFolders?.length || 0)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setFolderDialogOpen(true)}
              className="h-10 gap-2 rounded-lg border-slate-200 bg-white px-3 font-semibold shadow-sm"
            >
              <FolderPlus className="size-4" />
              Folder
            </Button>
            <FileViewToggle value={viewMode} onChange={setViewMode} />
            <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
            {selectedIds.size > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentFolderId) {
                    void handleBulkMove(null);
                    return;
                  }

                  setBulkMoveDialogOpen(true);
                }}
                disabled={isBulkMoving}
                className="size-10 rounded-lg border-slate-200 bg-white p-0 shadow-sm"
                aria-label={currentFolderId ? "Move selected files out" : "Move selected files"}
                title={currentFolderId ? "Move out" : "Move"}
              >
                <FolderInput className="size-4" />
              </Button>
            )}
            {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
            {!foldersOnly && <UploadButton orgId={orgId} folderId={currentFolderId ?? undefined} />}
          </div>
        </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleFolders?.map((folder) => (
              <FolderCard
                key={folder._id}
                folder={folder}
                onOpen={openFolder}
                onRename={openRenameFolderDialog}
                onDelete={setFolderToDelete}
              />
            ))}
            {filteredFiles?.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(file._id)}
                onSelectionChange={(selectedFile) => toggleSelectedFile(selectedFile._id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-4 px-3 text-xs font-medium uppercase tracking-wide text-gray-400 sm:grid-cols-[minmax(0,1fr)_88px_72px] md:grid-cols-[minmax(0,1fr)_88px_110px_72px]">
              <span>Name</span>
              <span className="hidden sm:block">Size</span>
              <span className="hidden md:block">Added</span>
              <span className="text-right">Actions</span>
            </div>
            {visibleFolders?.map((folder) => (
              <div
                key={folder._id}
                role="button"
                tabIndex={0}
                onClick={() => openFolder(folder._id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openFolder(folder._id);
                }}
                className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_72px] items-center gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left transition hover:border-gray-300 hover:bg-gray-50 sm:grid-cols-[minmax(0,1fr)_88px_72px] md:grid-cols-[minmax(0,1fr)_88px_110px_72px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                    <Folder className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900" title={folder.name}>
                      {folder.name}
                    </p>
                    <p className="text-xs text-gray-500">Folder</p>
                  </div>
                </div>
                <p className="hidden text-sm text-gray-500 sm:block">--</p>
                <p className="hidden text-sm text-gray-500 md:block">--</p>
                <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                  <FolderActionsMenu
                    folder={folder}
                    onRename={openRenameFolderDialog}
                    onDelete={setFolderToDelete}
                  />
                </div>
              </div>
            ))}
            {filteredFiles?.map((file) => (
              <FileListItem
                key={file._id}
                file={file}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(file._id)}
                onSelectionChange={(selectedFile) => toggleSelectedFile(selectedFile._id)}
              />
            ))}
          </div>
        )}
      </div>
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateFolder} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Create folder</DialogTitle>
              <DialogDescription>
                Add a folder to organize files in this location.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Project files"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isCreatingFolder} className="primary-action w-fit">
              {isCreatingFolder ? "Creating..." : "Create folder"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(folderToRename)} onOpenChange={(open) => !open && setFolderToRename(null)}>
        <DialogContent>
          <form onSubmit={handleRenameFolder} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename folder</DialogTitle>
              <DialogDescription>Update the folder name.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="rename-folder-name">Folder name</Label>
              <Input
                id="rename-folder-name"
                value={renameFolderName}
                onChange={(event) => setRenameFolderName(event.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isRenamingFolder} className="primary-action w-fit">
              {isRenamingFolder ? "Renaming..." : "Rename folder"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(folderToDelete)} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete folder?</DialogTitle>
            <DialogDescription>
              Empty folders can be deleted. Move or delete files inside first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFolderToDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteFolder} disabled={isDeletingFolder}>
              {isDeletingFolder ? "Deleting..." : "Delete folder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkMoveDialogOpen} onOpenChange={setBulkMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move selected files</DialogTitle>
            <DialogDescription>Choose a destination for {selectedIds.size} selected file{selectedIds.size === 1 ? "" : "s"}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {allFolders?.length === 0 ? (
              <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
                No folders yet.
              </p>
            ) : (
              allFolders?.map((folder) => (
                <Button
                  key={folder._id}
                  type="button"
                  variant="outline"
                  onClick={() => handleBulkMove(folder._id)}
                  disabled={isBulkMoving}
                  className="justify-start"
                >
                  {folder.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-300" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function FolderActionsMenu({
  folder,
  onRename,
  onDelete,
}: {
  folder: FolderDocument;
  onRename: (folder: FolderDocument) => void;
  onDelete: (folder: FolderDocument) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded p-0.5 text-gray-400 hover:text-gray-700"
          aria-label={`Actions for ${folder.name}`}
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onRename(folder)}>
          <Pencil className="size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2 text-red-500 focus:text-red-500" onClick={() => onDelete(folder)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FolderCard({
  folder,
  onOpen,
  onRename,
  onDelete,
}: {
  folder: FolderDocument;
  onOpen: (folderId: Id<"folders">) => void;
  onRename: (folder: FolderDocument) => void;
  onDelete: (folder: FolderDocument) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(folder._id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(folder._id);
      }}
      className="file-card group relative cursor-pointer overflow-hidden border border-gray-200 bg-white text-left"
    >
      <div className="h-1 w-full bg-gradient-to-r from-amber-300 to-orange-500" />
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-amber-300 to-orange-500 opacity-90">
        <div className="text-white">
          <Folder className="size-9" />
        </div>
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-800" title={folder.name}>
            {folder.name}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Folder</p>
        </div>
        <div onClick={(event) => event.stopPropagation()}>
          <FolderActionsMenu folder={folder} onRename={onRename} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, MoreVertical, Trash2, Download, Star } from "lucide-react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { SectionEmptyState } from "@/app/section-empty-state";
import { FileCard as DriveFileCard, FileListItem } from "@/app/file-card";
import { FileViewMode, FileViewToggle } from "@/app/file-view-toggle";
import { DeleteSelectedButton } from "@/app/delete-selected-button";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { useFileMultiSelect } from "@/app/use-file-multi-select";

type FileDocument = Doc<"files">;

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return <ImageIcon className="w-8 h-8" />;
  if (type?.startsWith("video/")) return <VideoIcon className="w-8 h-8" />;
  if (type?.startsWith("audio/")) return <MusicIcon className="w-8 h-8" />;
  if (type === "application/pdf" || type?.startsWith("text/")) return <FileTextIcon className="w-8 h-8" />;
  return <FileIcon className="w-8 h-8" />;
}

function getFileColor(type: string) {
  if (type?.startsWith("image/")) return "from-rose-400 to-pink-600";
  if (type?.startsWith("video/")) return "from-violet-400 to-purple-600";
  if (type?.startsWith("audio/")) return "from-amber-400 to-orange-500";
  if (type === "application/pdf" || type?.startsWith("text/")) return "from-sky-400 to-blue-600";
  return "from-emerald-400 to-teal-600";
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

function FileCard({ file }: { file: FileDocument }) {
  const deleteFile = useMutation(api.files.deleteFile);
  const { membership, organization } = useOrganization();
  const orgId = organization?.id || "";
  const canDelete = !orgId || membership?.role === "org:admin";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      await deleteFile({ id: file._id as Id<"files"> });
      toast.success("File deleted successfully");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete file");
    }
  };

  return (
    <>
      <div className="file-card group relative overflow-hidden border border-gray-200 bg-white">
        <div className={`h-1 w-full bg-gradient-to-r ${getFileColor(file.type)}`} />
        <div className={`flex items-center justify-center h-24 bg-gradient-to-br ${getFileColor(file.type)} opacity-90`}>
          <div className="text-white">{getFileIcon(file.type)}</div>
        </div>
        <div className="p-3 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-gray-800 text-xs font-medium truncate" title={file.name}>{file.name}</p>
            <p className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider">
              {file.type?.split("/")[1] || file.type || "file"}
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
                onClick={() => window.open(file.url ?? "#", "_blank")}
              >
                <Download className="w-4 h-4" />
                Download
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 cursor-pointer flex items-center gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

function EmptyFavoritesState() {
  return (
    <SectionEmptyState
      variant="favorites"
      title="No favorites yet"
      subtitle="Starred files will be collected here for quick access."
      hint="☆ Mark any file as favorite to pin it here."
    />
  );
}


export default function FavoritesPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, deleteSelectedFiles } = useFileMultiSelect();
  const files = useQuery(api.files.getFiles, { orgId });
  const isLoading = files === undefined;

  const favoriteFiles = files?.filter((file) => file.isFavorite === true);

  return (
    <div className="workspace-page">
      {isLoading ? (
        <div className="workspace-container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="h-3 bg-gray-300 rounded w-32 mb-3 animate-pulse" />
              <div className="h-8 bg-gray-300 rounded w-48 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : favoriteFiles?.length === 0 ? (
        <EmptyFavoritesState />
      ) : (
        <div className="workspace-container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <p className="workspace-kicker">
                  {organization?.name ?? "Personal"} / {favoriteFiles?.length || 0} favorites
                </p>
              </div>
              <h1 className="workspace-title">
                Your Favorites
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <FileViewToggle value={viewMode} onChange={setViewMode} />
              <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
              {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favoriteFiles?.map((file) => (
                <DriveFileCard
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
              {favoriteFiles?.map((file) => (
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
      )}
    </div>
  );
}

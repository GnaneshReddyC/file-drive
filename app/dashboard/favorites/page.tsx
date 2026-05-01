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
import { UploadButton } from "@/app/upload-button";
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, MusicIcon, MoreVertical, Trash2, Download, Star, Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

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

function FileCard({ file }: { file: any }) {
  const deleteFile = useMutation(api.files.deleteFile);
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
      <div className="file-card group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg">
        <div className={`h-1 w-full bg-gradient-to-r ${getFileColor(file.type)}`} />
        <div className={`flex items-center justify-center h-28 bg-gradient-to-br ${getFileColor(file.type)} opacity-90`}>
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
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 cursor-pointer flex items-center gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

function EmptyFavoritesState() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="relative inline-block mb-8">
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-full p-8 border border-gray-200">
            <Star className="w-16 h-16 text-gray-400" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          No favorites yet
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Star your favorite files and they will appear here.
          <br />
          <span className="text-sm">Click the star icon on any file to add it to favorites.</span>
        </p>
      </div>
    </div>
  );
}


export default function FavoritesPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const files = useQuery(api.files.getFiles, { orgId });
  const isLoading = files === undefined;

  const favoriteFiles = files?.filter((file) => file.isFavorite === true);

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        .file-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .file-card:hover { transform: translateY(-4px); }
      `}</style>

      {isLoading ? (
        <div className="max-w-6xl mx-auto px-6 py-8">
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
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase">
                {organization?.name ?? "Personal"} · {favoriteFiles?.length || 0} favorites
              </p>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-gray-900">
              Your Favorites
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteFiles?.map((file) => <FileCard key={file._id} file={file} />)}
          </div>
        </div>
      )}
    </div>
  );
}
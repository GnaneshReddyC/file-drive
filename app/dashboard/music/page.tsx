"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileCard } from "@/app/file-card";
import { Music } from "lucide-react";

export default function MusicPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const files = useQuery(api.files.getFiles, { orgId });

  const musicFiles = files?.filter((file) => {
    const ext = file.name?.split(".").pop()?.toLowerCase();
    return file.type?.startsWith("audio/") || 
      ["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "opus"].includes(ext || "");
  });

  if (files === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
              <div className="h-1 w-full bg-gray-300" />
              <div className="h-28 bg-gray-200" />
              <div className="p-3">
                <div className="h-3 bg-gray-300 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-5 h-5 text-amber-500" />
            <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase">
              {organization?.name ?? "Personal"} · {musicFiles?.length || 0} music files
            </p>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-gray-900">
            Music
          </h1>
        </div>

        {musicFiles?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Music className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm">No music files found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {musicFiles?.map((file) => <FileCard key={file._id} file={file} />)}
          </div>
        )}
      </div>
    </div>
  );
}
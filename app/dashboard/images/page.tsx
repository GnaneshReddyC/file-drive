"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileCard } from "@/app/file-card";
import { Image } from "lucide-react";

export default function ImagesPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const files = useQuery(api.files.getFiles, { orgId });

  const imageFiles = files?.filter((file) => 
    file.type?.startsWith("image/") || 
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(file.name?.split(".").pop()?.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-5 h-5 text-rose-500" />
            <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase">
              {organization?.name ?? "Personal"} · {imageFiles?.length || 0} images
            </p>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-gray-900">
            Images
          </h1>
        </div>

        {imageFiles?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Image className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm">No images found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {imageFiles?.map((file) => <FileCard key={file._id} file={file} />)}
          </div>
        )}
      </div>
    </div>
  );
}
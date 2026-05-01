"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileCard } from "@/app/file-card";
import { File } from "lucide-react";

export default function PdfsPage() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const files = useQuery(api.files.getFiles, { orgId });

  const pdfFiles = files?.filter((file) => {
    const ext = file.name?.split(".").pop()?.toLowerCase();
    return file.type === "application/pdf" || ext === "pdf";
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
            <File className="w-5 h-5 text-red-500" />
            <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase">
              {organization?.name ?? "Personal"} · {pdfFiles?.length || 0} PDFs
            </p>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-gray-900">
            PDFs
          </h1>
        </div>

        {pdfFiles?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <File className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm">No PDFs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pdfFiles?.map((file) => (
              <FileCard key={file._id} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
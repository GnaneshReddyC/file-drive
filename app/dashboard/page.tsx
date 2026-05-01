"use client";

import { useOrganization } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UploadButton } from "@/app/upload-button";
import { FileCard } from "@/app/file-card";
import { SearchComponent } from "@/app/search-component";
import { SortDropdown, SortOption } from "@/components/sort-dropdown";
import { CloudUpload } from "lucide-react";
import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

function EmptyState({ orgId }: { orgId: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="relative inline-block mb-8">
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-full p-8 border border-gray-200">
            <CloudUpload className="w-16 h-16 text-gray-400" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          No files yet
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Your digital space is waiting.
          <br />
        </p>
        <UploadButton orgId={orgId} />
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-400">
        </div>
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

export default function Dashboard() {
  return (
    <>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen bg-white">
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
        </div>
      </Unauthenticated>
    </>
  );
}

function DashboardContent() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const files = useQuery(api.files.getFiles, { orgId });
  const isLoading = files === undefined;

  const filteredFiles = files?.filter((file) => {
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  let sortedFiles = filteredFiles;
  if (sortedFiles) {
    sortedFiles = [...sortedFiles].sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "date_asc":
          return (a._creationTime || 0) - (b._creationTime || 0);
        case "date_desc":
          return (b._creationTime || 0) - (a._creationTime || 0);
        case "size_asc":
          return (a.size || 0) - (b.size || 0);
        case "size_desc":
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });
  }

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

  if (files?.length === 0) {
    return <EmptyState orgId={orgId} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase mb-2">
              {organization?.name ?? "Personal"} · {sortedFiles?.length || 0} files
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-gray-900 leading-none">
              Your Files
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
            <SearchComponent 
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              resultCount={filteredFiles?.length || 0}
            />
            <UploadButton orgId={orgId} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedFiles?.map((file) => (
            <FileCard key={file._id} file={file} />
          ))}
        </div>
      </div>
    </div>
  );
}
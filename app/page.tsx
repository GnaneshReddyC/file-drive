"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UploadButton } from "@/app/upload-button";
import { FileCard, FileListItem } from "@/app/file-card";
import { FileViewMode, FileViewToggle } from "@/app/file-view-toggle";
import { DeleteSelectedButton } from "@/app/delete-selected-button";
import { MultiSelectToggle } from "@/app/multi-select-toggle";
import { SearchComponent } from "@/app/search-component";
import { EmptySketch } from "@/app/empty-sketch";
import { FileDriveLogo } from "@/app/file-drive-logo";
import { useFileMultiSelect } from "@/app/use-file-multi-select";
import { Sparkles } from "lucide-react";
import { useState } from "react";

function EmptyState({ orgId }: { orgId: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <div className="empty-state mx-auto max-w-2xl px-10 py-14 text-center">
        <EmptySketch />
        
        <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-950">
          No files yet
        </h2>
        
        <p className="text-gray-500 mb-8 text-lg">
          Your digital space is waiting for its first file.
          <br />
          <span className="text-sm">Upload something beautiful to get started.</span>
        </p>
        
        <div className="inline-block">
          <UploadButton orgId={orgId} />
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3 h-3" />
          <span>Drag & drop or click to upload</span>
          <Sparkles className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function FilesList() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const { isSelecting, selectedIds, toggleSelecting, toggleSelectedFile, deleteSelectedFiles } = useFileMultiSelect();
  
  const files = useQuery(api.files.getFiles, { orgId });
  
  const filteredFiles = files?.filter((file) => {
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (files?.length === 0) {
    return <EmptyState orgId={orgId} />;
  }

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="workspace-kicker mb-2">
                {organization?.name ?? "Personal"} / {filteredFiles?.length ?? 0} files
              </p>
              <h1 className="workspace-title">
                Your Files
              </h1>
              <p className="workspace-subtitle mt-2">A focused workspace for your uploaded files.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
              <SearchComponent 
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                resultCount={filteredFiles?.length || 0}
              />
              <FileViewToggle value={viewMode} onChange={setViewMode} />
              <MultiSelectToggle enabled={isSelecting} selectedCount={selectedIds.size} onToggle={toggleSelecting} />
              {selectedIds.size > 0 && <DeleteSelectedButton onClick={deleteSelectedFiles} />}
              <UploadButton orgId={orgId} />
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Authenticated>
        <FilesList />
      </Authenticated>
      <Unauthenticated>
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
      <div className="mb-6">
        <div className="flex justify-center">
          <FileDriveLogo size="lg" />
        </div>
      </div>
      <h1 className="mb-2 text-4xl font-black tracking-tight">
        <span className="text-slate-950">Next</span>
        <span className="bg-gradient-to-r from-cyan-600 to-emerald-500 bg-clip-text text-transparent">
          Drive
        </span>
      </h1>
      <p className="text-gray-500 mb-8">Store and share your files securely</p>
      <SignInButton mode="modal">
        <Button className="primary-action w-full px-6 py-5 text-lg">
          Sign In to Continue
        </Button>
      </SignInButton>
      <p className="text-xs text-gray-400 mt-6">Secure authentication by Clerk</p>
    </div>
  </div>
</Unauthenticated>
    </>
  );
}

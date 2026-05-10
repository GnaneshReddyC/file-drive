"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UploadButton } from "@/app/upload-button";
import { FileCard } from "@/app/file-card";
import { SearchComponent } from "@/app/search-component";
import { EmptySketch } from "@/app/empty-sketch";
import { CloudUpload, Sparkles } from "lucide-react";
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
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="workspace-kicker mb-2">
                {organization?.name ?? "Personal"} / {filteredFiles?.length ?? 0} files
              </p>
              <h1 className="workspace-title">
                Your Files
              </h1>
              <p className="workspace-subtitle mt-2">A focused workspace for your uploaded files.</p>
            </div>
            <div className="flex items-center gap-3">
              <SearchComponent 
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                resultCount={filteredFiles?.length || 0}
              />
              <UploadButton orgId={orgId} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles?.map((file) => (
            <FileCard key={file._id} file={file} />
          ))}
        </div>
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
        <div className="mx-auto flex size-16 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <CloudUpload className="h-8 w-8" />
        </div>
      </div>
      <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-950">File Drive</h1>
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

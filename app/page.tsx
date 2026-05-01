"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UploadButton } from "@/app/upload-button";
import { FileCard } from "@/app/file-card";
import { SearchComponent } from "@/app/search-component";
import { CloudUpload, Sparkles } from "lucide-react";
import { useState } from "react";

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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-medium tracking-[0.3em] text-gray-400 uppercase mb-2">
                {organization?.name ?? "Personal"} · {filteredFiles?.length ?? 0} files
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-gray-900 leading-none">
                Your Files
              </h1>
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
  <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md w-full px-4">
      <div className="mb-6">
        <CloudUpload className="w-16 h-16 text-gray-700 mx-auto" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">File Drive</h1>
      <p className="text-gray-500 mb-8">Store and share your files securely</p>
      <SignInButton mode="modal">
        <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-5 text-lg rounded-xl w-full">
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
"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchComponentProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  resultCount: number;
}

export function SearchComponent({ onSearch, searchQuery }: SearchComponentProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-indigo-500" />
      <Input
        type="text"
        placeholder="Search files"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="h-10 border-indigo-200 bg-indigo-50/70 pl-9 pr-9 text-sm text-indigo-950 placeholder:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-200"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={() => onSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 transition-colors duration-150 hover:text-indigo-700"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

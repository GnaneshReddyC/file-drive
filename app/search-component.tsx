"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchComponentProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  resultCount: number;
}

export function SearchComponent({ onSearch, searchQuery, resultCount }: SearchComponentProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clearSearch = () => {
    setLocalQuery("");
    onSearch("");
    setIsSearchOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setLocalQuery(value);
    onSearch(value);
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        clearSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Don't show anything if search is closed and there's no active search
  if (!isSearchOpen && !searchQuery) {
    return (
      <Button
        onClick={() => setIsSearchOpen(true)}
        className="relative overflow-hidden group bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-full px-5 py-2 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        <Search className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">Search Files</span>
      </Button>
    );
  }

  return (
    <div>
      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-80' : 'w-auto'}`}>
        {isSearchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name..."
              value={localQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9 py-2 rounded-full border-gray-200 focus:border-gray-400 transition-all shadow-sm"
            />
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            onClick={() => setIsSearchOpen(true)}
            className="relative overflow-hidden group bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-full px-5 py-2 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <Search className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Search Files</span>
          </Button>
        )}
      </div>

      {/* Search Results Summary */}
      {searchQuery && resultCount >= 0 && (
        <div className="mt-4 mb-4 flex items-center gap-2 text-sm text-gray-500 animate-in slide-in-from-top-1 duration-200">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <span>
            Found {resultCount} result{resultCount !== 1 ? 's' : ''} for “
            <span className="font-medium text-gray-700">{searchQuery}</span>”
          </span>
          <button
            onClick={clearSearch}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-1"
          >
            (clear)
          </button>
        </div>
      )}

      {/* Empty Search State */}
      {searchQuery && resultCount === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in-50 duration-300">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No files found</p>
          <p className="text-gray-400 text-sm">
            No results matching "{searchQuery}"
          </p>
          <Button 
            variant="outline" 
            onClick={clearSearch}
            className="mt-2 rounded-full"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}
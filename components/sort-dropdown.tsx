"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "name_asc" | "name_desc" | "date_asc" | "date_desc" | "size_asc" | "size_desc";

interface SortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: "name_asc", label: "Name (A-Z)" },
    { value: "name_desc", label: "Name (Z-A)" },
    { value: "date_desc", label: "Newest first" },
    { value: "date_asc", label: "Oldest first" },
    { value: "size_desc", label: "Largest first" },
    { value: "size_asc", label: "Smallest first" },
  ];

  const currentLabel = options.find((o) => o.value === sortBy)?.label || "Sort";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gray-900 text-white hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onSortChange(option.value)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
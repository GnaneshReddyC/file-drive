"use client";

import { Trash2 } from "lucide-react";

type DeleteSelectedButtonProps = {
  onClick: () => void;
};

export function DeleteSelectedButton({ onClick }: DeleteSelectedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-w-12 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-red-600 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label="Delete selected files"
      title="Delete selected files"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

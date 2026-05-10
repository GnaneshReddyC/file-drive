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
      className="inline-flex h-10 min-w-12 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-destructive transition hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label="Delete selected files"
      title="Delete selected files"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

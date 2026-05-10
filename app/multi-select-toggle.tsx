"use client";

import { CheckSquare, Square } from "lucide-react";

type MultiSelectToggleProps = {
  enabled: boolean;
  selectedCount: number;
  onToggle: () => void;
};

export function MultiSelectToggle({ enabled, selectedCount, onToggle }: MultiSelectToggleProps) {
  const Icon = enabled ? CheckSquare : Square;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-10 min-w-12 shrink-0 items-center justify-center rounded-lg border px-3 text-sm transition focus-visible:ring-2 focus-visible:ring-ring/50 ${
        enabled
          ? "border-slate-200 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
      aria-label={enabled ? "Turn off multi-select" : "Turn on multi-select"}
      aria-pressed={enabled}
      title={enabled ? "Turn off multi-select" : "Turn on multi-select"}
    >
      <Icon className="w-4 h-4" />
      {selectedCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
          {selectedCount}
        </span>
      )}
    </button>
  );
}

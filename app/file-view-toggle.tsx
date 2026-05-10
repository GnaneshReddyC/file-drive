"use client";

import { Check, Grid2X2, List } from "lucide-react";

export type FileViewMode = "grid" | "list";

type FileViewToggleProps = {
  value: FileViewMode;
  onChange: (value: FileViewMode) => void;
};

export function FileViewToggle({ value, onChange }: FileViewToggleProps) {
  const options = [
    { value: "grid" as const, label: "Cards view", icon: Grid2X2 },
    { value: "list" as const, label: "Menu view", icon: List },
  ];

  return (
    <div className="inline-flex h-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex h-full min-w-12 items-center justify-center gap-1.5 border-r border-slate-200 px-3 text-sm transition last:border-r-0 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 ${
              isSelected
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            aria-label={option.label}
            aria-pressed={isSelected}
            title={option.label}
          >
            <Icon className="w-4 h-4" />
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

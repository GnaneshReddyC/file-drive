import { Cloud } from "lucide-react";

type FileDriveLogoProps = {
  size?: "sm" | "lg";
};

export function FileDriveLogo({ size = "sm" }: FileDriveLogoProps) {
  const isLarge = size === "lg";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm ${
        isLarge ? "size-16" : "size-10"
      }`}
      aria-hidden="true"
    >
      <Cloud className={isLarge ? "size-9" : "size-6"} strokeWidth={2.2} />
    </div>
  );
}

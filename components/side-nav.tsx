"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Folder,
  Folders,
  Star,
  Image,
  Video,
  Music,
  FileText,
  File,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const primaryItems: NavItem[] = [
    { name: "All Files", href: "/dashboard", icon: Folder },
    { name: "Folders", href: "/dashboard?view=folders", icon: Folders },
  ];

  const categoryItems: NavItem[] = [
    { name: "Favorites", href: "/dashboard/favorites", icon: Star },
    { name: "Images", href: "/dashboard/images", icon: Image },
    { name: "Videos", href: "/dashboard/videos", icon: Video },
    { name: "Music", href: "/dashboard/music", icon: Music },
    { name: "Documents", href: "/dashboard/documents", icon: FileText },
    { name: "PDFs", href: "/dashboard/pdfs", icon: File },
    { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
  ];

  const NavButton = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const Icon = item.icon;

    return (
      <Button
        variant="ghost"
        onClick={() => router.push(item.href)}
        className={cn(
          "side-nav-btn relative h-10 w-10 justify-center rounded-md px-0 text-slate-400",
          isActive && "side-nav-btn-active text-indigo-600"
        )}
      >
        <span className={cn("absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r", isActive ? "bg-[#6366f1]" : "bg-transparent")} />
        <Icon className="h-5 w-5" />
        <span className="sr-only">{item.name}</span>
      </Button>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] border-r z-40 flex flex-col",
          "side-nav-shell w-16"
        )}
      >
        <div className="h-4 border-b border-slate-200">
        </div>

        <TooltipProvider delayDuration={80}>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          <div className="px-1 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
            Files
          </div>
          {primaryItems.map((item) => {
            const isActive = currentHref === item.href;
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <div><NavButton item={item} isActive={isActive} /></div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="bg-[#20202b] text-[#e9e9f2]">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
          <div className="my-3 border-t border-slate-200" />
          {categoryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <div><NavButton item={item} isActive={isActive} /></div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="bg-[#20202b] text-[#e9e9f2]">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        </TooltipProvider>
      </div>
    </>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Folder,
  Star,
  Image,
  Video,
  Music,
  FileText,
  File,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { name: "All Files", href: "/dashboard", icon: Folder },
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
        variant={isActive ? "default" : "ghost"}
        onClick={() => router.push(item.href)}
        className={cn(
          "h-10 w-full justify-start gap-3 rounded-lg px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          isActive && "bg-slate-900 text-white shadow-sm hover:bg-slate-900 hover:text-white"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{item.name}</span>
      </Button>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 z-40 flex flex-col",
          "w-64"
        )}
      >
        <div className="h-4 border-b border-slate-200">
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return <NavButton key={item.name} item={item} isActive={isActive} />;
          })}
        </div>
      </div>
    </>
  );
}

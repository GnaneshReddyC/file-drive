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
          "w-full justify-start gap-3 px-3",
          isActive && "bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:bg-gray-800"
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
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 flex flex-col",
          "shadow-xl",
          "w-64"
        )}
      >
        <div className="h-16 flex items-center border-b border-gray-200 px-6">
          <div className="w-1 h-1" />
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return <NavButton key={item.name} item={item} isActive={isActive} />;
          })}
        </div>
      </div>
    </>
  );
}
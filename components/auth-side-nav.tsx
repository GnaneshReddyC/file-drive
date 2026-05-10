"use client";

import { useAuth } from "@clerk/nextjs";
import { Suspense } from "react";
import { SideNav } from "./side-nav";

export function AuthSideNav() {
  const { isSignedIn } = useAuth();
  
  if (!isSignedIn) return null;
  
  return (
    <Suspense fallback={null}>
      <SideNav />
    </Suspense>
  );
}

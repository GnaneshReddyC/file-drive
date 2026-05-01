"use client";

import { useAuth } from "@clerk/nextjs";
import { SideNav } from "./side-nav";

export function AuthSideNav() {
  const { isSignedIn } = useAuth();
  
  if (!isSignedIn) return null;
  
  return <SideNav />;
}
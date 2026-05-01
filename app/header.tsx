"use client";

import { OrganizationSwitcher, SignOutButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h1 className="text-xl font-semibold">FILE DRIVE</h1>
      <div className="flex items-center gap-3">
        <OrganizationSwitcher
          hidePersonal={false}
          createOrganizationMode="modal"
          appearance={{
            elements: {
              rootBox: "flex items-center",
              organizationSwitcherTrigger: "border rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100",
            },
          }}
        />
        <UserButton />
        <SignOutButton>
          <Button variant="outline">Sign Out</Button>
        </SignOutButton>
      </div>
    </div>
  );
}
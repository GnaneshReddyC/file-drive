"use client";

import { OrganizationSwitcher, SignOutButton, UserButton, useAuth, useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DriveAiChatDialog } from "@/components/drive-ai-chat-dialog";
import { FileDriveLogo } from "@/app/file-drive-logo";
import { Bot, Building2 } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { isSignedIn } = useAuth();
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [driveAiOpen, setDriveAiOpen] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <FileDriveLogo />
          <div>
            <h1 className="text-lg font-black tracking-tight">
              <span className="text-slate-950">Next</span>
              <span className="bg-gradient-to-r from-cyan-600 to-emerald-500 bg-clip-text text-transparent">
                Drive
              </span>
            </h1>
          </div>
        </div>
        {isSignedIn && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setDriveAiOpen(true)}
              className="primary-action h-9 gap-2 px-3 text-sm"
              title="Ask AI about your drive"
            >
              <Bot className="w-4 h-4" />
              AI
            </Button>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Organization"
                  labelIcon={<Building2 className="size-4" />}
                  onClick={() => setOrganizationOpen(true)}
                />
              </UserButton.MenuItems>
            </UserButton>
            <SignOutButton>
              <Button variant="outline" className="rounded-lg border-slate-200 bg-white hover:bg-slate-50">Sign Out</Button>
            </SignOutButton>
          </div>
        )}
      </div>
      {isSignedIn && <DriveAiChatDialog orgId={orgId} open={driveAiOpen} onOpenChange={setDriveAiOpen} />}
      {isSignedIn && (
        <Dialog open={organizationOpen} onOpenChange={setOrganizationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Organization</DialogTitle>
            </DialogHeader>
            <OrganizationSwitcher
              hidePersonal={false}
              createOrganizationMode="modal"
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger: "border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50",
                },
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

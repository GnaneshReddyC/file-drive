"use client";

import { OrganizationSwitcher, SignOutButton, UserButton, useAuth, useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { DriveAiChatDialog } from "@/components/drive-ai-chat-dialog";
import { FileDriveLogo } from "@/app/file-drive-logo";
import { Bot } from "lucide-react";
import { useState } from "react";

function SignedInHeaderActions() {
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const [driveAiOpen, setDriveAiOpen] = useState(false);

  return (
    <>
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
        <OrganizationSwitcher
          hidePersonal={false}
          createOrganizationMode="modal"
          organizationProfileMode="modal"
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
          afterSelectPersonalUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "flex items-center",
              organizationSwitcherTrigger:
                "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-slate-50",
            },
          }}
        />
        <UserButton />
        <SignOutButton>
          <Button
            variant="outline"
            className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          >
            Sign out
          </Button>
        </SignOutButton>
      </div>
      <DriveAiChatDialog orgId={orgId} open={driveAiOpen} onOpenChange={setDriveAiOpen} />
    </>
  );
}

export default function Header() {
  const { isSignedIn } = useAuth();

  return (
    <>
      <div className="top-header sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b px-4 md:px-6">
        <div className="flex items-center gap-3">
          <FileDriveLogo />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              NextDrive
            </h1>
          </div>
        </div>
        {isSignedIn && <SignedInHeaderActions />}
      </div>
    </>
  );
}

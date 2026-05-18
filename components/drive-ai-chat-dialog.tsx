"use client";

import { FormEvent, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type DriveAiChatDialogProps = {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DriveAiChatDialog({ orgId, open, onOpenChange }: DriveAiChatDialogProps) {
  const files = useQuery(api.files.getFilesForAi, open ? { orgId } : "skip");
  const isPreparing = open && files === undefined;
  const readyFiles = files?.filter((file) => file.url) ?? [];
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me about everything in your drive. I can use readable text from documents, PDFs, spreadsheets, presentations, text files, and image files.",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAsking || isPreparing || readyFiles.length === 0) return;

    setQuestion("");
    setIsAsking(true);
    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);

    try {
      const response = await fetch("/api/ai/file-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmedQuestion,
          files: readyFiles,
        }),
      });

      const data = await response.json();
      const answer = response.ok ? data.answer : data.error;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer || "I could not answer that question.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Something went wrong while contacting the AI service.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] !max-w-[calc(100%-2rem)] sm:!max-w-5xl flex-col overflow-hidden border border-border bg-background p-0 text-foreground shadow-2xl">
        <DialogHeader className="border-b border-border bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-7 py-6">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Sparkles className="size-4" />
            </span>
            Ask Drive AI
          </DialogTitle>
          <DialogDescription className="mt-1 text-muted-foreground">
            {isPreparing ? "Preparing your files..." : `${readyFiles.length} files ready for AI`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-96 flex-1 flex-col gap-4 overflow-y-auto bg-muted/20 px-7 py-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground"
              }`}
            >
              {message.content}
            </div>
          ))}
          {(isPreparing || isAsking) && (
            <div className="flex max-w-[85%] items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isPreparing ? "Preparing drive..." : "Thinking..."}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-background px-7 py-5">
          <div className="flex items-center gap-2 rounded-2xl border border-input bg-background p-2">
            <Bot className="ml-1 size-4 text-muted-foreground" />
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={isPreparing ? "Preparing drive..." : "Ask about your drive"}
              disabled={isAsking || isPreparing || readyFiles.length === 0}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <Button
              type="submit"
              disabled={isAsking || isPreparing || readyFiles.length === 0 || !question.trim()}
              className="rounded-xl"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

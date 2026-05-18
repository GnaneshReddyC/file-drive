"use client";

import { FormEvent, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type FileDocument = Doc<"files">;
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type FileAiChatDialogProps = {
  file: FileDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FileAiChatDialog({ file, open, onOpenChange }: FileAiChatDialogProps) {
  const fetchedUrl = useQuery(api.files.getFileUrl, open && file.fileId ? { storageId: file.fileId } : "skip");
  const fileUrl = fetchedUrl || file.url || null;
  const isFileLoading = open && Boolean(file.fileId) && fetchedUrl === undefined;
  const isFileReady = Boolean(fileUrl);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me about this file. I can inspect images and PDFs, and read text from PowerPoint, Word, Excel, and text files.",
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAsking || !isFileReady) return;

    setQuestion("");
    setIsAsking(true);
    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);

    try {
      const response = await fetch("/api/ai/file-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmedQuestion,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl,
          },
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
            Chat with file
          </DialogTitle>
          <DialogDescription className="truncate text-muted-foreground">{file.name}</DialogDescription>
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
          {isAsking && (
            <div className="flex max-w-[85%] items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          )}
          {isFileLoading && (
            <div className="flex max-w-[85%] items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing file...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-background px-7 py-5">
          <div className="flex items-center gap-2 rounded-2xl border border-input bg-background p-2">
            <Bot className="ml-1 size-4 text-muted-foreground" />
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={isFileLoading ? "Preparing file..." : "Ask about this file"}
              disabled={isAsking || !isFileReady}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
            <Button type="submit" disabled={isAsking || !isFileReady || !question.trim()} className="rounded-xl">
              <Send className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

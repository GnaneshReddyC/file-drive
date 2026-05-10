"use client";

import { FormEvent, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
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
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Ask Drive AI
          </DialogTitle>
          <DialogDescription>
            {isPreparing ? "Preparing your files..." : `${readyFiles.length} files ready for AI`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-72 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-black text-white"
                  : "bg-background text-foreground shadow-sm"
              }`}
            >
              {message.content}
            </div>
          ))}
          {(isPreparing || isAsking) && (
            <div className="flex max-w-[85%] items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isPreparing ? "Preparing drive..." : "Thinking..."}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={isPreparing ? "Preparing drive..." : "Ask about your drive"}
            disabled={isAsking || isPreparing || readyFiles.length === 0}
          />
          <Button
            type="submit"
            disabled={isAsking || isPreparing || readyFiles.length === 0 || !question.trim()}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

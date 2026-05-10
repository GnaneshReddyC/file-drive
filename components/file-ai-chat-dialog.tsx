"use client";

import { FormEvent, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
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
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chat with file
          </DialogTitle>
          <DialogDescription className="truncate">{file.name}</DialogDescription>
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
          {isAsking && (
            <div className="flex max-w-[85%] items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          )}
          {isFileLoading && (
            <div className="flex max-w-[85%] items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing file...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={isFileLoading ? "Preparing file..." : "Ask about this file"}
            disabled={isAsking || !isFileReady}
          />
          <Button type="submit" disabled={isAsking || !isFileReady || !question.trim()} className="bg-black text-white hover:bg-gray-800">
            <Send className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

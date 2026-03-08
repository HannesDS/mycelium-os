"use client";

import { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

interface ChatThreadProps {
  shroomName: string;
  shroomRole: string;
  shroomModel?: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function ChatThread({
  shroomName,
  shroomRole,
  shroomModel,
  messages,
  onSend,
  isLoading,
  error,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoading]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4 shrink-0">
        <div className="w-9 h-9 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
          {shroomName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{shroomName}</h2>
          <p className="text-xs text-neutral-400">
            {shroomRole}
            {shroomModel ? ` · ${shroomModel}` : ""}
          </p>
        </div>
      </header>

      <div
        data-testid="message-list"
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
            Start a conversation with {shroomName}
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div
            data-testid="loading-indicator"
            className="flex items-center gap-2 text-neutral-400 text-sm"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{shroomName} is thinking...</span>
          </div>
        )}
        {error && (
          <div
            data-testid="chat-error"
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400"
          >
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}

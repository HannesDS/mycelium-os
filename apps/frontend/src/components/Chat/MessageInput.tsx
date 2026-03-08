"use client";

import { useState, useCallback } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }, [text, disabled, onSend]);

  return (
    <div className="flex items-end gap-2 border-t border-white/10 p-4 bg-[#0a0a0f]">
      <textarea
        data-testid="message-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
      />
      <button
        type="button"
        data-testid="send-button"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

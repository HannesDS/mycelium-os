"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { fetchShrooms, sendMessage } from "@/lib/api";
import type { ShroomSummary } from "@/lib/api";
import type { ChatMessage } from "@/types/chat";
import { ShroomSelector, ChatThread } from "@/components/Chat";

type ConversationMap = Record<string, ChatMessage[]>;

let nextMsgId = 0;
function msgId() {
  return `msg-${++nextMsgId}`;
}

export default function ChatPage() {
  const [shrooms, setShrooms] = useState<ShroomSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    fetchShrooms()
      .then((list) => {
        setShrooms(list);
        setConnectionError(null);
      })
      .catch(() => {
        setConnectionError(
          "Cannot reach the control plane. Check your connection.",
        );
      });
  }, []);

  const selectedShroom = shrooms.find((s) => s.id === selectedId) ?? null;
  const messages = selectedId ? (conversations[selectedId] ?? []) : [];

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setError(null);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!selectedId) return;

      const humanMsg: ChatMessage = {
        id: msgId(),
        sender: "human",
        text,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), humanMsg],
      }));
      setLoading(true);
      setError(null);

      try {
        const res = await sendMessage(selectedId, text);
        const shroomMsg: ChatMessage = {
          id: msgId(),
          sender: "shroom",
          text: res.response,
          timestamp: new Date().toISOString(),
        };
        setConversations((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), shroomMsg],
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [selectedId],
  );

  return (
    <div className="flex h-full bg-[#0a0a0f]">
      {connectionError && (
        <div
          data-testid="connection-error"
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-sm text-red-400"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {connectionError}
        </div>
      )}

      <ShroomSelector
        shrooms={shrooms}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {selectedShroom ? (
          <ChatThread
            shroomName={selectedShroom.name}
            shroomRole={selectedShroom.id}
            shroomModel={selectedShroom.model}
            messages={messages}
            onSend={handleSend}
            isLoading={loading}
            error={error}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
            Select a shroom to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

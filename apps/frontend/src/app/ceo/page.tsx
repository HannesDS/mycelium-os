"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertCircle, Scale } from "lucide-react";
import { fetchShrooms, sendMessage, AuthError } from "@/lib/api";
import type { ShroomSummary } from "@/lib/api";
import type { ChatMessage } from "@/types/chat";
import { ChatThread } from "@/components/Chat";

function msgId() {
  return `msg-${crypto.randomUUID()}`;
}

const DEV_API_KEY = process.env.NEXT_PUBLIC_DEV_API_KEY;
const CEO_SHROOM_ID = "ceo-shroom";

export default function CEOPage() {
  const [shrooms, setShrooms] = useState<ShroomSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
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

  const ceoShroom = shrooms.find((s) => s.id === CEO_SHROOM_ID);
  const isMinimalConfig = shrooms.length < 2;

  const handleSend = useCallback(
    async (text: string) => {
      if (!ceoShroom) return;

      const humanMsg: ChatMessage = {
        id: msgId(),
        sender: "human",
        text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, humanMsg]);
      setLoading(true);
      setError(null);

      try {
        const res = await sendMessage(CEO_SHROOM_ID, text, {
          sessionId: sessionId ?? undefined,
          apiKey: DEV_API_KEY,
        });
        if (res.session_id) {
          setSessionId(res.session_id);
        }
        const shroomMsg: ChatMessage = {
          id: msgId(),
          sender: "shroom",
          text: res.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, shroomMsg]);
      } catch (err) {
        if (err instanceof AuthError && err.message.includes("Start a new")) {
          setSessionId(null);
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [ceoShroom, sessionId],
  );

  if (connectionError) {
    return (
      <div className="flex h-full bg-[#0a0a0f] items-center justify-center">
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-4 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {connectionError}
        </div>
      </div>
    );
  }

  if (!ceoShroom) {
    return (
      <div className="flex h-full bg-[#0a0a0f] items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-white">CEO setup</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Add ceo-shroom to your constitution to use this interface. Edit{" "}
            <code className="rounded bg-white/10 px-1 py-0.5">mycelium.yaml</code>{" "}
            and add a shroom manifest for ceo-shroom.
          </p>
          <Link
            href="/constitution"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
          >
            <Scale className="w-4 h-4" />
            View constitution
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a0f]">
      {isMinimalConfig && (
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5 px-6 py-3">
          <p className="text-sm text-amber-200">
            Setup mode: Configure your first shrooms. Chat with CEO to add shrooms, set skills, and configure prompts.
          </p>
          <Link
            href="/constitution"
            className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10"
          >
            <Scale className="w-3.5 h-3.5" />
            Constitution
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <ChatThread
          shroomName={ceoShroom.name}
          shroomRole={ceoShroom.id}
          shroomModel={ceoShroom.model}
          messages={messages}
          onSend={handleSend}
          isLoading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

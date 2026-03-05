"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import { HumanInboxCard } from "@/components/HumanInboxCard";

const CanvasScene = dynamic(() => import("@/components/CanvasScene"), {
  ssr: false,
});

const SALES_AGENT_POS = { x: 200, y: 300 };
const CEO_AGENT_POS = { x: 500, y: 300 };

export default function CanvasPage() {
  const [escalationInFlight, setEscalationInFlight] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [ceoThoughtBubble, setCeoThoughtBubble] = useState<string | null>(null);
  const [salesSpeechBubble, setSalesSpeechBubble] = useState<string | null>(
    null
  );
  const inboxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (inboxTimerRef.current) clearTimeout(inboxTimerRef.current);
    };
  }, []);

  const handleTriggerEscalation = useCallback(() => {
    if (escalationInFlight) return;
    if (inboxTimerRef.current) {
      clearTimeout(inboxTimerRef.current);
      inboxTimerRef.current = null;
    }
    setEscalationInFlight(true);
    setCeoThoughtBubble("Escalation received. Reviewing…");
    setSalesSpeechBubble(null);

    inboxTimerRef.current = setTimeout(() => {
      setShowInbox(true);
      inboxTimerRef.current = null;
    }, 2000);
  }, [escalationInFlight]);

  const handleApprove = useCallback(() => {
    if (inboxTimerRef.current) {
      clearTimeout(inboxTimerRef.current);
      inboxTimerRef.current = null;
    }
    setShowInbox(false);
    setCeoThoughtBubble(null);
    setSalesSpeechBubble("Proposal approved, sending now.");
    setEscalationInFlight(false);
  }, []);

  const handleReject = useCallback(() => {
    if (inboxTimerRef.current) {
      clearTimeout(inboxTimerRef.current);
      inboxTimerRef.current = null;
    }
    setShowInbox(false);
    setCeoThoughtBubble(null);
    setSalesSpeechBubble("Proposal rejected, standing down.");
    setEscalationInFlight(false);
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 100,
        }}
      >
        <button
          onClick={handleTriggerEscalation}
          disabled={escalationInFlight}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            background: escalationInFlight ? "#9ca3af" : "#6366f1",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: escalationInFlight ? "not-allowed" : "pointer",
          }}
        >
          Trigger escalation
        </button>
      </div>

      <CanvasScene
        salesAgentPos={SALES_AGENT_POS}
        ceoAgentPos={CEO_AGENT_POS}
        escalationPulseActive={escalationInFlight}
        ceoEscalating={!!ceoThoughtBubble}
        ceoThoughtBubble={ceoThoughtBubble}
        salesSpeechBubble={salesSpeechBubble}
      />

      {showInbox && (
        <HumanInboxCard
          from="sales-agent"
          to="ceo-agent"
          proposalSummary="Approve sending proposal to Acme Corp?"
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

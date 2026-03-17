"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import type { ShroomEvent } from "@/types/shroom-events";
import { SHROOMS } from "@/types/shrooms";
import { createEvent } from "@/lib/mockEvents";
import { ShroomNode } from "./ShroomNode";
import { HumanInboxCard } from "./HumanInboxCard";
import styles from "./VisualOffice.module.css";

const ESCALATION_PAYLOAD = "New enterprise lead — Triodos Bank. Proposal ready for approval.";
const CEO_THOUGHT = "Reviewing proposal...";
const APPROVED_MESSAGE = "Proposal approved — sending to Triodos Bank";
const REJECTED_MESSAGE = "Proposal rejected — following up with CEO";

type EscalationPhase =
  | "idle"
  | "escalating"
  | "root_reviewing"
  | "inbox_visible"
  | "resolved";

export default function VisualOffice() {
  const [events, setEvents] = useState<ShroomEvent[]>([]);
  const [phase, setPhase] = useState<EscalationPhase>("idle");
  const [inboxVisible, setInboxVisible] = useState(false);
  const [inboxDismissing, setInboxDismissing] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [salesShroomPos, setSalesShroomPos] = useState({ x: 150, y: 200 });
  const [rootBubble, setRootBubble] = useState<string | null>(null);
  const [salesBubble, setSalesBubble] = useState<string | null>(null);
  const [rootPulse, setRootPulse] = useState(false);
  const [salesPulse, setSalesPulse] = useState<"none" | "green" | "red">("none");
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addEvent = useCallback((event: ShroomEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  const triggerEscalation = useCallback(() => {
    if (phase !== "idle") return;

    setPhase("escalating");
    const escalationEvent = createEvent({
      shroom_id: "sales-shroom",
      event: "escalation_raised",
      to: "root-shroom",
      topic: "lead_qualified",
      payload_summary: ESCALATION_PAYLOAD,
    });
    addEvent(escalationEvent);

    setRootBubble(ESCALATION_PAYLOAD);
    setRootPulse(true);
    setSalesShroomPos({ x: 280, y: 150 });

    const t1 = setTimeout(() => {
      setPhase("root_reviewing");
      setRootBubble(CEO_THOUGHT);
      const msgEvent = createEvent({
        shroom_id: "root-shroom",
        event: "message_sent",
        to: "sales-shroom",
        topic: "proposal_review",
        payload_summary: CEO_THOUGHT,
      });
      addEvent(msgEvent);
    }, 2000);

    const t2 = setTimeout(() => {
      setInboxVisible(true);
      setPhase("inbox_visible");
    }, 4000);

    timeoutRefs.current = [t1, t2];
  }, [phase, addEvent]);

  const handleApprove = useCallback(() => {
    setInboxDismissing(true);
    setDecision("approved");
    const decisionEvent = createEvent({
      shroom_id: "sales-shroom",
      event: "decision_received",
      payload_summary: APPROVED_MESSAGE,
      metadata: { approved: true },
    });
    addEvent(decisionEvent);
    setSalesBubble(APPROVED_MESSAGE);
    setSalesPulse("green");

    const t = setTimeout(() => {
      setInboxVisible(false);
      setInboxDismissing(false);
      setPhase("idle");
      setDecision(null);
      setRootBubble(null);
      setSalesBubble(null);
      setRootPulse(false);
      setSalesShroomPos({ x: 150, y: 200 });
      setSalesPulse("none");
    }, 600);
    timeoutRefs.current.push(t);
  }, [addEvent]);

  const handleReject = useCallback(() => {
    setInboxDismissing(true);
    setDecision("rejected");
    const decisionEvent = createEvent({
      shroom_id: "sales-shroom",
      event: "decision_received",
      payload_summary: REJECTED_MESSAGE,
      metadata: { approved: false },
    });
    addEvent(decisionEvent);
    setSalesBubble(REJECTED_MESSAGE);
    setSalesPulse("red");

    const t = setTimeout(() => {
      setInboxVisible(false);
      setInboxDismissing(false);
      setPhase("idle");
      setDecision(null);
      setRootBubble(null);
      setSalesBubble(null);
      setRootPulse(false);
      setSalesShroomPos({ x: 150, y: 200 });
      setSalesPulse("none");
    }, 600);
    timeoutRefs.current.push(t);
  }, [addEvent]);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  const shroomsWithPositions = SHROOMS.map((a) =>
    a.id === "sales-shroom" ? { ...a, ...salesShroomPos } : a
  );

  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <Stage width={800} height={500} className={styles.stage}>
          <Layer>
            {shroomsWithPositions.map((shroom) => (
              <ShroomNode
                key={shroom.id}
                shroom={shroom}
                speechBubble={
                  shroom.id === "root-shroom"
                    ? rootBubble
                    : shroom.id === "sales-shroom"
                      ? salesBubble
                      : null
                }
                pulse={
                  shroom.id === "root-shroom"
                    ? rootPulse
                    : shroom.id === "sales-shroom"
                      ? salesPulse
                      : "none"
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>

      <button
        type="button"
        className={styles.triggerBtn}
        onClick={triggerEscalation}
        disabled={phase !== "idle"}
      >
        Trigger escalation
      </button>

      <HumanInboxCard
        isVisible={inboxVisible}
        isDismissing={inboxDismissing}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <aside className={styles.eventLog}>
        <h3>Event log</h3>
        <ul>
          {events.slice(-10).reverse().map((e, i) => (
            <li key={`${e.timestamp}-${i}`}>
              <span className={styles.eventType}>{e.event}</span>
              <span className={styles.eventShroom}>{e.shroom_id}</span>
              {e.payload_summary}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

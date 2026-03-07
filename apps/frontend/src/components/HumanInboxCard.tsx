"use client";

import { useState } from "react";
import styles from "./HumanInboxCard.module.css";

export interface HumanInboxCardProps {
  title?: string;
  from?: string;
  summary?: string;
  onApprove: () => void;
  onReject: () => void;
  isVisible?: boolean;
  isDismissing?: boolean;
  initialStatus?: "idle" | "approved" | "rejected";
}

export function HumanInboxCard({
  title = "Decision required",
  from = "CEO Shroom",
  summary = "Sales shroom has qualified a new enterprise lead — Triodos Bank. Proposal attached. Approve to send?",
  onApprove,
  onReject,
  isVisible = false,
  isDismissing = false,
  initialStatus = "idle",
}: HumanInboxCardProps) {
  const [status, setStatus] = useState<"idle" | "approved" | "rejected">(initialStatus);

  const handleApprove = () => {
    setStatus("approved");
    onApprove();
  };

  const handleReject = () => {
    setStatus("rejected");
    onReject();
  };

  const cardClasses = [
    styles.card,
    isVisible && !isDismissing ? styles.cardVisible : "",
    isDismissing ? styles.cardDismissing : "",
    status === "approved" ? styles.cardApproved : "",
    status === "rejected" ? styles.cardRejected : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} role="dialog" aria-label="Human decision required">
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.from}>From: {from}</p>
        <p className={styles.summary}>{summary}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnApprove}`}
            onClick={handleApprove}
            disabled={status !== "idle"}
          >
            Approve
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnReject}`}
            onClick={handleReject}
            disabled={status !== "idle"}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

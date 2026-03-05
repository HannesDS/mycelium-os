"use client";

import React, { useCallback } from "react";

export function HumanInboxCard({
  from,
  to,
  proposalSummary,
  onApprove,
  onReject,
}) {
  const handleApprove = useCallback(() => onApprove(), [onApprove]);
  const handleReject = useCallback(() => onReject(), [onReject]);

  const cardStyle = {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 360,
    padding: 20,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    zIndex: 1000,
  };

  const btnStyle = (bg) => ({
    flex: 1,
    padding: "10px 16px",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  });

  return React.createElement(
    "div",
    { style: cardStyle },
    React.createElement("div", { style: { fontSize: 24, marginBottom: 8 } }, "📨"),
    React.createElement(
      "h3",
      {
        style: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 12,
          color: "#111827",
        },
      },
      "Proposal requires your approval"
    ),
    React.createElement(
      "p",
      { style: { fontSize: 13, color: "#6b7280", marginBottom: 8 } },
      `From: ${from} → ${to}`
    ),
    React.createElement(
      "p",
      { style: { fontSize: 14, color: "#374151", marginBottom: 16 } },
      `"${proposalSummary}"`
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8 } },
      React.createElement(
        "button",
        { onClick: handleApprove, style: btnStyle("#10b981") },
        "✅ Approve"
      ),
      React.createElement(
        "button",
        { onClick: handleReject, style: btnStyle("#ef4444") },
        "❌ Reject"
      )
    )
  );
}

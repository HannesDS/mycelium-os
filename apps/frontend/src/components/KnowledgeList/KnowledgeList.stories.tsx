import { KnowledgeList } from "./KnowledgeList";
import type { KnowledgeDocumentItem } from "@/lib/api";

const meta = {
  component: KnowledgeList,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const sampleDocs: KnowledgeDocumentItem[] = [
  {
    id: "1",
    title: "Company Handbook 2026",
    source_type: "file",
    content_type: "pdf",
    source_url: null,
    original_filename: "handbook-2026.pdf",
    content_preview: "[PDF] handbook-2026.pdf",
    access_scope: null,
    is_active: true,
    ingested_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "2",
    title: "GDPR Compliance Policy",
    source_type: "text",
    content_type: "markdown",
    source_url: null,
    original_filename: null,
    content_preview:
      "All personal data must be processed in accordance with GDPR Article 5 principles. Data minimisation applies to all shroom operations.",
    access_scope: ["compliance-shroom", "ceo-shroom"],
    is_active: true,
    ingested_at: "2026-03-12T14:30:00Z",
  },
  {
    id: "3",
    title: "https://acme.example.com/pricing",
    source_type: "url",
    content_type: "url",
    source_url: "https://acme.example.com/pricing",
    original_filename: null,
    content_preview: "Acme Corp pricing page — Enterprise plan starts at €2,400/month.",
    access_scope: ["sales-shroom"],
    is_active: true,
    ingested_at: "2026-03-14T08:00:00Z",
  },
];

export const Default = {
  args: {
    documents: sampleDocs,
    onDelete: (id: string) => console.log("Delete", id),
    deleting: null,
  },
};

export const Empty = {
  args: {
    documents: [],
    onDelete: () => {},
    deleting: null,
  },
};

export const Deleting = {
  args: {
    documents: sampleDocs,
    onDelete: () => {},
    deleting: "2",
  },
};

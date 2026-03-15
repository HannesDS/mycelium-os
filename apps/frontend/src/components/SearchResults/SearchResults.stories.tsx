import { SearchResults } from "./SearchResults";
import type { KnowledgeDocumentItem } from "@/lib/api";

const meta = {
  component: SearchResults,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0a0a0f" }] },
  },
};

export default meta;

const resultDocs: KnowledgeDocumentItem[] = [
  {
    id: "1",
    title: "GDPR Compliance Policy",
    source_type: "text",
    content_type: "markdown",
    source_url: null,
    original_filename: null,
    content_preview:
      "All personal data must be processed in accordance with GDPR Article 5 principles.",
    access_scope: ["compliance-shroom"],
    is_active: true,
    ingested_at: "2026-03-12T14:30:00Z",
  },
  {
    id: "2",
    title: "Data Retention Guidelines",
    source_type: "file",
    content_type: "pdf",
    source_url: null,
    original_filename: "data-retention.pdf",
    content_preview: "[PDF] data-retention.pdf",
    access_scope: null,
    is_active: true,
    ingested_at: "2026-03-10T10:00:00Z",
  },
];

export const WithResults = {
  args: {
    query: "GDPR data retention",
    results: resultDocs,
    onDelete: (id: string) => console.log("Delete", id),
    deleting: null,
  },
};

export const NoResults = {
  args: {
    query: "invoice approval workflow",
    results: [],
    onDelete: () => {},
    deleting: null,
  },
};

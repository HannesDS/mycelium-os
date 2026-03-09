import {
  Building,
  Sprout,
  MessageSquare,
  CheckCircle,
  Scale,
  Network,
  Brain,
  BookOpen,
  List,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Office", icon: Building, enabled: true },
  { href: "/shrooms", label: "Shrooms", icon: Sprout, enabled: true },
  { href: "/chat", label: "Chat", icon: MessageSquare, enabled: true },
  { href: "/approvals", label: "Approvals", icon: CheckCircle, enabled: true },
  { href: "/constitution", label: "Constitution", icon: Scale, enabled: true },
  { href: "/organisation", label: "Organisation", icon: Network, enabled: false },
  { href: "/memory", label: "Memory", icon: Brain, enabled: false },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen, enabled: false },
  { href: "/traces", label: "Traces", icon: List, enabled: false },
  { href: "/sessions", label: "Sessions", icon: Play, enabled: true },
];

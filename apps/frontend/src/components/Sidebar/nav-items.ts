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
  Wrench,
  UserCircle,
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
  { href: "/root", label: "Root", icon: UserCircle, enabled: true },
  { href: "/organisation", label: "Organisation", icon: Network, enabled: true },
  { href: "/skills", label: "Skills", icon: Wrench, enabled: true },
  { href: "/memory", label: "Memory", icon: Brain, enabled: false },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen, enabled: true },
  { href: "/traces", label: "Traces", icon: List, enabled: true },
  { href: "/sessions", label: "Sessions", icon: Play, enabled: true },
];

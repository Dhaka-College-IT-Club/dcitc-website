import { LucideIcon } from "lucide-react";

export interface Achievement {
  year: string;
  title: string;
  detail: string;
  image: string;
}

const TYPES = {
  NavItem: {} as {
    label: string;
    href: string;
  },

  DomainFeature: {} as {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
  },

  StatItem: {} as {
    value: string;
    label: string;
  },

  LeadershipMember: {} as {
    name: string;
    role: string;
    image: string;
    tier: "executive" | "chief" | "joint";
    batch: string;
    facebook?: string;
    linkedin?: string;
  },
};

export type NavItem = typeof TYPES.NavItem;
export type DomainFeature = typeof TYPES.DomainFeature;
export type StatItem = typeof TYPES.StatItem;
export type LeadershipMember = typeof TYPES.LeadershipMember;

export default TYPES;

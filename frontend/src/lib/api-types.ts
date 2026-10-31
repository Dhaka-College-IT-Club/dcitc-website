export type User = {
  id: number;
  email: string;
  name: string;
  hscBatch: string;
  createdAt: string;
};

export type Admin = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  active: boolean;
  createdAt: string;
};

export type Achievement = {
  id: number;
  title: string;
  detail: string;
  year: number;
  image: string | null;
  gallery: string[];
  featuredSlot: number | null;
};

export type Intel = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  date: string;
  image: string | null;
  featuredSlot: number | null;
};

export type Leader = {
  id: number;
  name: string;
  role: string;
  tier: "executive" | "chief" | "joint";
  batch: string;
  image: string | null;
  facebook: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
};

export type AuditEntry = {
  id: number;
  action: string;
  actorId: number | null;
  targetType: string | null;
  targetId: number | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type PublicSettings = {
  membershipFormUrl: string | null;
  membershipPriceBdt: number;
};
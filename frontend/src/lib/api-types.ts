export type User = {
  id: string;
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
  lastLoginAt: string | null;
  createdAt: string;
};

export type Achievement = {
  id: number;
  title: string;
  detail: string;
  year: number;
  image: string;
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
  image: string;
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
  sortOrder: number;
};

export type AuditEntry = {
  id: number;
  actorAdminId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PublicSettings = {
  membershipFormUrl: string | null;
  membershipPriceBdt: number;
};

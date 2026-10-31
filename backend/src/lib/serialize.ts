import type { achievements, admins, auditLog, intels, leadership, users } from "../db/schema.js";

type UserRow = typeof users.$inferSelect;
type AdminRow = typeof admins.$inferSelect;
type AchievementRow = typeof achievements.$inferSelect;
type IntelRow = typeof intels.$inferSelect;
type LeaderRow = typeof leadership.$inferSelect;
type AuditRow = typeof auditLog.$inferSelect;

export function toUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    hscBatch: row.hscBatch,
    createdAt: row.createdAt,
  };
}

export function toAdmin(row: AdminRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}

export function toAchievement(row: AchievementRow) {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    year: row.year,
    image: row.image,
    gallery: row.gallery,
    featuredSlot: row.featuredSlot,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toIntel(row: IntelRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    tag: row.tag,
    date: row.date,
    image: row.image,
    featuredSlot: row.featuredSlot,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toLeader(row: LeaderRow) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    tier: row.tier,
    batch: row.batch,
    image: row.image,
    facebook: row.facebook,
    linkedin: row.linkedin,
    github: row.github,
    portfolio: row.portfolio,
    sortOrder: row.sortOrder,
  };
}

export function toAuditEntry(row: AuditRow) {
  return {
    id: row.id,
    actorAdminId: row.actorAdminId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

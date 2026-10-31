import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Postgres `citext` — case-insensitive text used for admin emails. */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    hscBatch: text("hsc_batch").notNull().default(""),
    passwordHash: text("password_hash"),
    googleSub: text("google_sub"),
    tokenVersion: integer("token_version").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("users_email_lower_unique").on(sql`lower(${t.email})`),
    uniqueIndex("users_google_sub_unique")
      .on(t.googleSub)
      .where(sql`${t.googleSub} is not null`),
  ],
);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: citext("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    active: boolean("active").notNull().default(true),
    tokenVersion: integer("token_version").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [check("admins_role_check", sql`${t.role} in ('admin', 'super_admin')`)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    purpose: text("purpose").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    check("otp_codes_purpose_check", sql`${t.purpose} in ('signup', 'password_reset')`),
    index("otp_codes_lookup_idx").on(sql`lower(${t.email})`, t.purpose, t.createdAt),
  ],
);

export const leadership = pgTable(
  "leadership",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    tier: text("tier").notNull(),
    batch: text("batch").notNull(),
    image: text("image"),
    facebook: text("facebook"),
    linkedin: text("linkedin"),
    github: text("github"),
    portfolio: text("portfolio"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    check("leadership_tier_check", sql`${t.tier} in ('executive', 'chief', 'joint')`),
    index("leadership_order_idx").on(t.batch, t.tier, t.sortOrder),
  ],
);

export const achievements = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    year: integer("year").notNull(),
    image: text("image").notNull(),
    gallery: text("gallery").array().notNull().default(sql`'{}'::text[]`),
    featuredSlot: smallint("featured_slot"),
    createdAt,
    updatedAt,
  },
  (t) => [
    check("achievements_featured_slot_check", sql`${t.featuredSlot} between 0 and 4`),
    uniqueIndex("achievements_featured_slot_unique")
      .on(t.featuredSlot)
      .where(sql`${t.featuredSlot} is not null`),
    index("achievements_order_idx").on(t.year, t.createdAt),
  ],
);

export const intels = pgTable(
  "intels",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    tag: text("tag").notNull(),
    author: text("author").notNull(),
    date: text("date").notNull(),
    image: text("image").notNull(),
    featuredSlot: smallint("featured_slot"),
    createdAt,
    updatedAt,
  },
  (t) => [
    check("intels_featured_slot_check", sql`${t.featuredSlot} between 0 and 2`),
    uniqueIndex("intels_featured_slot_unique")
      .on(t.featuredSlot)
      .where(sql`${t.featuredSlot} is not null`),
    index("intels_created_idx").on(t.createdAt),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt,
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorAdminId: uuid("actor_admin_id").references(() => admins.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt,
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

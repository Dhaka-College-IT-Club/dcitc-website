import { randomUUID } from "node:crypto";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/pool.js";
import { achievements, admins, intels, leadership } from "../db/schema.js";
import { ADMIN_COOKIE, clearAdminCookie, setAdminCookie } from "../lib/cookies.js";
import {
  invalidCredentials,
  isUniqueViolation,
  notFound,
  slotTaken,
  slugTaken,
} from "../lib/errors.js";
import { signAdminToken, verifyAdminToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { toAchievement, toAdmin, toIntel, toLeader } from "../lib/serialize.js";
import { adminLoginLimiter, uploadLimiter } from "../middleware/rateLimit.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { writeAudit } from "../services/admins.js";
import { updateSettings } from "../services/settings.js";
import { signUpload } from "../uploads/index.js";
import { autoExcerpt } from "../lib/excerpt.js";

export const adminRouter = Router();

const imageField = z.string().trim().min(1, "Upload an image.");
// Leadership photos are optional; achievements and intels still use imageField.
const optionalImage = z
  .union([z.string().trim().min(1, "Upload an image."), z.null()])
  .optional()
  .default(null);
const optionalLink = z
  .union([
    z.string().trim().url("Use a full http(s) link.").regex(/^https?:\/\//i, "Use a full http(s) link."),
    z.literal(""),
    z.null(),
  ])
  .transform((value) => (value ? value : null));

const adminLogin = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomUUID());
  return dummyHash;
}

adminRouter.post("/auth/login", adminLoginLimiter, validate({ body: adminLogin }), async (req, res, next) => {
  const { email, password } = req.body as z.infer<typeof adminLogin>;
  // `admins.email` is citext, so equality is already case-insensitive.
  const [row] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (!row || !row.active) {
    // Comparable scrypt work keeps response time from revealing valid emails.
    await verifyPassword(password, await getDummyHash());
    return next(invalidCredentials());
  }
  if (!(await verifyPassword(password, row.passwordHash))) return next(invalidCredentials());

  const [updated] = await db
    .update(admins)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(admins.id, row.id))
    .returning();

  setAdminCookie(res, signAdminToken(row.id, row.role as "admin" | "super_admin", row.tokenVersion));
  res.json({ data: toAdmin(updated ?? row) });
});

adminRouter.post("/auth/logout", async (req, res) => {
  // Revoke outstanding admin sessions server-side; `active` stays untouched.
  const token = req.cookies?.[ADMIN_COOKIE] as string | undefined;
  const payload = token ? verifyAdminToken(token) : null;
  if (payload) {
    await db
      .update(admins)
      .set({ tokenVersion: sql`${admins.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(admins.id, payload.sub));
  }
  clearAdminCookie(res);
  res.status(204).end();
});

adminRouter.use(requireAdmin);

adminRouter.get("/auth/me", (req, res) => {
  res.json({ data: toAdmin(req.currentAdmin!) });
});

// --- achievements -----------------------------------------------------------

const focal = z.coerce.number().int().min(0).max(100);

const achievementBody = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200),
  detail: z.string().trim().min(1, "Enter the details.").max(5000),
  year: z.coerce.number().int().min(1900).max(2100),
  image: imageField,
  imageFocalX: focal.optional().default(50),
  imageFocalY: focal.optional().default(50),
  gallery: z.array(z.string().trim().min(1)).max(8).default([]),
});

const achievementPatch = achievementBody.partial();

adminRouter.get("/achievements", async (_req, res) => {
  const rows = await db
    .select()
    .from(achievements)
    .orderBy(desc(achievements.year), desc(achievements.createdAt))
    .limit(200);
  res.json({ data: rows.map(toAchievement) });
});

adminRouter.post("/achievements", validate({ body: achievementBody }), async (req, res) => {
  const body = req.body as z.infer<typeof achievementBody>;
  const row = await db.transaction(async (tx) => {
    const [created] = await tx.insert(achievements).values(body).returning();
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "achievement.created",
        targetType: "achievement",
        targetId: String(created!.id),
        metadata: { title: created!.title },
      },
      tx,
    );
    return created;
  });
  res.status(201).json({ data: toAchievement(row!) });
});

adminRouter.patch("/achievements/:id", validate({ body: achievementPatch }), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Achievement not found."));
  const body = req.body as z.infer<typeof achievementPatch>;
  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(achievements)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(achievements.id, id))
      .returning();
    if (!updated) return null;
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "achievement.updated",
        targetType: "achievement",
        targetId: String(id),
        metadata: { title: updated.title },
      },
      tx,
    );
    return updated;
  });
  if (!row) return next(notFound("Achievement not found."));
  res.json({ data: toAchievement(row) });
});

adminRouter.delete("/achievements/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Achievement not found."));
  const row = await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(achievements).where(eq(achievements.id, id)).returning();
    if (!deleted) return null;
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "achievement.deleted",
        targetType: "achievement",
        targetId: String(id),
        metadata: { title: deleted.title },
      },
      tx,
    );
    return deleted;
  });
  if (!row) return next(notFound("Achievement not found."));
  res.status(204).end();
});

const achievementSlot = z.object({ slot: z.union([z.number().int().min(0).max(4), z.null()]) });

adminRouter.put("/achievements/:id/featured", validate({ body: achievementSlot }), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Achievement not found."));
  const { slot } = req.body as z.infer<typeof achievementSlot>;
  try {
    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(achievements)
        .set({ featuredSlot: slot, updatedAt: new Date() })
        .where(eq(achievements.id, id))
        .returning();
      if (!updated) return null;
      await writeAudit(
        {
          actorAdminId: req.currentAdmin!.id,
          action: "achievement.featured",
          targetType: "achievement",
          targetId: String(id),
          metadata: { slot },
        },
        tx,
      );
      return updated;
    });
    if (!row) return next(notFound("Achievement not found."));
    res.json({ data: toAchievement(row) });
  } catch (error) {
    if (isUniqueViolation(error)) return next(slotTaken());
    next(error);
  }
});

// --- intels -----------------------------------------------------------------

const intelBody = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Enter a slug.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single dashes."),
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(120, "Keep the title under 120 characters.")
    .refine((value) => !/[\r\n]/.test(value), "Use a single line."),
  // Optional: an empty excerpt is derived from the body so the two never drift.
  excerpt: z
    .string()
    .trim()
    .max(200, "Keep the excerpt under 200 characters.")
    .optional(),
  content: z.string().trim().min(1, "Write the article.").max(100_000),
  tag: z.string().trim().min(1, "Enter a tag.").max(60),
  author: z.string().trim().min(1, "Enter an author.").max(120),
  date: z.string().trim().min(1, "Enter a date label.").max(60),
  image: imageField,
  imageFocalX: focal.optional().default(50),
  imageFocalY: focal.optional().default(50),
});

// Slug changes are intentionally not accepted after creation. The field is
// rejected in the schema because `validate` replaces `req.body` with its output,
// so a route-level check would never see a supplied slug.
const intelPatch = intelBody
  .omit({ slug: true })
  .partial()
  .extend({
    slug: z.never({ error: "The slug cannot be changed after creation." }).optional(),
  });

adminRouter.get("/intels", async (_req, res) => {
  const rows = await db.select().from(intels).orderBy(desc(intels.createdAt)).limit(200);
  res.json({ data: rows.map(toIntel) });
});

adminRouter.post("/intels", validate({ body: intelBody }), async (req, res, next) => {
  const body = req.body as z.infer<typeof intelBody>;
  try {
    const row = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(intels)
        .values({ ...body, excerpt: body.excerpt || autoExcerpt(body.content) })
        .returning();
      await writeAudit(
        {
          actorAdminId: req.currentAdmin!.id,
          action: "intel.created",
          targetType: "intel",
          targetId: String(created!.id),
          metadata: { slug: created!.slug },
        },
        tx,
      );
      return created;
    });
    res.status(201).json({ data: toIntel(row!) });
  } catch (error) {
    if (isUniqueViolation(error)) return next(slugTaken());
    next(error);
  }
});

adminRouter.patch("/intels/:id", validate({ body: intelPatch }), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Intel not found."));
  const body = req.body as z.infer<typeof intelPatch>;
  const update: Partial<typeof intels.$inferInsert> = { ...body, updatedAt: new Date() };
  if (update.excerpt !== undefined && !update.excerpt) {
    if (update.content) update.excerpt = autoExcerpt(update.content);
    else delete update.excerpt;
  }
  const row = await db.transaction(async (tx) => {
    const [updated] = await tx.update(intels).set(update).where(eq(intels.id, id)).returning();
    if (!updated) return null;
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "intel.updated",
        targetType: "intel",
        targetId: String(id),
        metadata: { slug: updated.slug },
      },
      tx,
    );
    return updated;
  });
  if (!row) return next(notFound("Intel not found."));
  res.json({ data: toIntel(row) });
});

adminRouter.delete("/intels/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Intel not found."));
  const row = await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(intels).where(eq(intels.id, id)).returning();
    if (!deleted) return null;
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "intel.deleted",
        targetType: "intel",
        targetId: String(id),
        metadata: { slug: deleted.slug },
      },
      tx,
    );
    return deleted;
  });
  if (!row) return next(notFound("Intel not found."));
  res.status(204).end();
});

const intelSlot = z.object({ slot: z.union([z.number().int().min(0).max(2), z.null()]) });

adminRouter.put("/intels/:id/featured", validate({ body: intelSlot }), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Intel not found."));
  const { slot } = req.body as z.infer<typeof intelSlot>;
  try {
    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(intels)
        .set({ featuredSlot: slot, updatedAt: new Date() })
        .where(eq(intels.id, id))
        .returning();
      if (!updated) return null;
      await writeAudit(
        {
          actorAdminId: req.currentAdmin!.id,
          action: "intel.featured",
          targetType: "intel",
          targetId: String(id),
          metadata: { slot },
        },
        tx,
      );
      return updated;
    });
    if (!row) return next(notFound("Intel not found."));
    res.json({ data: toIntel(row) });
  } catch (error) {
    if (isUniqueViolation(error)) return next(slotTaken());
    next(error);
  }
});

// --- leadership -------------------------------------------------------------

const leaderBody = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  role: z.string().trim().min(1, "Enter a role.").max(120),
  tier: z.enum(["executive", "chief", "joint"]),
  batch: z.string().trim().min(1, "Enter a batch.").max(40),
  image: optionalImage,
  facebook: optionalLink.optional().default(null),
  linkedin: optionalLink.optional().default(null),
  github: optionalLink.optional().default(null),
  portfolio: optionalLink.optional().default(null),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
});

const leaderPatch = leaderBody.partial();

const batchQuery = z.object({ batch: z.string().trim().max(40).optional() });

adminRouter.get("/leadership", validate({ query: batchQuery }), async (req, res) => {
  const batch = typeof req.query.batch === "string" ? req.query.batch : undefined;
  const rows = batch
    ? await db.select().from(leadership).where(eq(leadership.batch, batch)).orderBy(desc(leadership.batch), asc(leadership.sortOrder)).limit(200)
    : await db.select().from(leadership).orderBy(desc(leadership.batch), asc(leadership.sortOrder)).limit(200);
  res.json({ data: rows.map(toLeader) });
});

adminRouter.post("/leadership", validate({ body: leaderBody }), async (req, res) => {
  const body = req.body as z.infer<typeof leaderBody>;
  const row = await db.transaction(async (tx) => {
    const [created] = await tx.insert(leadership).values(body).returning();
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "leadership.created",
        targetType: "leadership",
        targetId: String(created!.id),
        metadata: { name: created!.name },
      },
      tx,
    );
    return created;
  });
  res.status(201).json({ data: toLeader(row!) });
});

adminRouter.patch("/leadership/:id", validate({ body: leaderPatch }), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Member not found."));
  const body = req.body as z.infer<typeof leaderPatch>;
  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(leadership)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(leadership.id, id))
      .returning();
    if (!updated) return null;
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "leadership.updated",
        targetType: "leadership",
        targetId: String(id),
        metadata: { name: updated.name },
      },
      tx,
    );
    return updated;
  });
  if (!row) return next(notFound("Member not found."));
  res.json({ data: toLeader(row) });
});

adminRouter.delete("/leadership/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next(notFound("Member not found."));
  const row = await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(leadership).where(eq(leadership.id, id)).returning();
    if (!deleted) return null;
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "leadership.deleted",
        targetType: "leadership",
        targetId: String(id),
        metadata: { name: deleted.name },
      },
      tx,
    );
    return deleted;
  });
  if (!row) return next(notFound("Member not found."));
  res.status(204).end();
});

// --- settings and uploads ---------------------------------------------------

const settingsBody = z.object({
  membershipFormUrl: z
    .union([z.string().trim().url("Enter a full URL.").regex(/^https?:\/\//i, "Enter a full URL."), z.null()])
    .optional(),
  membershipPriceBdt: z.coerce.number().int().positive().max(1_000_000).optional(),
});

adminRouter.put("/settings", validate({ body: settingsBody }), async (req, res) => {
  const body = req.body as z.infer<typeof settingsBody>;
  const updated = await db.transaction(async (tx) => {
    const published = await updateSettings(body, tx);
    await writeAudit(
      {
        actorAdminId: req.currentAdmin!.id,
        action: "settings.updated",
        targetType: "settings",
        targetId: null,
        metadata: { keys: Object.keys(body) },
      },
      tx,
    );
    return published;
  });
  res.json({ data: updated });
});

const uploadBody = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1),
  size: z.coerce.number().int().positive().optional(),
});

adminRouter.post(
  "/uploads/sign",
  uploadLimiter,
  validate({ body: uploadBody }),
  async (req, res) => {
    const { filename, contentType, size } = req.body as z.infer<typeof uploadBody>;
    res.json({ data: await signUpload(filename, contentType, size) });
  },
);

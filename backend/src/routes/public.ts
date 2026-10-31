import { asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/pool.js";
import { achievements, intels, leadership } from "../db/schema.js";
import { notFound } from "../lib/errors.js";
import { toAchievement, toIntel, toLeader } from "../lib/serialize.js";
import { validate } from "../middleware/validate.js";
import { readPublicSettings } from "../services/settings.js";

export const publicRouter = Router();

const CAP = 200;
const batchQuery = z.object({ batch: z.string().trim().max(40).optional() });

publicRouter.get("/achievements", async (req, res) => {
  const featured = req.query.featured === "true";
  const rows = featured
    ? await db
        .select()
        .from(achievements)
        .where(isNotNull(achievements.featuredSlot))
        .orderBy(asc(achievements.featuredSlot))
        .limit(CAP)
    : await db
        .select()
        .from(achievements)
        .orderBy(desc(achievements.year), desc(achievements.createdAt))
        .limit(CAP);

  res.json({ data: rows.map(toAchievement) });
});

const ID_PATTERN = /^\d{1,9}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

publicRouter.get("/achievements/:id", async (req, res, next) => {
  const raw = req.params.id ?? "";
  if (!ID_PATTERN.test(raw)) return next(notFound("Achievement not found."));
  const id = Number(raw);
  const [row] = await db.select().from(achievements).where(eq(achievements.id, id)).limit(1);
  if (!row) return next(notFound("Achievement not found."));
  res.json({ data: toAchievement(row) });
});

publicRouter.get("/intels", async (req, res) => {
  const featured = req.query.featured === "true";
  const rows = featured
    ? await db
        .select()
        .from(intels)
        .where(isNotNull(intels.featuredSlot))
        .orderBy(asc(intels.featuredSlot))
        .limit(CAP)
    : await db.select().from(intels).orderBy(desc(intels.createdAt)).limit(CAP);

  res.json({ data: rows.map(toIntel) });
});

publicRouter.get("/intels/:slug", async (req, res, next) => {
  const slug = req.params.slug ?? "";
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) return next(notFound("Intel not found."));
  const [row] = await db.select().from(intels).where(eq(intels.slug, slug)).limit(1);
  if (!row) return next(notFound("Intel not found."));
  res.json({ data: toIntel(row) });
});

publicRouter.get("/leadership", validate({ query: batchQuery }), async (req, res) => {
  const batch = typeof req.query.batch === "string" ? req.query.batch : undefined;
  const tierOrder = sql`case ${leadership.tier} when 'executive' then 1 when 'chief' then 2 else 3 end`;

  const base = db.select().from(leadership);
  const rows = batch
    ? await base.where(eq(leadership.batch, batch)).orderBy(desc(leadership.batch), tierOrder, asc(leadership.sortOrder)).limit(CAP)
    : await base.orderBy(desc(leadership.batch), tierOrder, asc(leadership.sortOrder)).limit(CAP);

  res.json({ data: rows.map(toLeader) });
});

publicRouter.get("/settings/public", async (_req, res) => {
  res.json({ data: await readPublicSettings() });
});

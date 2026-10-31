import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/pool.js";
import { admins, auditLog } from "../db/schema.js";
import { cannotModifySelf, emailTaken, isUniqueViolation, notFound } from "../lib/errors.js";
import { hashPassword } from "../lib/password.js";
import { toAdmin, toAuditEntry } from "../lib/serialize.js";
import { requireSuperAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { writeAudit } from "../services/admins.js";

export const superAdminRouter = Router();

superAdminRouter.use(requireSuperAdmin);

const createAdmin = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1, "Enter a name.").max(120),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  role: z.enum(["admin", "super_admin"]),
});

const patchAdmin = z.object({ active: z.boolean() });

const rotatePassword = z.object({ password: z.string().min(8, "Use at least 8 characters.").max(200) });

const uuidParam = z.object({ id: z.string().uuid() });

superAdminRouter.get("/admins", async (_req, res) => {
  const rows = await db.select().from(admins).orderBy(desc(admins.createdAt)).limit(200);
  res.json({ data: rows.map(toAdmin) });
});

superAdminRouter.post("/admins", validate({ body: createAdmin }), async (req, res, next) => {
  const body = req.body as z.infer<typeof createAdmin>;
  try {
    const [row] = await db
      .insert(admins)
      .values({
        email: body.email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
        role: body.role,
      })
      .returning();
    await writeAudit({
      actorAdminId: req.currentAdmin!.id,
      action: "admin.created",
      targetType: "admin",
      targetId: row!.id,
      metadata: { email: row!.email, role: row!.role },
    });
    res.status(201).json({ data: toAdmin(row!) });
  } catch (error) {
    if (isUniqueViolation(error)) return next(emailTaken());
    next(error);
  }
});

superAdminRouter.patch(
  "/admins/:id",
  validate({ params: uuidParam, body: patchAdmin }),
  async (req, res, next) => {
    const { id } = req.params as unknown as z.infer<typeof uuidParam>;
    const { active } = req.body as z.infer<typeof patchAdmin>;
    if (id === req.currentAdmin!.id) return next(cannotModifySelf());

    const [current] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (!current) return next(notFound("Admin not found."));

    const [row] = await db
      .update(admins)
      .set({
        active,
        // Deactivation and reactivation both invalidate outstanding sessions.
        tokenVersion: current.tokenVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, id))
      .returning();

    await writeAudit({
      actorAdminId: req.currentAdmin!.id,
      action: active ? "admin.activated" : "admin.deactivated",
      targetType: "admin",
      targetId: id,
      metadata: { email: current.email },
    });
    res.json({ data: toAdmin(row!) });
  },
);

superAdminRouter.post(
  "/admins/:id/rotate-password",
  validate({ params: uuidParam, body: rotatePassword }),
  async (req, res, next) => {
    const { id } = req.params as unknown as z.infer<typeof uuidParam>;
    const { password } = req.body as z.infer<typeof rotatePassword>;
    if (id === req.currentAdmin!.id) return next(cannotModifySelf());

    const [current] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (!current) return next(notFound("Admin not found."));

    await db
      .update(admins)
      .set({
        passwordHash: await hashPassword(password),
        tokenVersion: current.tokenVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, id));

    await writeAudit({
      actorAdminId: req.currentAdmin!.id,
      action: "admin.password_rotated",
      targetType: "admin",
      targetId: id,
      metadata: { email: current.email },
    });
    res.json({ data: { rotated: true } });
  },
);

const auditQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

superAdminRouter.get("/audit-log", validate({ query: auditQuery }), async (req, res) => {
  const { limit } = req.query as unknown as z.infer<typeof auditQuery>;
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(limit);
  res.json({ data: rows.map(toAuditEntry) });
});

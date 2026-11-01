import "./setup.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/pool.js";
import { admins, intels, leadership, settings, users } from "../src/db/schema.js";
import { signUserToken } from "../src/lib/jwt.js";
import { hashPassword, verifyPassword } from "../src/lib/password.js";
import { testOutbox } from "../src/mail/index.js";
import { reconcileSeedAdmin, seedAdmins } from "../src/services/admins.js";
import { readPublicSettings, updateSettings } from "../src/services/settings.js";
import { closePool, hasTestDb, prepareDatabase } from "./db.js";
import { Client, startServer } from "./helpers.js";

let baseUrl: string;
let close: () => Promise<void>;
let admin: Client;
const dbIt = hasTestDb ? it : it.skip;

const superEmail = () => process.env.SUPER_ADMIN_EMAIL!;
const superPassword = () => process.env.SUPER_ADMIN_PASSWORD!;

async function loginAdmin(email: string, password: string): Promise<Client> {
  const session = new Client(baseUrl);
  const response = await session.req("/api/v2/admin/auth/login", { body: { email, password } });
  assert.equal(response.status, 200, `admin login failed for ${email}`);
  return session;
}

const achievement = (overrides: Record<string, unknown> = {}) => ({
  title: "Robotics Finalist",
  detail: "Top six nationwide.",
  year: 2025,
  image: "https://example.com/a.png",
  gallery: [],
  ...overrides,
});

const intel = (slug: string, overrides: Record<string, unknown> = {}) => ({
  slug,
  title: `Intel ${slug}`,
  excerpt: "Short excerpt.",
  content: "Full article body.",
  tag: "Robotics",
  author: "DCITC Team",
  date: "Nov 2025",
  image: "https://example.com/i.png",
  ...overrides,
});

before(async () => {
  if (!hasTestDb) return;
  await prepareDatabase();
  const started = await startServer();
  baseUrl = started.baseUrl;
  close = started.close;
  admin = await loginAdmin(superEmail(), superPassword());
});

after(async () => {
  if (!hasTestDb) return;
  await close();
  await closePool();
});

describe("admin seeding", () => {
  dbIt("seeds only the super admin on boot", async () => {
    // prepareDatabase() truncates and re-seeds, so this runs before any test
    // creates an operator. test/setup.ts leaves ADMIN_EMAIL/ADMIN_PASSWORD
    // unset, so an operator must not be created.
    const rows = await db.select().from(admins);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.email, superEmail());
    assert.equal(rows[0]!.role, "super_admin");
  });

  dbIt("re-applies a changed env password to the seeded super admin", async () => {
    const [seeded] = await db.select().from(admins).where(eq(admins.email, superEmail()));
    assert.ok(seeded, "seeded super admin missing");

    // Simulate an env password change: the stored hash no longer matches.
    await db
      .update(admins)
      .set({ passwordHash: await hashPassword("OutOfSync123!"), active: false })
      .where(eq(admins.id, seeded.id));

    await seedAdmins();

    const [synced] = await db.select().from(admins).where(eq(admins.id, seeded.id));
    assert.ok(synced);
    assert.ok(await verifyPassword(superPassword(), synced.passwordHash), "env password must work");
    assert.equal(synced.active, true);
    assert.ok(synced.tokenVersion > seeded.tokenVersion, "credential change revokes old sessions");

    // The bump above invalidated the suite's session; log back in with .env values.
    admin = await loginAdmin(superEmail(), superPassword());
  });

  dbIt("creates an env operator account and keeps its credentials in sync", async () => {
    await reconcileSeedAdmin({
      email: "operator@example.com",
      password: "Operator123!",
      name: "Operator",
      role: "admin",
    });

    assert.equal((await loginAdmin("operator@example.com", "Operator123!")).cookie.includes("dcitc_admin="), true);

    // A rotated env password replaces the stored one without adding a row.
    await reconcileSeedAdmin({
      email: "operator@example.com",
      password: "Rotated123!",
      name: "Operator",
      role: "admin",
    });
    const rows = await db.select().from(admins).where(eq(admins.email, "operator@example.com"));
    assert.equal(rows.length, 1);
    assert.ok(await verifyPassword("Rotated123!", rows[0]!.passwordHash));
    assert.equal((await loginAdmin("operator@example.com", "Rotated123!")).cookie.includes("dcitc_admin="), true);
  });
});

describe("health and platform", () => {
  dbIt("reports database health", async () => {
    const response = await new Client(baseUrl).req("/api/v2/health");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, { status: "ok", database: "up" });
  });

  dbIt("returns the error envelope for unknown and unversioned paths", async () => {
    const client = new Client(baseUrl);
    for (const path of ["/api/v2/nope", "/api/achievements"]) {
      const response = await client.req(path);
      assert.equal(response.status, 404);
      assert.equal(response.body.error.code, "not_found");
    }
  });

  dbIt("rejects oversized JSON bodies with 413", async () => {
    const response = await new Client(baseUrl).req("/api/v2/contact", {
      body: { name: "a", email: "a@b.co", message: "x".repeat(200_000) },
    });
    assert.equal(response.status, 413);
  });
});

describe("public reads", () => {
  dbIt("lists achievements newest year first and resolves details", async () => {
    const client = new Client(baseUrl);
    const list = await client.req("/api/v2/achievements");
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 6);
    const years = list.body.data.map((row: { year: number }) => row.year);
    assert.deepEqual(years, [...years].sort((a, b) => b - a));
    assert.ok(years.every((year: number) => Number.isInteger(year)));

    const first = list.body.data[0];
    assert.deepEqual(Object.keys(first).sort(), [
      "createdAt",
      "detail",
      "featuredSlot",
      "gallery",
      "id",
      "image",
      "imageFocalX",
      "imageFocalY",
      "title",
      "updatedAt",
      "year",
    ]);

    const detail = await client.req(`/api/v2/achievements/${first.id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.title, first.title);

    for (const path of ["/api/v2/achievements/999999", "/api/v2/achievements/not-a-number", "/api/v2/achievements/1e3"]) {
      const missing = await client.req(path);
      assert.equal(missing.status, 404);
      assert.equal(missing.body.error.code, "not_found");
    }

    const nul = await client.req("/api/v2/intels/a%00b");
    assert.equal(nul.status, 400);
    assert.equal(nul.body.error.code, "validation_failed");
  });

  dbIt("lists intels and resolves exact slugs", async () => {
    const client = new Client(baseUrl);
    const list = await client.req("/api/v2/intels");
    assert.equal(list.body.data.length, 6);

    const detail = await client.req("/api/v2/intels/getting-started-with-dcitc");
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.slug, "getting-started-with-dcitc");
    assert.deepEqual(Object.keys(detail.body.data).sort(), [
      "author",
      "content",
      "createdAt",
      "date",
      "excerpt",
      "featuredSlot",
      "id",
      "image",
      "imageFocalX",
      "imageFocalY",
      "slug",
      "tag",
      "title",
      "updatedAt",
    ]);
    assert.equal(detail.body.data.author, "DCITC Team");

    const missing = await client.req("/api/v2/intels/Getting-Started-With-Dcitc");
    assert.equal(missing.status, 404);
  });

  dbIt("filters leadership by batch and returns null social links", async () => {
    const client = new Client(baseUrl);
    const all = await client.req("/api/v2/leadership");
    assert.equal(all.body.data.length, 36);
    assert.equal(all.body.data[0].github, null);
    assert.equal(all.body.data[0].facebook, null);
    assert.ok("sortOrder" in all.body.data[0]);

    const batch = await client.req("/api/v2/leadership?batch=DC-26");
    assert.equal(batch.body.data.length, 9);
    assert.ok(batch.body.data.every((row: { batch: string }) => row.batch === "DC-26"));
  });

  dbIt("exposes only the two public settings", async () => {
    const response = await new Client(baseUrl).req("/api/v2/settings/public");
    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body.data).sort(), ["membershipFormUrl", "membershipPriceBdt"]);
    assert.equal(typeof response.body.data.membershipPriceBdt, "number");
  });
});

describe("admin gates", () => {
  dbIt("rejects anonymous and user-session callers", async () => {
    const anonymous = await new Client(baseUrl).req("/api/v2/admin/achievements");
    assert.equal(anonymous.status, 401);

    const user = new Client(baseUrl);
    const [row] = await db
      .insert(users)
      .values({
        email: "member@example.com",
        name: "Member",
        hscBatch: "DC-27",
        passwordHash: await hashPassword("Password123!"),
      })
      .returning();
    user.cookie = `dcitc_at=${signUserToken(row!.id, row!.tokenVersion)}`;
    const withUserCookie = await user.req("/api/v2/admin/achievements");
    assert.equal(withUserCookie.status, 401);
  });
});

describe("achievement administration", () => {
  dbIt("requires an image and stores the integer year", async () => {
    const missing = await admin.req("/api/v2/admin/achievements", {
      body: achievement({ image: "" }),
    });
    assert.equal(missing.status, 400);
    assert.ok(missing.body.error.fields.image);

    const omitted = achievement();
    delete (omitted as { image?: string }).image;
    const withoutImage = await admin.req("/api/v2/admin/achievements", { body: omitted });
    assert.equal(withoutImage.status, 400);
    assert.ok(withoutImage.body.error.fields.image);

    const created = await admin.req("/api/v2/admin/achievements", { body: achievement() });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.year, 2025);

    const patched = await admin.req(`/api/v2/admin/achievements/${created.body.data.id}`, {
      method: "PATCH",
      body: { title: "Renamed" },
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.title, "Renamed");
  });

  dbIt("enforces featured slot exclusivity and clearing", async () => {
    const client = admin;
    const a = await client.req("/api/v2/admin/achievements", { body: achievement({ title: "A" }) });
    const b = await client.req("/api/v2/admin/achievements", { body: achievement({ title: "B" }) });

    const assign = await client.req(`/api/v2/admin/achievements/${a.body.data.id}/featured`, {
      method: "PUT",
      body: { slot: 0 },
    });
    assert.equal(assign.status, 200);

    const conflict = await client.req(`/api/v2/admin/achievements/${b.body.data.id}/featured`, {
      method: "PUT",
      body: { slot: 0 },
    });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, "slot_taken");

    const outOfRange = await client.req(`/api/v2/admin/achievements/${b.body.data.id}/featured`, {
      method: "PUT",
      body: { slot: 5 },
    });
    assert.equal(outOfRange.status, 400);

    const featured = await new Client(baseUrl).req("/api/v2/achievements?featured=true");
    assert.deepEqual(
      featured.body.data.map((row: { id: number }) => row.id),
      [a.body.data.id],
    );

    const cleared = await client.req(`/api/v2/admin/achievements/${a.body.data.id}/featured`, {
      method: "PUT",
      body: { slot: null },
    });
    assert.equal(cleared.status, 200);
    const empty = await new Client(baseUrl).req("/api/v2/achievements?featured=true");
    assert.equal(empty.body.data.length, 0);
  });

  dbIt("records creation, edits and featured-slot changes", async () => {
    const created = await admin.req("/api/v2/admin/achievements", { body: achievement({ title: "Audited create" }) });
    assert.equal(created.status, 201);
    const id = created.body.data.id;

    const featured = await admin.req(`/api/v2/admin/achievements/${id}/featured`, {
      method: "PUT",
      body: { slot: 4 },
    });
    assert.equal(featured.status, 200);

    const patched = await admin.req(`/api/v2/admin/achievements/${id}`, {
      method: "PATCH",
      body: { title: "Audited edit" },
    });
    assert.equal(patched.status, 200);

    const audit = await admin.req("/api/v2/super-admin/audit-log?limit=20");
    const actions = audit.body.data.map((entry: { action: string }) => entry.action);
    for (const action of ["achievement.created", "achievement.featured", "achievement.updated"]) {
      assert.ok(actions.includes(action), `${action} missing from the audit log`);
    }

    await admin.req(`/api/v2/admin/achievements/${id}/featured`, { method: "PUT", body: { slot: null } });
    await admin.req(`/api/v2/admin/achievements/${id}`, { method: "DELETE" });
  });

  dbIt("records a deletion audit entry", async () => {
    const created = await admin.req("/api/v2/admin/achievements", { body: achievement({ title: "Delete me" }) });
    const deleted = await admin.req(`/api/v2/admin/achievements/${created.body.data.id}`, { method: "DELETE" });
    assert.equal(deleted.status, 204);

    const audit = await admin.req("/api/v2/super-admin/audit-log?limit=5");
    assert.equal(audit.status, 200);
    assert.ok(audit.body.data.some((entry: { action: string }) => entry.action === "achievement.deleted"));
  });
});

describe("intel administration", () => {
  dbIt("requires an author and returns it", async () => {
    const omitted = intel("no-author");
    delete (omitted as { author?: string }).author;
    const missing = await admin.req("/api/v2/admin/intels", { body: omitted });
    assert.equal(missing.status, 400);
    assert.ok(missing.body.error.fields.author);

    const blank = await admin.req("/api/v2/admin/intels", { body: intel("blank-author", { author: "   " }) });
    assert.equal(blank.status, 400);
    assert.ok(blank.body.error.fields.author);

    const created = await admin.req("/api/v2/admin/intels", {
      body: intel("authored-intel", { author: "Ayesha Rahman" }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.author, "Ayesha Rahman");

    const publicDetail = await new Client(baseUrl).req("/api/v2/intels/authored-intel");
    assert.equal(publicDetail.status, 200);
    assert.equal(publicDetail.body.data.author, "Ayesha Rahman");

    const patched = await admin.req(`/api/v2/admin/intels/${created.body.data.id}`, {
      method: "PATCH",
      body: { author: "Tanvir Ahmed" },
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.data.author, "Tanvir Ahmed");
  });

  dbIt("requires an image", async () => {
    const payload = intel("no-image");
    delete (payload as { image?: string }).image;
    const missing = await admin.req("/api/v2/admin/intels", { body: payload });
    assert.equal(missing.status, 400);
    assert.ok(missing.body.error.fields.image);
  });

  dbIt("caps title and excerpt and stores the focal point", async () => {
    const longTitle = await admin.req("/api/v2/admin/intels", {
      body: intel("long-title", { title: "x".repeat(121) }),
    });
    assert.equal(longTitle.status, 400);
    assert.ok(longTitle.body.error.fields.title);

    const longExcerpt = await admin.req("/api/v2/admin/intels", {
      body: intel("long-excerpt", { excerpt: "x".repeat(201) }),
    });
    assert.equal(longExcerpt.status, 400);
    assert.ok(longExcerpt.body.error.fields.excerpt);

    const badFocal = await admin.req("/api/v2/admin/intels", {
      body: intel("bad-focal", { imageFocalX: 101 }),
    });
    assert.equal(badFocal.status, 400);
    assert.ok(badFocal.body.error.fields.imageFocalX);

    const created = await admin.req("/api/v2/admin/intels", {
      body: intel("focal-intel", {
        excerpt: "",
        content: "## Heading\n\nFirst paragraph of the body.",
        imageFocalX: 25,
        imageFocalY: 80,
      }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.imageFocalX, 25);
    assert.equal(created.body.data.imageFocalY, 80);
    // Empty excerpt is derived from the body with markdown stripped.
    assert.equal(created.body.data.excerpt, "Heading First paragraph of the body.");

    const defaults = await admin.req("/api/v2/admin/intels", {
      body: intel("default-focal"),
    });
    assert.equal(defaults.body.data.imageFocalX, 50);
    assert.equal(defaults.body.data.imageFocalY, 50);
  });

  dbIt("rejects duplicate slugs and keeps slugs immutable", async () => {
    const created = await admin.req("/api/v2/admin/intels", { body: intel("my-intel") });
    assert.equal(created.status, 201);

    const duplicate = await admin.req("/api/v2/admin/intels", { body: intel("my-intel") });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "slug_taken");

    const patched = await admin.req(`/api/v2/admin/intels/${created.body.data.id}`, {
      method: "PATCH",
      body: { title: "New title", slug: "changed-slug" },
    });
    assert.equal(patched.status, 400);
    assert.ok(patched.body.error.fields.slug);

    const [unchanged] = await db
      .select()
      .from(intels)
      .where(eq(intels.id, created.body.data.id));
    assert.equal(unchanged!.title, "Intel my-intel", "a rejected slug edit must not change the row");
    assert.equal(unchanged!.slug, "my-intel");

    const renamed = await admin.req(`/api/v2/admin/intels/${created.body.data.id}`, {
      method: "PATCH",
      body: { title: "New title" },
    });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.data.title, "New title");
    assert.equal(renamed.body.data.slug, "my-intel");
  });

  dbIt("rejects a title containing a line break", async () => {
    const response = await admin.req("/api/v2/admin/intels", {
      body: intel("newline-title", { title: "Two\nlines" }),
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.error.fields.title);

    const patched = await admin.req("/api/v2/admin/intels/999999", {
      method: "PATCH",
      body: { title: "Two\r\nlines" },
    });
    assert.equal(patched.status, 400);
    assert.ok(patched.body.error.fields.title);
  });

  dbIt("rejects a fourth featured intel", async () => {
    const ids: number[] = [];
    for (const slug of ["slot-a", "slot-b", "slot-c"]) {
      const created = await admin.req("/api/v2/admin/intels", { body: intel(slug) });
      ids.push(created.body.data.id);
    }
    for (const [index, id] of ids.entries()) {
      const assigned = await admin.req(`/api/v2/admin/intels/${id}/featured`, {
        method: "PUT",
        body: { slot: index },
      });
      assert.equal(assigned.status, 200);
    }

    const extra = await admin.req("/api/v2/admin/intels", { body: intel("slot-d") });
    const conflict = await admin.req(`/api/v2/admin/intels/${extra.body.data.id}/featured`, {
      method: "PUT",
      body: { slot: 2 },
    });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, "slot_taken");
  });

  dbIt("deletes an intel and records the deletion", async () => {
    const created = await admin.req("/api/v2/admin/intels", { body: intel("delete-intel") });
    assert.equal(created.status, 201);

    const deleted = await admin.req(`/api/v2/admin/intels/${created.body.data.id}`, { method: "DELETE" });
    assert.equal(deleted.status, 204);

    const missing = await new Client(baseUrl).req("/api/v2/intels/delete-intel");
    assert.equal(missing.status, 404);

    const audit = await admin.req("/api/v2/super-admin/audit-log?limit=20");
    assert.ok(
      audit.body.data.some(
        (entry: { action: string; targetId: string }) =>
          entry.action === "intel.deleted" && entry.targetId === String(created.body.data.id),
      ),
    );
  });
});

describe("leadership administration", () => {
  dbIt("makes the image optional, validates tier and links, and orders by sortOrder", async () => {
    const missingImage = await admin.req("/api/v2/admin/leadership", {
      body: { name: "No Image", role: "Member", tier: "joint", batch: "DC-27" },
    });
    assert.equal(missingImage.status, 201);
    assert.equal(missingImage.body.data.image, null);

    const badTier = await admin.req("/api/v2/admin/leadership", {
      body: { name: "Bad Tier", role: "Member", tier: "director", batch: "DC-27", image: "/x.png" },
    });
    assert.equal(badTier.status, 400);
    assert.ok(badTier.body.error.fields.tier);

    const badLink = await admin.req("/api/v2/admin/leadership", {
      body: { name: "Bad Link", role: "Member", tier: "joint", batch: "DC-27", image: "/x.png", linkedin: "not-a-url" },
    });
    assert.equal(badLink.status, 400);
    assert.ok(badLink.body.error.fields.linkedin);

    const created = await admin.req("/api/v2/admin/leadership", {
      body: {
        name: "Only LinkedIn",
        role: "Joint Secretary",
        tier: "joint",
        batch: "DC-27",
        image: "/leadership/only.png",
        linkedin: "https://linkedin.com/in/example",
        sortOrder: 900,
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.linkedin, "https://linkedin.com/in/example");
    assert.equal(created.body.data.facebook, null);
    assert.equal(created.body.data.github, null);

    const sibling = await admin.req("/api/v2/admin/leadership", {
      body: {
        name: "Reorder Me",
        role: "Member",
        tier: "joint",
        batch: "DC-27",
        image: "/leadership/sibling.png",
        sortOrder: 901,
      },
    });

    const names = async () => {
      const list = await new Client(baseUrl).req("/api/v2/leadership?batch=DC-27");
      return list.body.data.map((row: { name: string }) => row.name) as string[];
    };
    const before = await names();
    assert.ok(before.indexOf("Only LinkedIn") < before.indexOf("Reorder Me"));

    await admin.req(`/api/v2/admin/leadership/${sibling.body.data.id}`, {
      method: "PATCH",
      body: { sortOrder: 899 },
    });
    const after = await names();
    assert.ok(after.indexOf("Reorder Me") < after.indexOf("Only LinkedIn"));

    const promoted = await admin.req(`/api/v2/admin/leadership/${created.body.data.id}`, {
      method: "PATCH",
      body: { batch: "DC-26", tier: "chief", role: "Deputy" },
    });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.body.data.batch, "DC-26");
    assert.equal(promoted.body.data.tier, "chief");

    const moved = await new Client(baseUrl).req("/api/v2/leadership?batch=DC-26");
    const published = moved.body.data.find((row: { id: number }) => row.id === created.body.data.id);
    assert.equal(published?.batch, "DC-26");
    assert.equal(published?.tier, "chief");
    assert.equal(published?.role, "Deputy");

    for (const id of [created.body.data.id, sibling.body.data.id, missingImage.body.data.id]) {
      const removed = await admin.req(`/api/v2/admin/leadership/${id}`, { method: "DELETE" });
      assert.equal(removed.status, 204);
    }

    const audit = await admin.req("/api/v2/super-admin/audit-log?limit=20");
    assert.ok(audit.body.data.some((entry: { action: string }) => entry.action === "leadership.deleted"));
  });
});

describe("audit atomicity", () => {
  dbIt("rolls back the content change when the audit insert fails", async () => {
    await db.execute(
      sql`create or replace function fail_audit_insert() returns trigger language plpgsql as $$ begin raise exception 'forced audit failure'; end $$`,
    );
    await db.execute(
      sql`create trigger fail_audit_insert before insert on audit_log for each row execute function fail_audit_insert()`,
    );

    try {
      const name = "Rollback Probe";
      const response = await admin.req("/api/v2/admin/leadership", {
        body: { name, role: "Member", tier: "joint", batch: "DC-27" },
      });
      assert.equal(response.status, 500);

      const rows = await db.select().from(leadership).where(eq(leadership.name, name));
      assert.equal(rows.length, 0, "the content row must roll back with its audit record");
    } finally {
      await db.execute(sql`drop trigger if exists fail_audit_insert on audit_log`);
      await db.execute(sql`drop function if exists fail_audit_insert()`);
    }
  });
});

describe("plain admin content access", () => {
  dbIt("can create, update and delete all three content types but cannot reach super-admin routes", async () => {
    await db.insert(admins).values({
      email: "content-admin@example.com",
      name: "Content Admin",
      passwordHash: await hashPassword("Content123!"),
      role: "admin",
    });
    const session = await loginAdmin("content-admin@example.com", "Content123!");

    const achievementCreated = await session.req("/api/v2/admin/achievements", {
      body: achievement({ title: "Plain admin achievement" }),
    });
    assert.equal(achievementCreated.status, 201);
    const achievementPatched = await session.req(
      `/api/v2/admin/achievements/${achievementCreated.body.data.id}`,
      { method: "PATCH", body: { detail: "Updated by a plain admin." } },
    );
    assert.equal(achievementPatched.status, 200);
    const achievementDeleted = await session.req(
      `/api/v2/admin/achievements/${achievementCreated.body.data.id}`,
      { method: "DELETE" },
    );
    assert.equal(achievementDeleted.status, 204);

    const intelCreated = await session.req("/api/v2/admin/intels", {
      body: intel("plain-admin-intel"),
    });
    assert.equal(intelCreated.status, 201);
    const intelPatched = await session.req(`/api/v2/admin/intels/${intelCreated.body.data.id}`, {
      method: "PATCH",
      body: { title: "Plain admin intel" },
    });
    assert.equal(intelPatched.status, 200);
    const intelDeleted = await session.req(`/api/v2/admin/intels/${intelCreated.body.data.id}`, {
      method: "DELETE",
    });
    assert.equal(intelDeleted.status, 204);

    const leaderCreated = await session.req("/api/v2/admin/leadership", {
      body: { name: "Plain Admin Leader", role: "Member", tier: "joint", batch: "DC-27" },
    });
    assert.equal(leaderCreated.status, 201);
    const leaderPatched = await session.req(
      `/api/v2/admin/leadership/${leaderCreated.body.data.id}`,
      { method: "PATCH", body: { role: "Joint Secretary" } },
    );
    assert.equal(leaderPatched.status, 200);
    const leaderDeleted = await session.req(
      `/api/v2/admin/leadership/${leaderCreated.body.data.id}`,
      { method: "DELETE" },
    );
    assert.equal(leaderDeleted.status, 204);

    for (const path of ["/api/v2/super-admin/admins", "/api/v2/super-admin/audit-log"]) {
      const forbidden = await session.req(path);
      assert.equal(forbidden.status, 403);
      assert.equal(forbidden.body.error.code, "forbidden");
    }

    const audit = await admin.req("/api/v2/super-admin/audit-log?limit=30");
    for (const action of ["achievement.deleted", "intel.deleted", "leadership.deleted"]) {
      assert.ok(audit.body.data.some((entry: { action: string }) => entry.action === action), `${action} missing`);
    }
  });
});

describe("settings administration", () => {
  dbIt("publishes the default price when the stored value is missing or unusable", async () => {
    const cases: Array<[string | null, number]> = [
      [null, 100],
      ["abc", 100],
      ["0", 100],
      ["-5", 100],
      ["150", 150],
    ];

    for (const [stored, expected] of cases) {
      await db.delete(settings).where(eq(settings.key, "membership_price_bdt"));
      if (stored !== null) {
        await db.insert(settings).values({ key: "membership_price_bdt", value: stored });
      }
      const published = await readPublicSettings();
      assert.equal(
        published.membershipPriceBdt,
        expected,
        `stored ${JSON.stringify(stored)} should publish ${expected}`,
      );
    }

    // Restore a valid row so order-independent later tests have a real value.
    await updateSettings({ membershipPriceBdt: 150, membershipFormUrl: "https://forms.gle/abc123" });
  });

  dbIt("accepts a cleared form URL, rejects an empty string and reflects the clear publicly", async () => {
    const cleared = await admin.req("/api/v2/admin/settings", {
      method: "PUT",
      body: { membershipFormUrl: null },
    });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.data.membershipFormUrl, null);

    const publicAfterClear = await new Client(baseUrl).req("/api/v2/settings/public");
    assert.equal(publicAfterClear.body.data.membershipFormUrl, null);

    const empty = await admin.req("/api/v2/admin/settings", {
      method: "PUT",
      body: { membershipFormUrl: "" },
    });
    assert.equal(empty.status, 400);
    assert.ok(empty.body.error.fields.membershipFormUrl);
    assert.equal(empty.body.data, undefined);
    assert.equal(
      (await new Client(baseUrl).req("/api/v2/settings/public")).body.data.membershipFormUrl,
      null,
      "a rejected save must leave the stored value unchanged",
    );

    const restored = await admin.req("/api/v2/admin/settings", {
      method: "PUT",
      body: { membershipFormUrl: "https://forms.gle/abc123" },
    });
    assert.equal(restored.status, 200);
  });

  dbIt("updates public settings and validates input", async () => {
    const updated = await admin.req("/api/v2/admin/settings", {
      method: "PUT",
      body: { membershipFormUrl: "https://forms.gle/abc123", membershipPriceBdt: 150 },
    });
    assert.equal(updated.status, 200);

    const publicSettings = await new Client(baseUrl).req("/api/v2/settings/public");
    assert.equal(publicSettings.body.data.membershipFormUrl, "https://forms.gle/abc123");
    assert.equal(publicSettings.body.data.membershipPriceBdt, 150);

    const badUrl = await admin.req("/api/v2/admin/settings", {
      method: "PUT",
      body: { membershipFormUrl: "not-a-url" },
    });
    assert.equal(badUrl.status, 400);
    assert.ok(badUrl.body.error.fields.membershipFormUrl);

    const badPrice = await admin.req("/api/v2/admin/settings", {
      method: "PUT",
      body: { membershipPriceBdt: 0 },
    });
    assert.equal(badPrice.status, 400);
    assert.ok(badPrice.body.error.fields.membershipPriceBdt);
  });
});

describe("uploads", () => {
  dbIt("issues a signed upload and rejects SVG", async () => {
    const signed = await admin.req("/api/v2/admin/uploads/sign", {
      body: { filename: "photo.png", contentType: "image/png" },
    });
    assert.equal(signed.status, 200);
    assert.ok(signed.body.data.uploadUrl);
    assert.ok(signed.body.data.token);
    assert.ok(signed.body.data.publicUrl.includes("/uploads/"));
    assert.equal(JSON.stringify(signed.body).includes(process.env.SUPABASE_SERVICE_ROLE_KEY!), false);

    const svg = await admin.req("/api/v2/admin/uploads/sign", {
      body: { filename: "vector.svg", contentType: "image/svg+xml" },
    });
    assert.equal(svg.status, 400);
    assert.ok(svg.body.error.fields.image);

    const oversized = await admin.req("/api/v2/admin/uploads/sign", {
      body: { filename: "huge.png", contentType: "image/png", size: 6 * 1024 * 1024 },
    });
    assert.equal(oversized.status, 400);
    assert.ok(oversized.body.error.fields.image);

    const anonymous = await new Client(baseUrl).req("/api/v2/admin/uploads/sign", {
      body: { filename: "photo.png", contentType: "image/png" },
    });
    assert.equal(anonymous.status, 401);
  });
});

describe("contact", () => {
  dbIt("accepts a message, mails it, and ignores a filled honeypot", async () => {
    testOutbox.length = 0;
    const accepted = await new Client(baseUrl).req("/api/v2/contact", {
      body: { name: "Visitor", email: "visitor@example.com", message: "Hello <script>alert(1)</script>" },
    });
    assert.equal(accepted.status, 202);
    assert.equal(testOutbox.length, 1);
    assert.equal(testOutbox[0]!.subject, "Website contact message");
    assert.ok(testOutbox[0]!.html.includes("&lt;script&gt;"));
    assert.ok(!testOutbox[0]!.html.includes("<script>"));

    testOutbox.length = 0;
    const honeypot = await new Client(baseUrl).req("/api/v2/contact", {
      body: { name: "Bot", email: "bot@example.com", message: "spam", website: "http://spam.example" },
    });
    assert.equal(honeypot.status, 202);
    assert.equal(testOutbox.length, 0);

    const invalid = await new Client(baseUrl).req("/api/v2/contact", {
      body: { name: "Visitor", email: "not-an-email", message: "Hi" },
    });
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.error.fields.email);

    const tooLong = await new Client(baseUrl).req("/api/v2/contact", {
      body: { name: "Visitor", email: "visitor@example.com", message: "x".repeat(5001) },
    });
    assert.equal(tooLong.status, 400);
    assert.ok(tooLong.body.error.fields.message);
  });
});

describe("super admin", () => {
  dbIt("edits an admin name and email and records it", async () => {
    const created = await admin.req("/api/v2/super-admin/admins", {
      body: { email: "editable@example.com", name: "Editable", password: "Editable123!", role: "admin" },
    });
    assert.equal(created.status, 201);

    const edited = await admin.req(`/api/v2/super-admin/admins/${created.body.data.id}`, {
      method: "PATCH",
      body: { name: "Edited Name", email: "Edited@Example.com" },
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.data.name, "Edited Name");
    assert.equal(edited.body.data.email, "edited@example.com");
    assert.equal(edited.body.data.active, true);

    const duplicate = await admin.req(`/api/v2/super-admin/admins/${created.body.data.id}`, {
      method: "PATCH",
      body: { email: superEmail() },
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "email_taken");

    const empty = await admin.req(`/api/v2/super-admin/admins/${created.body.data.id}`, {
      method: "PATCH",
      body: {},
    });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error.code, "validation_failed");

    const withNewAddress = await loginAdmin("edited@example.com", "Editable123!");
    const me = await withNewAddress.req("/api/v2/admin/auth/me");
    assert.equal(me.status, 200);

    const oldAddress = await new Client(baseUrl).req("/api/v2/admin/auth/login", {
      body: { email: "editable@example.com", password: "Editable123!" },
    });
    assert.equal(oldAddress.status, 401);

    const audit = await admin.req("/api/v2/super-admin/audit-log?limit=20");
    const entry = audit.body.data.find(
      (row: { action: string; targetId: string }) =>
        row.action === "admin.updated" && row.targetId === created.body.data.id,
    );
    assert.ok(entry, "admin.updated audit entry missing");
    assert.deepEqual(
      [...entry.metadata.changes].sort(),
      ["email", "name"],
      "audit entry should record which fields changed",
    );
    const actor = await admin.req("/api/v2/admin/auth/me");
    assert.equal(entry.actorAdminId, actor.body.data.id);
  });

  dbIt("creates, deactivates and rotates admins with a case-insensitive unique email", async () => {
    const created = await admin.req("/api/v2/super-admin/admins", {
      body: { email: "Operator@Example.com", name: "Operator", password: "Operator123!", role: "admin" },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.passwordHash, undefined);
    assert.equal(created.body.data.email, "operator@example.com");

    const duplicate = await admin.req("/api/v2/super-admin/admins", {
      body: { email: "OPERATOR@example.com", name: "Dup", password: "Operator123!", role: "admin" },
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "email_taken");

    const operator = await loginAdmin("OPERATOR@example.com", "Operator123!");
    const forbidden = await operator.req("/api/v2/super-admin/admins");
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.body.error.code, "forbidden");
    const contentAllowed = await operator.req("/api/v2/admin/leadership");
    assert.equal(contentAllowed.status, 200);

    const self = await admin.req(`/api/v2/super-admin/admins/${(await admin.req("/api/v2/admin/auth/me")).body.data.id}`, {
      method: "PATCH",
      body: { active: false },
    });
    assert.equal(self.status, 400);
    assert.equal(self.body.error.code, "cannot_modify_self");

    const deactivated = await admin.req(`/api/v2/super-admin/admins/${created.body.data.id}`, {
      method: "PATCH",
      body: { active: false },
    });
    assert.equal(deactivated.status, 200);
    const stale = await operator.req("/api/v2/admin/auth/me");
    assert.equal(stale.status, 401);

    // A deactivated admin is refused at login even with the correct password.
    const blocked = await new Client(baseUrl).req("/api/v2/admin/auth/login", {
      body: { email: "operator@example.com", password: "Operator123!" },
    });
    assert.equal(blocked.status, 401);
    assert.equal(blocked.body.error.code, "invalid_credentials");

    const reactivated = await admin.req(`/api/v2/super-admin/admins/${created.body.data.id}`, {
      method: "PATCH",
      body: { active: true },
    });
    assert.equal(reactivated.status, 200);
    const backIn = await loginAdmin("operator@example.com", "Operator123!");

    const audits = await admin.req("/api/v2/super-admin/audit-log?limit=50");
    for (const action of ["admin.deactivated", "admin.activated"]) {
      const entry = audits.body.data.find(
        (row: { action: string; targetId: string }) =>
          row.action === action && row.targetId === created.body.data.id,
      );
      assert.ok(entry, `${action} audit entry missing`);
      assert.ok(entry.actorAdminId, `${action} audit entry missing an actor`);
    }

    const rotated = await admin.req(`/api/v2/super-admin/admins/${created.body.data.id}/rotate-password`, {
      body: { password: "Rotated123!" },
    });
    assert.equal(rotated.status, 200);
    const afterRotation = await backIn.req("/api/v2/admin/auth/me");
    assert.equal(afterRotation.status, 401);

    const withNewPassword = await loginAdmin("operator@example.com", "Rotated123!");
    const me = await withNewPassword.req("/api/v2/admin/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.data.lastLoginAt !== null, true);
  });

  dbIt("keeps at least one active super admin after deactivating another", async () => {
    const me = (await admin.req("/api/v2/admin/auth/me")).body.data;
    const other = await admin.req("/api/v2/super-admin/admins", {
      body: {
        email: "second-super@example.com",
        name: "Second Super",
        password: "SecondSuper123!",
        role: "super_admin",
      },
    });
    assert.equal(other.status, 201);
    const deactivated = await admin.req(`/api/v2/super-admin/admins/${other.body.data.id}`, {
      method: "PATCH",
      body: { active: false },
    });
    assert.equal(deactivated.status, 200);

    const remaining = (await admin.req("/api/v2/super-admin/admins")).body.data.filter(
      (row: { role: string; active: boolean }) => row.role === "super_admin" && row.active,
    );
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, me.id);

    const selfDeactivate = await admin.req(`/api/v2/super-admin/admins/${me.id}`, {
      method: "PATCH",
      body: { active: false },
    });
    assert.equal(selfDeactivate.status, 400);
    assert.equal(selfDeactivate.body.error.code, "cannot_modify_self");
    assert.match(selfDeactivate.body.error.message, /own account/i);

    // Postgres uuid equality ignores case, so the guard must too.
    const uppercaseSelf = await admin.req(
      `/api/v2/super-admin/admins/${String(me.id).toUpperCase()}`,
      { method: "PATCH", body: { active: false } },
    );
    assert.equal(uppercaseSelf.status, 400);
    assert.equal(uppercaseSelf.body.error.code, "cannot_modify_self");
  });

  dbIt("restores the env super admin after its email is renamed", async () => {
    const [seeded] = await db.select().from(admins).where(eq(admins.email, superEmail()));
    assert.ok(seeded, "seeded super admin missing");

    await db
      .update(admins)
      .set({ email: "renamed-super@example.com" })
      .where(eq(admins.id, seeded.id));
    try {
      await seedAdmins();
      const [recreated] = await db.select().from(admins).where(eq(admins.email, superEmail()));
      assert.ok(recreated, "the .env email must always be able to log in");
      assert.equal(recreated.role, "super_admin");
      assert.ok(await verifyPassword(superPassword(), recreated.passwordHash));
    } finally {
      await db.delete(admins).where(eq(admins.email, superEmail()));
      await db.update(admins).set({ email: superEmail() }).where(eq(admins.id, seeded.id));
    }
  });

  dbIt("cannot leave zero active super admins under concurrent deactivation", async () => {
    const created = await admin.req("/api/v2/super-admin/admins", {
      body: {
        email: "race-super@example.com",
        name: "Race Super",
        password: "RaceSuper123!",
        role: "super_admin",
      },
    });
    assert.equal(created.status, 201);
    const other = await loginAdmin("race-super@example.com", "RaceSuper123!");
    const me = (await admin.req("/api/v2/admin/auth/me")).body.data;

    const [mine, theirs] = await Promise.all([
      admin.req(`/api/v2/super-admin/admins/${created.body.data.id}`, {
        method: "PATCH",
        body: { active: false },
      }),
      other.req(`/api/v2/super-admin/admins/${me.id}`, {
        method: "PATCH",
        body: { active: false },
      }),
    ]);
    assert.equal(mine.status < 500 && theirs.status < 500, true);

    const activeSupers = (await db.select().from(admins)).filter(
      (row) => row.role === "super_admin" && row.active,
    );
    assert.equal(activeSupers.length, 1, "exactly one active super admin must survive");

    // Put the seeded account back so the rest of the suite keeps its session.
    await db.update(admins).set({ active: true }).where(eq(admins.id, me.id));
    admin = await loginAdmin(superEmail(), superPassword());
  });

  dbIt("returns audit entries newest first and caps the limit", async () => {
    const response = await admin.req("/api/v2/super-admin/audit-log?limit=3");
    assert.equal(response.status, 200);
    assert.ok(response.body.data.length <= 3);
    const stamps = response.body.data.map((entry: { createdAt: string }) => new Date(entry.createdAt).getTime());
    assert.deepEqual(stamps, [...stamps].sort((a, b) => b - a));
    assert.ok(response.body.data[0].actorAdminId);
  });

  dbIt("keeps the seeded super admin idempotent", async () => {
    const rows = await db.select().from(admins).where(eq(admins.email, superEmail()));
    assert.equal(rows.length, 1);
  });
});

describe("rate limiting", () => {
  dbIt("returns 429 with Retry-After and performs no login", async () => {
    delete process.env.RATE_LIMIT_DISABLED;
    try {
      const client = new Client(baseUrl);
      let last;
      for (let attempt = 0; attempt < 6; attempt++) {
        last = await client.req("/api/v2/admin/auth/login", {
          body: { email: "ratelimit@example.com", password: "wrong-password" },
        });
      }
      assert.equal(last!.status, 429);
      assert.ok(last!.headers.get("retry-after"));
      assert.equal(last!.body.error.code, "rate_limited");
    } finally {
      process.env.RATE_LIMIT_DISABLED = "1";
    }
  });
});

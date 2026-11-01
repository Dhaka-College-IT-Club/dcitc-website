import { sql } from "drizzle-orm";
import { db } from "../db/pool.js";
import { settings } from "../db/schema.js";

export type PublicSettings = {
  membershipFormUrl: string | null;
  membershipPriceBdt: number;
};

const PUBLIC_KEYS = ["membership_form_url", "membership_price_bdt"] as const;

export async function readPublicSettings(): Promise<PublicSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(sql`${settings.key} in ('membership_form_url', 'membership_price_bdt')`);
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const parsed = Number.parseInt(map.get("membership_price_bdt") ?? "", 10);
  return {
    membershipFormUrl: map.get("membership_form_url") ?? null,
    membershipPriceBdt: Number.isFinite(parsed) ? parsed : 0,
  };
}

export async function updateSettings(input: {
  membershipFormUrl?: string | null;
  membershipPriceBdt?: number;
}): Promise<PublicSettings> {
  const now = new Date();
  const writes: Array<{ key: string; value: string | null }> = [];
  if (input.membershipFormUrl !== undefined) {
    writes.push({ key: "membership_form_url", value: input.membershipFormUrl });
  }
  if (input.membershipPriceBdt !== undefined) {
    writes.push({ key: "membership_price_bdt", value: String(input.membershipPriceBdt) });
  }

  for (const entry of writes) {
    await db
      .insert(settings)
      .values({ key: entry.key, value: entry.value, updatedAt: now })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: entry.value, updatedAt: now },
      });
  }

  return readPublicSettings();
}

export { PUBLIC_KEYS };

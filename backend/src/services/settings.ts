import { sql } from "drizzle-orm";
import { db } from "../db/pool.js";
import { settings } from "../db/schema.js";

export type PublicSettings = {
  membershipFormUrl: string | null;
  membershipPriceBdt: number;
};

const PUBLIC_KEYS = ["membership_form_url", "membership_price_bdt"] as const;

/** Seeded price, and the value published when the stored one is unusable. */
export const DEFAULT_MEMBERSHIP_PRICE_BDT = 100;

type SettingsExecutor = Pick<typeof db, "insert" | "select">;

async function readWith(executor: SettingsExecutor): Promise<PublicSettings> {
  const rows = await executor
    .select()
    .from(settings)
    .where(sql`${settings.key} in ('membership_form_url', 'membership_price_bdt')`);
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const parsed = Number.parseInt(map.get("membership_price_bdt") ?? "", 10);
  return {
    membershipFormUrl: map.get("membership_form_url") ?? null,
    // Never publish zero or a corrupt value: the fallback is deterministic and
    // the stored row is left untouched.
    membershipPriceBdt:
      Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MEMBERSHIP_PRICE_BDT,
  };
}

export function readPublicSettings(): Promise<PublicSettings> {
  return readWith(db);
}

export async function updateSettings(
  input: {
    membershipFormUrl?: string | null;
    membershipPriceBdt?: number;
  },
  executor: SettingsExecutor = db,
): Promise<PublicSettings> {
  const now = new Date();
  const writes: Array<{ key: string; value: string | null }> = [];
  if (input.membershipFormUrl !== undefined) {
    writes.push({ key: "membership_form_url", value: input.membershipFormUrl });
  }
  if (input.membershipPriceBdt !== undefined) {
    writes.push({ key: "membership_price_bdt", value: String(input.membershipPriceBdt) });
  }

  for (const entry of writes) {
    await executor
      .insert(settings)
      .values({ key: entry.key, value: entry.value, updatedAt: now })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: entry.value, updatedAt: now },
      });
  }

  // Read through the same executor so an in-transaction caller sees its own write.
  return readWith(executor);
}

export { PUBLIC_KEYS };

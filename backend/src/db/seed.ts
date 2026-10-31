import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "./pool.js";
import { achievements, intels, leadership, settings } from "./schema.js";

type SeedLeader = {
  name: string;
  role: string;
  tier: "executive" | "chief" | "joint";
  batch: string;
  image: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

const link = (value?: string) => (value && value !== "#" ? value : null);

// Snapshot of frontend/src/constants.ts LEADERSHIP.MEMBERS (36 entries).
const leadershipSeed = JSON.parse(
  readFileSync(new URL("../../data/leadership.json", import.meta.url), "utf8"),
) as SeedLeader[];

// Recovered from the deleted supabase/seed.sql; `year` was text there.
const achievementSeed = [
  { title: "National Robotics Championship Finalist", detail: "Ranked in the top 6 teams nationwide with an autonomous line-following bot.", year: 2025, image: "/hero.png" },
  { title: "Inter-College Hackathon Champions", detail: "Built an AI-powered attendance and analytics system in 24 hours.", year: 2024, image: "/hero.png" },
  { title: "Cybersecurity CTF Top 10", detail: "Secured a top 10 spot in a national capture-the-flag competition.", year: 2024, image: "/hero.png" },
  { title: "Web Engineering Excellence Award", detail: "Recognized for creating the most accessible college portal for disabled students.", year: 2024, image: "/hero.png" },
  { title: "AI Innovation Summit Winners", detail: "First place for developing an NLP tool specifically for Bengali script recognition.", year: 2023, image: "/hero.png" },
  { title: "IoT Smart City Prototype", detail: "Showcased an integrated smart waste management system at the National ICT Fair.", year: 2023, image: "/hero.png" },
];

const intelSeed = [
  { slug: "getting-started-with-dcitc", title: "Getting Started with DCITC", excerpt: "How to join, what to expect, and how we operate as a tech squad.", content: "This is a demo article explaining how a new member can get started with DCITC. Replace this with real content later.", tag: "Onboarding", date: "Nov 2025", image: "/hero.png" },
  { slug: "behind-the-robotics-lab", title: "Behind the Robotics Lab", excerpt: "A peek into how we prototype bots, from CAD to code.", content: "This is a demo article about what happens inside the robotics lab. Replace with stories, photos, and logs of your projects.", tag: "Robotics", date: "Oct 2025", image: "/hero.png" },
  { slug: "defending-the-digital-frontier", title: "Defending the Digital Frontier", excerpt: "What our Cyber Security team practices to stay ahead of threats.", content: "This is a demo article describing the cybersecurity mindset of the club. Swap this text for real write-ups later.", tag: "Cyber Security", date: "Sep 2025", image: "/hero.png" },
  { slug: "ai-ethics-and-society", title: "The Future of AI Ethics", excerpt: "Exploring the balance between innovation and responsibility in the age of generative models.", content: "Artificial intelligence is moving faster than regulation. We discuss how DCITC members should approach AI projects with an ethical mindset...", tag: "Artificial Intelligence", date: "Aug 2025", image: "/hero.png" },
  { slug: "web3-beyond-the-hype", title: "Web3: More Than Just Crypto", excerpt: "Understanding the decentralized web architecture and its potential for secure applications.", content: "Blockchain technology is often synonymous with currency, but the underlying mechanisms of Web3 offer much more...", tag: "Web Development", date: "Jul 2025", image: "/hero.png" },
  { slug: "embedded-systems-101", title: "Microcontrollers and You", excerpt: "A beginners guide to Arduino, ESP32, and building your first hardware project.", content: "Starting with hardware can be daunting. In this briefing, we break down the components of a typical embedded system...", tag: "Electronics", date: "Jun 2025", image: "/hero.png" },
];

async function count(table: "leadership" | "achievements" | "intels"): Promise<number> {
  const result = await db.execute<{ count: number }>(sql`select count(*)::int as count from ${sql.identifier(table)}`);
  return result.rows[0]?.count ?? 0;
}

/**
 * Idempotent: each table is filled only when empty, and settings never overwrite
 * an admin edit. Safe to run on every dev boot and before tests.
 */
export async function seedContent(): Promise<void> {
  if ((await count("leadership")) === 0) {
    await db.insert(leadership).values(
      leadershipSeed.map((member, index) => ({
        name: member.name,
        role: member.role,
        tier: member.tier,
        batch: member.batch,
        image: member.image,
        facebook: link(member.facebook),
        linkedin: link(member.linkedin),
        github: link(member.github),
        portfolio: link(member.portfolio),
        sortOrder: index,
      })),
    );
  }

  if ((await count("achievements")) === 0) await db.insert(achievements).values(achievementSeed);
  if ((await count("intels")) === 0) await db.insert(intels).values(intelSeed);

  for (const [key, value] of [
    ["membership_form_url", null],
    ["membership_price_bdt", "100"],
  ] as const) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing();
  }
}

export async function seedReport() {
  const byBatch = await db
    .select({ batch: leadership.batch, count: sql<number>`count(*)::int` })
    .from(leadership)
    .groupBy(leadership.batch)
    .orderBy(sql`${leadership.batch} desc`);

  return {
    leadership: await count("leadership"),
    byBatch: Object.fromEntries(byBatch.map((row) => [row.batch, row.count])),
    achievements: await count("achievements"),
    intels: await count("intels"),
  };
}

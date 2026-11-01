import "./setup.js";
import assert from "node:assert/strict";
import { after, before, it } from "node:test";
import { db } from "../src/db/pool.js";
import { users } from "../src/db/schema.js";
import { testOutbox } from "../src/mail/index.js";
import { closePool, hasTestDb, prepareDatabase } from "./db.js";
import { startServer } from "./helpers.js";

// Both clients below share the same upstream egress address, like two visitors
// arriving through the Vercel rewrite. Only the forwarded browser address differs.
const SHARED_EGRESS = "198.51.100.7";
let baseUrl = "";
let close: () => Promise<void>;
const dbIt = hasTestDb ? it : it.skip;

before(async () => {
  process.env.RATE_LIMIT_DISABLED = "0";
  if (hasTestDb) await prepareDatabase();
  const started = await startServer();
  baseUrl = started.baseUrl;
  close = started.close;
});

after(async () => {
  process.env.RATE_LIMIT_DISABLED = "1";
  await close();
  if (hasTestDb) await closePool();
});

const contact = (client: string, index: number) =>
  fetch(`${baseUrl}/api/v2/contact`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${client}, ${SHARED_EGRESS}` },
    body: JSON.stringify({ name: "Visitor", email: `visitor${index}@example.com`, message: "Hello" }),
  });

const postAs = (path: string, client: string, body: unknown) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": client },
    body: JSON.stringify(body),
  });

it("keys rate limits by the browser address behind a shared egress", async () => {
  for (let index = 0; index < 5; index++) {
    const response = await contact("203.0.113.10", index);
    assert.equal(response.status, 202, `request ${index + 1} from the first visitor should be accepted`);
    await response.body?.cancel();
  }

  const blocked = await contact("203.0.113.10", 99);
  assert.equal(blocked.status, 429, "the first visitor should be throttled after five requests");
  assert.ok(blocked.headers.get("retry-after"));
  await blocked.body?.cancel();

  const other = await contact("203.0.113.11", 100);
  assert.equal(
    other.status,
    202,
    "a different visitor behind the same egress must not share the first visitor's bucket",
  );
  await other.body?.cancel();
});

// The IP ceiling is 100/hour on the OTP routes, so these tests drive it to the
// limit with distinct emails (each email has its own composite bucket) and then
// prove the next request is refused before the handler runs.
const IP_CEILING = 100;

dbIt("refuses a rotating-email client at the IP ceiling without sending mail", async () => {
  const address = "203.0.113.40";
  for (let index = 0; index < IP_CEILING; index++) {
    const response = await postAs("/api/v2/auth/password/forgot", address, {
      email: `rotating-${index}@example.com`,
    });
    // Every probe reaches the handler and is answered as an unknown address.
    assert.equal(response.status, 409, `probe ${index + 1} should not be throttled yet`);
    await response.body?.cancel();
  }

  testOutbox.length = 0;
  const blocked = await postAs("/api/v2/auth/password/forgot", address, {
    email: "rotating-over-limit@example.com",
  });
  assert.equal(blocked.status, 429, "the 101st request from one address must be throttled");
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  const blockedBody = (await blocked.json()) as { error?: { code?: string } };
  assert.equal(blockedBody.error?.code, "rate_limited");
  assert.equal(testOutbox.length, 0, "no mail may be queued after the ceiling is hit");

  const otherAddress = await postAs("/api/v2/auth/password/forgot", "203.0.113.41", {
    email: "rotating-other@example.com",
  });
  assert.notEqual(otherAddress.status, 429, "a distinct address must not share the ceiling");
  await otherAddress.body?.cancel();
});

dbIt("still limits one account across changing source addresses", async () => {
  const email = "shared-account@example.com";
  await db.insert(users).values({ email, name: "Shared Account", hscBatch: "DC-27" });

  testOutbox.length = 0;
  const first = await postAs("/api/v2/auth/password/forgot", "203.0.113.50", { email });
  assert.equal(first.status, 200);
  assert.equal(testOutbox.length, 1);

  const second = await postAs("/api/v2/auth/password/forgot", "203.0.113.51", { email });
  assert.equal(second.status, 429, "the per-email cooldown must survive an address change");
  assert.equal(testOutbox.length, 1, "the throttled request must not send another mail");
  await second.body?.cancel();

  const independent = await postAs("/api/v2/auth/password/forgot", "203.0.113.51", {
    email: "independent-account@example.com",
  });
  assert.notEqual(independent.status, 429, "another email from that address must not inherit the block");
  await independent.body?.cancel();
});

import "./setup.js";
import assert from "node:assert/strict";
import { after, before, it } from "node:test";
import { startServer } from "./helpers.js";

// Both clients below share the same upstream egress address, like two visitors
// arriving through the Vercel rewrite. Only the forwarded browser address differs.
const SHARED_EGRESS = "198.51.100.7";
let baseUrl = "";
let close: () => Promise<void>;

before(async () => {
  process.env.RATE_LIMIT_DISABLED = "0";
  const started = await startServer();
  baseUrl = started.baseUrl;
  close = started.close;
});

after(async () => {
  process.env.RATE_LIMIT_DISABLED = "1";
  await close();
});

const contact = (client: string, index: number) =>
  fetch(`${baseUrl}/api/v2/contact`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${client}, ${SHARED_EGRESS}` },
    body: JSON.stringify({ name: "Visitor", email: `visitor${index}@example.com`, message: "Hello" }),
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

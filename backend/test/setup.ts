import "dotenv/config";

process.env.NODE_ENV = "test";
// An explicitly empty value means "run without the integration database".
if (process.env.TEST_DATABASE_URL === "") delete process.env.TEST_DATABASE_URL;
// Every test file runs in its own process; point the app at the disposable database.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// Rate limiters are opt-out in tests; the limiter suite turns them back on.
process.env.RATE_LIMIT_DISABLED = "1";

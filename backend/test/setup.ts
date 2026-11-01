import "dotenv/config";

process.env.NODE_ENV = "test";
// Never inherit backend/.env's real transport: tests must not reach the mail provider.
process.env.MAIL_TRANSPORT = "log";
// The env operator account is intentionally absent here: boot seeding must only
// create the super admin unless ADMIN_EMAIL/ADMIN_PASSWORD are set.
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
// An explicitly empty value means "run without the integration database".
if (process.env.TEST_DATABASE_URL === "") delete process.env.TEST_DATABASE_URL;
// Every test file runs in its own process; point the app at the disposable database.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
// Rate limiters are opt-out in tests; the limiter suite turns them back on.
process.env.RATE_LIMIT_DISABLED = "1";

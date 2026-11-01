-- Hand-written because Drizzle Kit does not model triggers or row-level security.

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER admins_set_updated_at BEFORE UPDATE ON "admins"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER leadership_set_updated_at BEFORE UPDATE ON "leadership"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER achievements_set_updated_at BEFORE UPDATE ON "achievements"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER intels_set_updated_at BEFORE UPDATE ON "intels"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER settings_set_updated_at BEFORE UPDATE ON "settings"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The API is the only client. No policies are granted to anon/authenticated,
-- so PostgREST cannot read or write these tables even if a key leaks.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leadership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "intels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;

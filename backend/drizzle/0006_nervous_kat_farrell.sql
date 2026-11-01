DROP INDEX "otp_codes_lookup_idx";--> statement-breakpoint
CREATE INDEX "otp_codes_lookup_idx" ON "otp_codes" USING btree ("email","purpose","created_at");
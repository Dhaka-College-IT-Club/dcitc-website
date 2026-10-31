-- Backfill pre-existing rows (legacy seed data) so the required column can be added.
ALTER TABLE "intels" ADD COLUMN "author" text NOT NULL DEFAULT 'DCITC Team';
ALTER TABLE "intels" ALTER COLUMN "author" DROP DEFAULT;

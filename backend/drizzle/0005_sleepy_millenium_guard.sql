ALTER TABLE "achievements" ADD COLUMN "image_focal_x" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "image_focal_y" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "intels" ADD COLUMN "image_focal_x" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "intels" ADD COLUMN "image_focal_y" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_focal_x_check" CHECK ("achievements"."image_focal_x" between 0 and 100);--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_focal_y_check" CHECK ("achievements"."image_focal_y" between 0 and 100);--> statement-breakpoint
ALTER TABLE "intels" ADD CONSTRAINT "intels_focal_x_check" CHECK ("intels"."image_focal_x" between 0 and 100);--> statement-breakpoint
ALTER TABLE "intels" ADD CONSTRAINT "intels_focal_y_check" CHECK ("intels"."image_focal_y" between 0 and 100);
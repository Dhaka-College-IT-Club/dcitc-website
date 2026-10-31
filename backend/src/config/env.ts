import "dotenv/config";
import { z } from "zod";

const boolish = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1),
    TEST_DATABASE_URL: z.string().min(1).optional(),

    JWT_USER_SECRET: z.string().min(32, "must be at least 32 characters"),
    JWT_ADMIN_SECRET: z.string().min(32, "must be at least 32 characters"),
    OTP_PEPPER: z.string().min(16, "must be at least 16 characters"),

    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
    GOOGLE_REDIRECT_URI: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    MAIL_TRANSPORT: z.enum(["smtp", "log"]).default("smtp"),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().min(1).optional(),
    SMTP_SECURE: boolish.optional(),

    CONTACT_TO: z.string().email(),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    UPLOAD_BUCKET: z.string().min(1).default("uploads"),

    SUPER_ADMIN_EMAIL: z.string().email(),
    SUPER_ADMIN_PASSWORD: z.string().min(8),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),

    RUN_MIGRATIONS: z
      .enum(["true", "false", "1", "0"])
      .default("false")
      .transform((v) => v === "true" || v === "1"),
  })
  .superRefine((value, ctx) => {
    if (value.MAIL_TRANSPORT === "smtp") {
      for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM"] as const) {
        if (!value[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: "required when MAIL_TRANSPORT=smtp" });
        }
      }
    }
    if (value.JWT_USER_SECRET === value.JWT_ADMIN_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_ADMIN_SECRET"],
        message: "must differ from JWT_USER_SECRET",
      });
    }
    if (value.NODE_ENV === "production") {
      if (value.MAIL_TRANSPORT === "log") {
        ctx.addIssue({
          code: "custom",
          path: ["MAIL_TRANSPORT"],
          message: "log transport is not allowed in production",
        });
      }
      const placeholders = /your-value-here|changeme|dummy|placeholder|example\.com/i;
      for (const key of ["JWT_USER_SECRET", "JWT_ADMIN_SECRET", "OTP_PEPPER"] as const) {
        if (placeholders.test(value[key])) {
          ctx.addIssue({ code: "custom", path: [key], message: "placeholder value refused in production" });
        }
      }
    }
    if (Boolean(value.ADMIN_EMAIL) !== Boolean(value.ADMIN_PASSWORD)) {
      ctx.addIssue({
        code: "custom",
        path: ["ADMIN_EMAIL"],
        message: "ADMIN_EMAIL and ADMIN_PASSWORD must be set together",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function load(): Env {
  // Empty values are treated as "not set" so the example file can leave optional
  // entries blank; required entries then fail with a clear variable name.
  const source = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => typeof value === "string" && value !== ""),
  );
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".") || "(root)");
    // Only variable names are printed — never values.
    console.error(`Invalid environment configuration: ${[...new Set(names)].join(", ")}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = load();

export const isProduction = env.NODE_ENV === "production";
export const googleRedirectUri =
  env.GOOGLE_REDIRECT_URI ?? `${env.FRONTEND_URL.replace(/\/$/, "")}/api/v1/auth/google/callback`;

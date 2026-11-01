import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { AppError, validationFailed } from "../lib/errors.js";

const CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  // Some browsers report .jpg files as image/jpg.
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type SignedUpload = {
  uploadUrl: string;
  token: string;
  path: string;
  publicUrl: string;
};

/** Test/dev adapter: no network, no credentials, still an unguessable path. */
function fakeUpload(path: string): SignedUpload {
  const base = storageBase();
  return {
    uploadUrl: `${base}/storage/v1/object/upload/${path}?token=fake`,
    token: "fake",
    path,
    publicUrl: `${base}/storage/v1/object/public/${env.UPLOAD_BUCKET}/${path}`,
  };
}

/**
 * The SDK appends `/storage/v1/...` itself, so a URL pasted with the REST path
 * (`https://<ref>.supabase.co/rest/v1/`) must be reduced to its origin first.
 */
function storageBase(): string {
  return new URL(env.SUPABASE_URL).origin;
}

let client: ReturnType<typeof createClient> | null = null;

function supabase() {
  client ??= createClient(storageBase(), env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function signUpload(
  filename: string,
  contentType: string,
  size?: number,
): Promise<SignedUpload> {
  const extension = CONTENT_TYPES[contentType.toLowerCase()];
  if (!extension) {
    throw validationFailed({
      image: "Use a JPEG, PNG, or WebP image.",
    });
  }
  if (size !== undefined && size > MAX_UPLOAD_BYTES) {
    throw validationFailed({ image: "That image is over 5 MB. Compress it and try again." });
  }

  const base = filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const path = `${new Date().getFullYear()}/${randomUUID()}-${base || "image"}.${extension}`;

  if (env.NODE_ENV === "test") return fakeUpload(path);

  const storage = supabase().storage.from(env.UPLOAD_BUCKET);
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error || !data) {
    console.error(JSON.stringify({ level: "error", message: "upload_sign_failed", detail: error?.message }));
    throw new AppError(502, "delivery_failed", "Uploads are unavailable right now.");
  }

  const { data: pub } = storage.getPublicUrl(path);
  return { uploadUrl: data.signedUrl, token: data.token, path, publicUrl: pub.publicUrl };
}

export async function ensureBucket(): Promise<void> {
  const storage = supabase().storage;
  // The bucket, not the signing endpoint, is the last line of defence: it also
  // rejects non-image uploads and oversized files if a signed URL leaks.
  const { error } = await storage.createBucket(env.UPLOAD_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: Object.keys(CONTENT_TYPES),
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(JSON.stringify({ level: "info", message: "storage_bucket_ready", bucket: env.UPLOAD_BUCKET }));
}

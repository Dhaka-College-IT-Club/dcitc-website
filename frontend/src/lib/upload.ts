import { apiFetch, type ApiError } from "./api";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is over 5 MB. Compress it and try again.");
  }

  let sign: { uploadUrl: string; publicUrl: string };
  try {
    sign = await apiFetch<{ uploadUrl: string; publicUrl: string }>(
      "/admin/uploads/sign",
      {
        method: "POST",
        body: { filename: file.name, contentType: file.type, size: file.size },
      },
    );
  } catch (error) {
    const apiError = error as ApiError;
    const fieldMessage = apiError?.fields ? Object.values(apiError.fields)[0] : null;
    throw new Error(fieldMessage || apiError?.message || "Could not start the upload.");
  }

  const res = await fetch(sign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}). Try a smaller image.`);
  }
  return sign.publicUrl;
}

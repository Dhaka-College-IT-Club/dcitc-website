import { apiFetch } from "./api";

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");
  const sign = await apiFetch<{ uploadUrl: string; publicUrl: string }>("/admin/uploads/sign", {
    method: "POST",
    body: { filename: file.name, contentType: file.type },
  });
  const res = await fetch(sign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error("Upload failed");
  return sign.publicUrl;
}
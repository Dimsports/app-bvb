import {
  MAX_PHOTO_DIMENSION,
  PHOTO_JPEG_QUALITY,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_SIZE_BYTES,
} from "./constants";

export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY)
  );
  return blob ?? file;
}

export async function validateVideo(
  file: File
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return { ok: false, error: `Vidéo trop lourde (max ${MAX_VIDEO_SIZE_BYTES / 1024 / 1024} Mo).` };
  }

  const duration = await new Promise<number>((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });

  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    return { ok: false, error: `Vidéo trop longue (max ${MAX_VIDEO_DURATION_SECONDS}s).` };
  }

  return { ok: true };
}

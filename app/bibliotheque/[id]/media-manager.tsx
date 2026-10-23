"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { detectPlatform, getEmbedUrl, isEmbeddable, PLATFORM_LABELS, type Platform } from "@/lib/exercises/media";
import { compressPhoto, validateVideo } from "@/lib/exercises/client-media";
import { setExternalLink, uploadMedia, removeMedia } from "../actions";

export function MediaManager({
  exerciseId,
  canEdit,
  mediaType,
  mediaUrl,
  mediaPlatform,
}: {
  exerciseId: string;
  canEdit: boolean;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaPlatform: string | null;
}) {
  const router = useRouter();
  const [linkInput, setLinkInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSetLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await setExternalLink(exerciseId, linkInput);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLinkInput("");
      router.refresh();
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    const isPhoto = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isPhoto && !isVideo) {
      setError("Formats acceptés : photo ou vidéo.");
      return;
    }

    startTransition(async () => {
      let blob: Blob = file;
      if (isPhoto) {
        blob = await compressPhoto(file);
      } else {
        const valid = await validateVideo(file);
        if (!valid.ok) {
          setError(valid.error);
          return;
        }
      }

      const formData = new FormData();
      formData.append("file", blob, file.name);
      formData.append("kind", isPhoto ? "photo" : "video");

      const result = await uploadMedia(exerciseId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeMedia(exerciseId);
      router.refresh();
    });
  }

  const platform = mediaType === "lien" ? ((mediaPlatform as Platform | null) ?? detectPlatform(mediaUrl ?? "")) : null;

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="font-title text-xl text-anthracite">Média</h2>

      <div className="mt-4">
        {mediaType === "photo" && mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" className="w-full rounded-xl object-cover" />
        )}
        {mediaType === "video" && mediaUrl && (
          <video src={mediaUrl} controls className="w-full rounded-xl" />
        )}
        {mediaType === "lien" && mediaUrl && platform && isEmbeddable(platform) && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-anthracite">
            {getEmbedUrl(mediaUrl, platform) ? (
              <iframe
                src={getEmbedUrl(mediaUrl, platform)!}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a href={mediaUrl} target="_blank" rel="noreferrer" className="flex h-full items-center justify-center text-white">
                Ouvrir le lien
              </a>
            )}
          </div>
        )}
        {mediaType === "lien" && mediaUrl && (!platform || !isEmbeddable(platform)) && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 items-center justify-center rounded-xl border border-anthracite/20 font-medium text-anthracite"
          >
            Ouvrir dans {platform ? PLATFORM_LABELS[platform] : "l'app"}
          </a>
        )}
        {!mediaType && <p className="text-sm text-anthracite/50">Aucun média pour l&apos;instant.</p>}
      </div>

      {canEdit && (
        <div className="mt-4 flex flex-col gap-3">
          <form onSubmit={handleSetLink} className="flex gap-2">
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Lien YouTube, Instagram, TikTok…"
              className="h-11 flex-1 rounded-lg border border-anthracite/20 px-3 text-sm"
            />
            <button
              type="submit"
              disabled={isPending || !linkInput}
              className="h-11 rounded-lg bg-anthracite px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              Valider
            </button>
          </form>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
            >
              Importer une photo/vidéo
            </button>
            {mediaType && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleRemove}
                className="text-sm font-medium text-red-700"
              >
                Retirer le média
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFile}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {isPending && <p className="text-sm text-anthracite/60">Envoi en cours…</p>}
        </div>
      )}
    </section>
  );
}

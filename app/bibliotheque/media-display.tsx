import { detectPlatform, getEmbedUrl, isEmbeddable, PLATFORM_LABELS, type Platform } from "@/lib/exercises/media";

export function MediaDisplay({
  mediaType,
  mediaUrl,
  mediaPlatform,
  dark = false,
}: {
  mediaType: string | null;
  mediaUrl: string | null;
  mediaPlatform: string | null;
  dark?: boolean;
}) {
  const platform = mediaType === "lien" ? ((mediaPlatform as Platform | null) ?? detectPlatform(mediaUrl ?? "")) : null;

  if (mediaType === "photo" && mediaUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl} alt="" className="w-full rounded-xl object-cover" />;
  }

  if (mediaType === "video" && mediaUrl) {
    return <video src={mediaUrl} controls className="w-full rounded-xl" />;
  }

  if (mediaType === "lien" && mediaUrl && platform && isEmbeddable(platform)) {
    const embedUrl = getEmbedUrl(mediaUrl, platform);
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-anthracite">
        {embedUrl ? (
          <iframe
            src={embedUrl}
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
    );
  }

  if (mediaType === "lien" && mediaUrl) {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noreferrer"
        className={`flex h-14 items-center justify-center rounded-xl border font-medium ${
          dark ? "border-border-dark text-white" : "border-anthracite/20 text-anthracite"
        }`}
      >
        Ouvrir dans {platform ? PLATFORM_LABELS[platform] : "l'app"}
      </a>
    );
  }

  return (
    <p className={`text-sm ${dark ? "text-muted-dark" : "text-anthracite/50"}`}>
      Aucun média pour l&apos;instant.
    </p>
  );
}

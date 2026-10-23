export const PLATFORMS = ["youtube", "vimeo", "instagram", "tiktok", "facebook", "x"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  x: "X",
};

// Plateformes qui acceptent un lecteur intégré (iframe) ; les autres
// s'ouvrent dans l'app/le navigateur.
const EMBEDDABLE: Platform[] = ["youtube", "vimeo"];

export function detectPlatform(url: string): Platform | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") return "youtube";
  if (host === "vimeo.com") return "vimeo";
  if (host === "instagram.com") return "instagram";
  if (host === "tiktok.com") return "tiktok";
  if (host === "facebook.com" || host === "fb.watch") return "facebook";
  if (host === "x.com" || host === "twitter.com") return "x";
  return null;
}

export function isEmbeddable(platform: Platform | null): boolean {
  return platform !== null && EMBEDDABLE.includes(platform);
}

export function getEmbedUrl(url: string, platform: Platform): string | null {
  try {
    const u = new URL(url);
    if (platform === "youtube") {
      let id: string | null = null;
      if (u.hostname.includes("youtu.be")) {
        id = u.pathname.slice(1);
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2] ?? null;
      } else {
        id = u.searchParams.get("v");
      }
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (platform === "vimeo") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

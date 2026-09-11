/**
 * Resolve media/upload URLs for the public site.
 * - Firebase / absolute HTTPS URLs → use as-is (durable cloud files)
 * - Relative /uploads/... → same-origin (Next.js rewrite) for local disk files
 */
export function resolveUploadUrl(url: string): string {
  if (!url) return "";
  let value = String(url).trim();
  if (!value) return "";

  if (/^http:\/\//i.test(value)) {
    value = `https://${value.slice(7)}`;
  }

  // Durable cloud / CDN URLs
  if (
    /^https:\/\//i.test(value) &&
    (value.includes("storage.googleapis.com") ||
      value.includes("firebasestorage.googleapis.com") ||
      value.includes("cloudinary.com") ||
      value.includes("amazonaws.com"))
  ) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/uploads/")) {
        // Prefer same-origin proxy so frontend doesn't depend on backend host CORS/tmp
        return parsed.pathname;
      }
      parsed.protocol = "https:";
      return parsed.toString();
    } catch {
      return value;
    }
  }

  if (!value.startsWith("/")) {
    value = `/${value}`;
  }

  return value;
}

/** Start downloading an image ASAP (before React paints the <img>). */
export function preloadUploadImage(url: string) {
  if (!url || typeof window === "undefined") return;
  const href = resolveUploadUrl(url);
  if (!href) return;

  const existing = document.head.querySelector(
    `link[rel="preload"][as="image"][href="${href.replace(/"/g, "")}"]`
  );
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    document.head.appendChild(link);
  }

  const img = new Image();
  img.decoding = "async";
  img.src = href;
}

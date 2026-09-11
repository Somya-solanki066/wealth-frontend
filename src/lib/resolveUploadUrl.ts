import { getBackendOrigin } from "@/lib/backendUrl";

/** Absolute HTTPS URL for /uploads assets (avoids slow Next rewrite + mixed content). */
export function resolveUploadUrl(url: string): string {
  if (!url) return "";
  let value = String(url).trim();
  if (!value) return "";

  if (/^http:\/\//i.test(value)) {
    value = `https://${value.slice(7)}`;
  }

  let pathname = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/uploads/")) {
        pathname = parsed.pathname;
      } else {
        parsed.protocol = "https:";
        return parsed.toString();
      }
    } catch {
      return value;
    }
  } else if (!value.startsWith("/")) {
    pathname = `/${value}`;
  }

  if (!pathname.startsWith("/uploads/")) {
    return pathname.startsWith("/") ? pathname : value;
  }

  let origin = getBackendOrigin();
  if (/^http:\/\//i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin)) {
    origin = origin.replace(/^http:\/\//i, "https://");
  }
  return `${origin}${pathname}`;
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

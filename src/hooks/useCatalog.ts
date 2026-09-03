import { useEffect, useState } from "react";
import { getBackendApiUrl } from "@/lib/backendUrl";

export type CatalogItem = { id: string; name: string };

const FALLBACK_PLATFORMS: CatalogItem[] = [
  "PocketFM",
  "Dreame",
  "GoodNovel",
  "WebNovel",
  "MegaNovel",
  "AlphaNovel",
  "Letterlux",
  "Stary",
  "NovelSnack",
].map((name) => ({ id: name, name }));

const FALLBACK_GENRES: CatalogItem[] = [
  "Romance",
  "Werewolf",
  "Vampire",
  "Billionaire",
  "Urban Fiction",
  "Fantasy",
  "Urban",
  "Thriller",
  "Sci-Fi",
  "Adventure",
].map((name) => ({ id: name, name }));

function mapItems(raw: any[], fallback: CatalogItem[]): CatalogItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  const items = raw
    .map((item) => {
      const name = String(item?.name || item?.id || "").trim();
      const id = String(item?.id || name).trim();
      if (!id || !name) return null;
      return { id, name };
    })
    .filter(Boolean) as CatalogItem[];
  return items.length ? items : fallback;
}

export function useCatalog() {
  const [platforms, setPlatforms] = useState<CatalogItem[]>(FALLBACK_PLATFORMS);
  const [genres, setGenres] = useState<CatalogItem[]>(FALLBACK_GENRES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${getBackendApiUrl()}/catalog`);
        const json = await response.json();
        const data = json.data || json;
        if (cancelled) return;
        setPlatforms(mapItems(data.platforms, FALLBACK_PLATFORMS));
        setGenres(mapItems(data.genres, FALLBACK_GENRES));
      } catch (error) {
        console.error("Failed to load catalog:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { platforms, genres, loading };
}

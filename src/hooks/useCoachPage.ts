"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import {
  DEFAULT_COACH_PAGE,
  mergeCoachPage,
  type CoachPageContent,
} from "@/lib/coachPageDefaults";

export function useCoachPage() {
  const [page, setPage] = useState<CoachPageContent>(DEFAULT_COACH_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${getBackendApiUrl()}/coach-page`);
        if (cancelled) return;
        setPage(mergeCoachPage(response.data?.data));
      } catch (err: unknown) {
        console.error("Failed to load coach page:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load coach page"));
          setPage(DEFAULT_COACH_PAGE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { page, loading, error };
}

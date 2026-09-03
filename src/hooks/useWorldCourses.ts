"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import {
  DEFAULT_WORLD_COURSES,
  mergeWorldCoursesPage,
  type WorldCourseId,
  type WorldCoursesPage,
  type WorldFlagshipCourse,
} from "@/lib/worldCoursesDefaults";

export function useWorldCourses(worldId?: WorldCourseId) {
  const [pages, setPages] =
    useState<Record<WorldCourseId, WorldCoursesPage>>(DEFAULT_WORLD_COURSES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPages = async () => {
      try {
        setLoading(true);
        if (worldId) {
          const response = await axios.get(
            `${getBackendApiUrl()}/world-courses/${worldId}`
          );
          if (cancelled) return;
          setPages((prev) => ({
            ...prev,
            [worldId]: mergeWorldCoursesPage(worldId, response.data?.data),
          }));
        } else {
          const response = await axios.get(`${getBackendApiUrl()}/world-courses`);
          const data = response.data?.data || {};
          if (cancelled) return;
          setPages({
            writer: mergeWorldCoursesPage("writer", data.writer),
            screenwriter: mergeWorldCoursesPage("screenwriter", data.screenwriter),
            student: mergeWorldCoursesPage("student", data.student),
          });
        }
      } catch (err: unknown) {
        console.error("Failed to load world courses:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load world courses"));
          setPages(DEFAULT_WORLD_COURSES);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPages();
    return () => {
      cancelled = true;
    };
  }, [worldId]);

  const page = worldId ? pages[worldId] : null;
  const courses: WorldFlagshipCourse[] = page?.courses || [];

  return { pages, page, courses, loading, error };
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { preloadUploadImage } from "@/lib/resolveUploadUrl";
import {
  DEFAULT_WORLD_COURSES,
  mergeWorldCoursesPage,
  type WorldCourseId,
  type WorldCoursesPage,
  type WorldFlagshipCourse,
} from "@/lib/worldCoursesDefaults";

const CACHE_KEY = "ink2wealth_world_courses_v2";

function readCache(): Record<WorldCourseId, WorldCoursesPage> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      writer: mergeWorldCoursesPage("writer", data.writer),
      screenwriter: mergeWorldCoursesPage("screenwriter", data.screenwriter),
      student: mergeWorldCoursesPage("student", data.student),
    };
  } catch {
    return null;
  }
}

function writeCache(pages: Record<WorldCourseId, WorldCoursesPage>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(pages));
  } catch {
    /* ignore */
  }
}

function preloadPageAssets(page: WorldCoursesPage) {
  for (const course of page.courses || []) {
    preloadUploadImage(course.myStudentBannerImageUrl);
    preloadUploadImage(course.bannerImageUrl);
    preloadUploadImage(course.coachPhotoUrl);
  }
}

export function useWorldCourses(worldId?: WorldCourseId) {
  const [pages, setPages] =
    useState<Record<WorldCourseId, WorldCoursesPage>>(DEFAULT_WORLD_COURSES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    if (cached) {
      setPages(cached);
      if (worldId) preloadPageAssets(cached[worldId]);
      else {
        preloadPageAssets(cached.writer);
        preloadPageAssets(cached.screenwriter);
        preloadPageAssets(cached.student);
      }
    }

    const fetchPages = async () => {
      try {
        if (worldId) {
          const response = await axios.get(
            `${getBackendApiUrl()}/world-courses/${worldId}`
          );
          if (cancelled) return;
          const merged = mergeWorldCoursesPage(worldId, response.data?.data);
          preloadPageAssets(merged);
          setPages((prev) => {
            const next = { ...prev, [worldId]: merged };
            writeCache(next);
            return next;
          });
        } else {
          const response = await axios.get(`${getBackendApiUrl()}/world-courses`);
          const data = response.data?.data || {};
          if (cancelled) return;
          const next = {
            writer: mergeWorldCoursesPage("writer", data.writer),
            screenwriter: mergeWorldCoursesPage("screenwriter", data.screenwriter),
            student: mergeWorldCoursesPage("student", data.student),
          };
          preloadPageAssets(next.writer);
          preloadPageAssets(next.screenwriter);
          preloadPageAssets(next.student);
          setPages(next);
          writeCache(next);
        }
      } catch (err: unknown) {
        console.error("Failed to load world courses:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load world courses"));
          if (!cached) setPages(DEFAULT_WORLD_COURSES);
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

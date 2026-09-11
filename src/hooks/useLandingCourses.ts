"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { preloadUploadImage } from "@/lib/resolveUploadUrl";
import {
  DEFAULT_LANDING_COURSES,
  mergeLandingCourse,
  type LandingCourse,
  type LandingCourseId,
} from "@/lib/landingCoursesDefaults";

const CACHE_KEY = "ink2wealth_landing_courses_v2";

function readCache(): Record<LandingCourseId, LandingCourse> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      witweb: mergeLandingCourse("witweb", data.witweb),
      ssg: mergeLandingCourse("ssg", data.ssg),
    };
  } catch {
    return null;
  }
}

function writeCache(courses: Record<LandingCourseId, LandingCourse>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(courses));
  } catch {
    /* ignore quota */
  }
}

function preloadCourseAssets(course: LandingCourse) {
  preloadUploadImage(course.myStudentBannerImageUrl);
  preloadUploadImage(course.bannerImageUrl);
  preloadUploadImage(course.coachPhotoUrl);
}

export function useLandingCourses() {
  const [courses, setCourses] = useState<Record<LandingCourseId, LandingCourse>>(
    DEFAULT_LANDING_COURSES
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Restore cache right after mount (before/while network) so banner paints with other CMS content
    const cached = readCache();
    if (cached) {
      setCourses(cached);
      preloadCourseAssets(cached.witweb);
      preloadCourseAssets(cached.ssg);
    }

    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${getBackendApiUrl()}/landing-courses`);
        const data = response.data?.data || {};
        if (cancelled) return;
        const next = {
          witweb: mergeLandingCourse("witweb", data.witweb),
          ssg: mergeLandingCourse("ssg", data.ssg),
        };
        // Preload banners before paint update so images feel instant
        preloadCourseAssets(next.witweb);
        preloadCourseAssets(next.ssg);
        setCourses(next);
        writeCache(next);
      } catch (err: unknown) {
        console.error("Failed to load landing courses:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load landing courses"));
          if (!cached) setCourses(DEFAULT_LANDING_COURSES);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, loading, error };
}

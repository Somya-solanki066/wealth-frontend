"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import {
  DEFAULT_LANDING_COURSES,
  mergeLandingCourse,
  type LandingCourse,
  type LandingCourseId,
} from "@/lib/landingCoursesDefaults";

export function useLandingCourses() {
  const [courses, setCourses] = useState<Record<LandingCourseId, LandingCourse>>(
    DEFAULT_LANDING_COURSES
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${getBackendApiUrl()}/landing-courses`);
        const data = response.data?.data || {};
        if (cancelled) return;
        setCourses({
          witweb: mergeLandingCourse("witweb", data.witweb),
          ssg: mergeLandingCourse("ssg", data.ssg),
        });
      } catch (err: unknown) {
        console.error("Failed to load landing courses:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load landing courses"));
          setCourses(DEFAULT_LANDING_COURSES);
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

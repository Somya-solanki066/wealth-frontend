"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

export type CourseProductId = "witweb" | "ssg" | "witweb-bundle";

export function useCourseCheckout() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = useCallback(
    async (courseId: CourseProductId) => {
      if (!user) {
        const returnPath = pathname || "/courses";
        router.push(`/login?redirectTo=${encodeURIComponent(returnPath)}`);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await api.post("/courses/checkout", {
          courseId,
          cancelPath: pathname || "/courses",
        });
        if (res.data?.url) {
          window.location.href = res.data.url;
          return;
        }
        setError("Could not start checkout. Please try again.");
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Checkout failed. Please try again.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, router, pathname]
  );

  return { startCheckout, loading, error, clearError: () => setError("") };
}

export function resolveCourseProductId(input: {
  id?: string;
  title?: string;
  kicker?: string;
  courseName?: string;
  primaryCtaHref?: string;
}): CourseProductId | null {
  const id = (input.id || "").toLowerCase();
  if (id === "witweb" || id === "ssg" || id === "witweb-bundle") {
    return id as CourseProductId;
  }

  const blob = `${input.title || ""} ${input.kicker || ""} ${input.courseName || ""} ${input.primaryCtaHref || ""}`.toLowerCase();
  if (blob.includes("bundle") && (blob.includes("wit") || blob.includes("app"))) {
    return "witweb-bundle";
  }
  if (blob.includes("ssg") || blob.includes("screenwriting") || blob.includes("ssg-landing")) {
    return "ssg";
  }
  if (blob.includes("wit-web") || blob.includes("witweb") || blob.includes("webnovel")) {
    return "witweb";
  }
  return null;
}

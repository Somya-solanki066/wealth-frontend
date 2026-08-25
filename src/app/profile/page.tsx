"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard which now houses the profile settings
    router.push("/dashboard");
  }, [router]);

  return null;
}

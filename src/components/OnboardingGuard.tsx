"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import PlanSelectionOnboarding from "./ui/PlanSelectionOnboarding";
import { usePathname } from "next/navigation";
import Loader from "./ui/Loader";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  // Only check for logged in users
  if (loading || !user || !profile) {
    return <>{children}</>;
  }

  // If the user has a subscription plan, they are good to go
  if (profile.subscriptionPlan) {
    return <>{children}</>;
  }

  // If user is authenticated but has NO subscription plan, show onboarding.
  // We should allow them to see the landing page maybe? 
  // Requirement: "jab bhi login ya register kare to usko sabse pehle first page aisa ek new modal milna chahiye"
  // So we intercept everything if logged in.
  return (
    <>
      <PlanSelectionOnboarding />
      {/* We can hide the actual page content underneath or leave it behind the fixed overlay */}
      <div className="hidden" aria-hidden="true">
        {children}
      </div>
    </>
  );
}

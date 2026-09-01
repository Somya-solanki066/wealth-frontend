"use client";

import React, { Suspense } from "react";
import WorldsHome from "@/components/home/WorldsHome";

function HomeFallback() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[var(--gd)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <WorldsHome />
    </Suspense>
  );
}

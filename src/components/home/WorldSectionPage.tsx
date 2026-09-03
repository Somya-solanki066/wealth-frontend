"use client";

import React, { useEffect } from "react";
import { useWorld } from "@/context/WorldContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FlagshipCoursesList } from "@/components/home/FlagshipCourseSections";
import {
  WorldFeaturesBlock,
  WorldPricingBlock,
} from "@/components/home/WorldMarketingSections";
import { useWorldCourses } from "@/hooks/useWorldCourses";
import type { ActiveWorld } from "@/lib/worldContent";
import "@/app/home-worlds.css";

type Section = "features" | "pricing" | "courses";

function WorldCoursesPageContent({ world }: { world: ActiveWorld }) {
  const { courses } = useWorldCourses(world);
  return <FlagshipCoursesList courses={courses} />;
}

export default function WorldSectionPage({
  world,
  section,
}: {
  world: ActiveWorld;
  section: Section;
}) {
  const { setWorld } = useWorld();

  useEffect(() => {
    setWorld(world);
  }, [world, setWorld]);

  return (
    <div className="worlds-home">
      <Navbar />
      <div className="world-page">
        <div className="wp-inner">
          {section === "features" && (
            <WorldFeaturesBlock world={world} bordered={false} />
          )}
          {section === "pricing" && (
            <WorldPricingBlock
              world={world}
              bordered={false}
              cancelPath={`/${world}/pricing`}
            />
          )}
          {section === "courses" && <WorldCoursesPageContent world={world} />}
        </div>
      </div>
      <Footer />
    </div>
  );
}

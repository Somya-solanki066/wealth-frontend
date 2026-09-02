"use client";

import React, { useEffect } from "react";
import { useWorld } from "@/context/WorldContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FlagshipCourseStack } from "@/components/home/FlagshipCourseSections";
import {
  WorldFeaturesBlock,
  WorldPricingBlock,
} from "@/components/home/WorldMarketingSections";
import type { ActiveWorld } from "@/lib/worldContent";
import "@/app/home-worlds.css";

type Section = "features" | "pricing" | "courses";

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
          {section === "courses" && world === "writer" && (
            <FlagshipCourseStack variant="both" />
          )}
          {section === "courses" && world === "screenwriter" && (
            <FlagshipCourseStack variant="both" />
          )}
          {section === "courses" && world === "student" && (
            <FlagshipCourseStack variant="both" />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

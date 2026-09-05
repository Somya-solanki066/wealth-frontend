export type CourseCatalogId = "witweb" | "ssg" | "witweb-bundle";

export type CourseCatalogEntry = {
  id: CourseCatalogId;
  emoji: string;
  bannerGradient: string;
  shortName: string;
  subtitle: string;
  description: string;
  landingPath: string;
  modulesLabel: string;
  tags: string[];
};

export const COURSE_CATALOG: Record<CourseCatalogId, CourseCatalogEntry> = {
  witweb: {
    id: "witweb",
    emoji: "📖",
    bannerGradient: "linear-gradient(135deg,#1a1200,#2e2000)",
    shortName: "WIT-WEB Academy",
    subtitle: "Webnoveling Ink to Wealth Blueprint",
    description:
      "Write, publish, and earn from serialized fiction on PocketFM, Dreame, GoodNovel, and 6 more platforms.",
    landingPath: "/witweb-landing",
    modulesLabel: "12 modules · 48 lessons",
    tags: ["9 Platforms", "Lifetime Access", "Certificate"],
  },
  ssg: {
    id: "ssg",
    emoji: "🎬",
    bannerGradient: "linear-gradient(135deg,#1a0006,#2e0010)",
    shortName: "SSG Blueprint",
    subtitle: "Scriptwriting and Screenwriting Guide",
    description:
      "Master screenplay and script writing for feature films, TV series, and audio drama.",
    landingPath: "/ssg-landing",
    modulesLabel: "10 modules · 40+ lessons",
    tags: ["Film + TV + Audio", "Lifetime Access", "Certificate"],
  },
  "witweb-bundle": {
    id: "witweb-bundle",
    emoji: "⭐",
    bannerGradient: "linear-gradient(135deg,#1a1200,#0f0f0f)",
    shortName: "WIT-WEB + App Bundle",
    subtitle: "Course + 1 Year Premium App",
    description:
      "WIT-WEB Academy lifetime access plus 1 year of Ink2Wealth Premium app tools.",
    landingPath: "/witweb-landing",
    modulesLabel: "12 modules + Premium app",
    tags: ["Best Value", "1 Year App", "Priority Support"],
  },
};

export function getCourseCatalogEntry(courseId: string): CourseCatalogEntry | null {
  if (courseId in COURSE_CATALOG) {
    return COURSE_CATALOG[courseId as CourseCatalogId];
  }
  return null;
}

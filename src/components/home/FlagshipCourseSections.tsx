"use client";

import React from "react";
import Link from "next/link";
import { useLandingCourses } from "@/hooks/useLandingCourses";
import CourseEnrollButton from "@/components/CourseEnrollButton";
import { resolveCourseProductId } from "@/hooks/useCourseCheckout";
import {
  type LandingCourse,
  type LandingCourseId,
} from "@/lib/landingCoursesDefaults";
import type { WorldFlagshipCourse } from "@/lib/worldCoursesDefaults";

type CourseVariant = LandingCourseId;
type CourseContent = LandingCourse | WorldFlagshipCourse;

function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    // keep as-is
  }
  return url;
}

function AlsoFromDivider({ subtitle }: { subtitle: string }) {
  return (
    <div className="also-from-divider">
      <div className="also-from-line" />
      <div className="also-from-center">
        <div className="also-from-kicker">Also from Ink2Wealth</div>
        <div className="also-from-title">Learn Directly from Coach Victor</div>
        <div className="also-from-sub">{subtitle}</div>
      </div>
      <div className="also-from-line also-from-line-right" />
    </div>
  );
}

function FlagshipCourseBlock({ course }: { course: CourseContent }) {
  const tags = course.tags || [];
  const learnPoints = course.learnPoints || [];
  const checkoutId = resolveCourseProductId(course);

  return (
    <section className="flagship-course-section">
      <span className="sec-label">{course.sectionLabel}</span>
      <h2 className="sec-h2">{course.title}</h2>
      <div className="flagship-course-grid">
        <div className="flagship-course-card">
          <div
            className="flagship-course-banner"
            style={{ background: course.bannerGradient }}
          >
            {course.bannerEmoji}
          </div>
          <div className="flagship-course-body">
            <div className="flagship-course-kicker">{course.kicker}</div>
            <div className="flagship-course-name">{course.courseName}</div>
            <div className="flagship-course-desc">{course.description}</div>
            <div className="flagship-course-tags">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className={`flagship-tag${
                    /lifetime/i.test(tag) ? " flagship-tag-green" : ""
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            {checkoutId ? (
              <CourseEnrollButton
                courseId={checkoutId}
                className="btn-world-primary flagship-enroll-btn"
              >
                {course.primaryCtaLabel}
              </CourseEnrollButton>
            ) : (
              <Link
                href={course.primaryCtaHref || "/courses"}
                className="btn-world-primary flagship-enroll-btn"
              >
                {course.primaryCtaLabel}
              </Link>
            )}
            {checkoutId === "witweb" &&
            /bundle|₦55|55000/i.test(course.secondaryCtaLabel || "") ? (
              <CourseEnrollButton
                courseId="witweb-bundle"
                className="btn-world-secondary flagship-enroll-btn"
              >
                {course.secondaryCtaLabel}
              </CourseEnrollButton>
            ) : (
              <Link
                href={
                  checkoutId === "witweb"
                    ? "/witweb-landing"
                    : checkoutId === "ssg"
                      ? "/ssg-landing"
                      : course.secondaryCtaHref || "/courses"
                }
                className="btn-world-secondary flagship-enroll-btn"
              >
                {course.secondaryCtaLabel}
              </Link>
            )}
          </div>
        </div>

        <div className="flagship-learn-col">
          <div className="flagship-learn-title">{course.learnHeading}</div>
          <div className="flagship-learn-list">
            {learnPoints.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flagship-learn-item">
                <div className="flagship-learn-icon">{item.icon}</div>
                <div>
                  <div className="flagship-learn-item-title">{item.title}</div>
                  <div className="flagship-learn-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flagship-creator-card">
            <div className="flagship-creator-avatar">
              {course.coachPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(course.coachPhotoUrl)}
                  alt={course.coachName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                course.coachPhotoEmoji || "👨‍🏫"
              )}
            </div>
            <div>
              <div className="flagship-creator-name">{course.miniCreatorLabel}</div>
              <div className="flagship-creator-desc">{course.miniCreatorBio}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoachVictorBlock({ course }: { course: CourseContent }) {
  const photoUrl = resolveMediaUrl(course.coachPhotoUrl || "");
  const stats = course.stats || [];
  const checkoutId = resolveCourseProductId(course);

  const openYouTube = () => {
    const url = course.youtubeUrl?.trim();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const handle = (course.youtubeHandle || "").replace(/^@/, "");
    if (handle) {
      window.open(`https://www.youtube.com/@${handle}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="coach-victor-section">
      <span className="sec-label">{course.coachSectionLabel}</span>
      <h2 className="sec-h2">{course.coachHeading}</h2>
      <div className="coach-victor-card">
        <div
          className="coach-victor-avatar"
          style={{ background: course.coachAvatarGradient }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={course.coachName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            course.coachPhotoEmoji || "👨‍🏫"
          )}
        </div>
        <div className="coach-victor-content">
          <div className="coach-victor-name">{course.coachName}</div>
          <div className="coach-victor-role">{course.coachRole}</div>
          <div className="coach-victor-bio">{course.coachBio}</div>
          <div className="coach-victor-stats">
            {stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`}>
                <div className="coach-victor-stat-num">{stat.value}</div>
                <div className="coach-victor-stat-lbl">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="coach-victor-actions">
            {checkoutId ? (
              <CourseEnrollButton
                courseId={checkoutId}
                className="btn-world-primary"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                {course.coachEnrollLabel}
              </CourseEnrollButton>
            ) : (
              <Link
                href={course.coachEnrollHref || "/courses"}
                className="btn-world-primary"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                {course.coachEnrollLabel}
              </Link>
            )}
            <button type="button" className="btn-world-secondary" onClick={openYouTube}>
              {course.coachYoutubeButtonLabel || "▶️ YouTube Channel"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Render a list of full course + coach sections (world courses CMS). */
export function FlagshipCoursesList({
  courses,
}: {
  courses: WorldFlagshipCourse[];
}) {
  if (!courses?.length) return null;

  return (
    <div className="flagship-stack">
      {courses.map((course) => (
        <div key={course.id} className="flagship-stack-block">
          <AlsoFromDivider subtitle={course.dividerSubtitle} />
          <div className="flagship-stack-inner">
            <FlagshipCourseBlock course={course} />
            <CoachVictorBlock course={course} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FlagshipCourseStack({
  variant,
}: {
  variant: CourseVariant | "both";
}) {
  const { courses } = useLandingCourses();

  const stacks: CourseVariant[] =
    variant === "both" ? ["witweb", "ssg"] : [variant];

  return (
    <div className="flagship-stack">
      {stacks.map((v) => {
        const course = courses[v];
        return (
          <div key={v} className="flagship-stack-block">
            <AlsoFromDivider subtitle={course.dividerSubtitle} />
            <div className="flagship-stack-inner">
              <FlagshipCourseBlock course={course} />
              <CoachVictorBlock course={course} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

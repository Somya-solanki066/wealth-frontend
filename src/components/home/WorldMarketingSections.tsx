"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { FlagshipCourseStack } from "@/components/home/FlagshipCourseSections";
import {
  WORLD_PAGES,
  type ActiveWorld,
  type PricingPlan,
} from "@/lib/worldContent";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { isFreePlan } from "@/lib/plans";

export type ApiPlan = {
  id: string;
  world?: string;
  name: string;
  price: string;
  priceAmount?: number;
  period: string;
  badge?: string;
  discount?: string;
  cta?: string;
  type?: string;
  isFree?: boolean;
  features: { name: string; included: boolean }[];
};

function staticPlansToApi(world: ActiveWorld, plans: PricingPlan[]): ApiPlan[] {
  return plans.map((p) => ({
    id: `${world}-${p.id}`,
    world,
    name: p.name,
    price: p.price,
    priceAmount: p.id === "free" ? 0 : undefined,
    period: p.period,
    badge: p.badge,
    cta: p.cta,
    type: p.id === "free" ? "free" : p.id,
    isFree: p.id === "free",
    features: p.features.map((f) => ({ name: f.text, included: f.included })),
  }));
}

function planCtaLabel(world: ActiveWorld, plan: ApiPlan) {
  if (plan.cta) return plan.cta;
  if (isFreePlan(plan)) {
    return world === "student" ? "Start Studying Free" : "Start Free";
  }
  return "Get Access";
}

export function WorldFeaturesBlock({
  world,
  id = "world-features",
  bordered = true,
}: {
  world: ActiveWorld;
  id?: string;
  bordered?: boolean;
}) {
  const page = WORLD_PAGES[world];

  return (
    <section
      id={id}
      className="features-section"
      style={bordered ? undefined : { borderTop: "none", paddingTop: 0 }}
    >
      <span className="sec-label">{page.featuresLabel}</span>
      <h2 className="sec-h2">
        {page.featuresH2Lines?.length
          ? page.featuresH2Lines.map((line) => (
              <React.Fragment key={line}>
                {line}
                <br />
              </React.Fragment>
            ))
          : page.featuresH2}
      </h2>
      <div className="feat-grid">
        {page.features.map((feat) => {
          const card = (
            <div className="feat-card">
              <div className="feat-icon">{feat.icon}</div>
              <div className="feat-title">{feat.title}</div>
              <div className="feat-desc">{feat.desc}</div>
              <span className="feat-tag">{feat.tag}</span>
            </div>
          );

          return feat.link ? (
            <Link key={feat.title} href={feat.link} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={feat.title}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}

export function WorldPricingBlock({
  world,
  id = "world-pricing",
  bordered = true,
  cancelPath,
}: {
  world: ActiveWorld;
  id?: string;
  bordered?: boolean;
  cancelPath?: string;
}) {
  const page = WORLD_PAGES[world];
  const { user, token } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${getBackendApiUrl()}/settings`);
        const all: ApiPlan[] = response.data?.data?.plans || [];
        const worldPlans = all.filter((p) => (p.world || "writer") === world);
        if (!cancelled) {
          setPlans(
            worldPlans.length > 0
              ? worldPlans
              : staticPlansToApi(world, page.pricing)
          );
        }
      } catch {
        if (!cancelled) {
          setPlans(staticPlansToApi(world, page.pricing));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [world, page.pricing]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSelectPlan = async (plan: ApiPlan) => {
    if (!user || !token) {
      router.push("/register");
      return;
    }

    setSubmitting(true);
    setToast("Processing...");

    try {
      if (isFreePlan(plan)) {
        await axios.post(
          `${getBackendApiUrl()}/user/select-plan`,
          { planId: plan.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        router.push("/dashboard");
        return;
      }

      const response = await axios.post(
        `${getBackendApiUrl()}/stripe/create-checkout-session`,
        {
          planId: plan.id,
          email: user.email,
          cancelPath: cancelPath || `/${world}/pricing`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      setToast("Failed to initialize payment.");
      setSubmitting(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined;
      setToast(message || "Error processing request.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        id={id}
        className="pricing-section"
        style={bordered ? undefined : { borderTop: "none", paddingTop: 0 }}
      >
        <span className="sec-label">{page.pricingLabel}</span>
        <h2 className="sec-h2">{page.pricingH2}</h2>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--ac)", padding: "48px 0" }}>
            Loading plans...
          </p>
        ) : plans.length === 0 ? (
          <p style={{ textAlign: "center", color: "#909090", padding: "48px 0" }}>
            No plans available yet.{" "}
            <Link href="/register" style={{ color: "var(--ac)" }}>
              Create an account
            </Link>{" "}
            or check back soon.
          </p>
        ) : (
          <div className="price-grid">
            {plans.map((plan) => {
              const featured = Boolean(plan.badge);
              return (
                <div
                  key={plan.id}
                  className={`price-card${featured ? " featured" : ""}`}
                >
                  {plan.badge && (
                    <div className="price-badge">
                      {plan.badge.includes("⭐") ? plan.badge : `⭐ ${plan.badge}`}
                    </div>
                  )}
                  <div className="price-name">{plan.name}</div>
                  <div className="price-amount">{plan.price}</div>
                  <div className="price-period">{plan.period}</div>
                  {plan.discount ? (
                    <div className="price-period" style={{ marginTop: 4, opacity: 0.8 }}>
                      {plan.discount}
                    </div>
                  ) : null}
                  <div className="pf-list">
                    {(plan.features || []).map((f) => (
                      <div
                        key={f.name}
                        className={`pf-item${f.included ? "" : " muted"}`}
                      >
                        {f.included ? <span className="pf-check">✓</span> : null}
                        {!f.included ? "✗ " : null}
                        {f.name}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={
                      isFreePlan(plan) ? "btn-world-secondary" : "btn-world-primary"
                    }
                    style={{ width: "100%" }}
                    disabled={submitting}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {planCtaLabel(world, plan)}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!user && (
          <p
            style={{
              textAlign: "center",
              marginTop: 28,
              color: "#909090",
              fontSize: 13,
            }}
          >
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--ac)" }}>
              Log in
            </Link>{" "}
            to subscribe.
          </p>
        )}
      </section>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg1, #161000)",
            border: "1px solid var(--ac3, #2a1e00)",
            borderRadius: 14,
            padding: "12px 24px",
            fontSize: 13,
            color: "var(--ac, var(--gd))",
            fontWeight: 600,
            zIndex: 999,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

export function WorldCoursesBlock({
  world,
  id = "world-courses",
  bordered = true,
}: {
  world: ActiveWorld;
  id?: string;
  bordered?: boolean;
}) {
  const page = WORLD_PAGES[world];
  const flagship = world === "writer";
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <section
        id={id}
        className="features-section"
        style={bordered ? undefined : { borderTop: "none", paddingTop: 0 }}
      >
        <span className="sec-label">{page.coursesLabel}</span>
        <h2 className="sec-h2">{page.coursesH2}</h2>
        <p
          className="nh-sub"
          style={{
            marginBottom: 40,
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "center",
          }}
        >
          {page.coursesIntro}
        </p>

        {flagship ? (
          <div className="courses-flagship-grid">
            {page.courses.map((course) => (
              <div key={course.title} className="course-flagship-card">
                <div
                  className="course-flagship-banner"
                  style={{
                    background:
                      course.bannerGradient ||
                      "linear-gradient(135deg,#1a1200,#2e2000)",
                  }}
                >
                  {course.icon}
                </div>
                <div className="course-flagship-body">
                  {course.subtitle ? (
                    <div className="course-flagship-sub">{course.subtitle}</div>
                  ) : null}
                  <div className="course-flagship-title">{course.title}</div>
                  <div className="course-flagship-desc">{course.desc}</div>
                  {course.tags?.length ? (
                    <div className="course-flagship-tags">
                      {course.tags.map((tag) => (
                        <span key={tag} className="course-flagship-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    href={course.href}
                    className={
                      course.ctaVariant === "ssg"
                        ? "btn-world-ssg"
                        : "btn-world-primary"
                    }
                    style={{
                      width: "100%",
                      textAlign: "center",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    {course.cta || "Enroll →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="feat-grid">
            {page.courses.map((course) => (
              <Link
                key={course.title}
                href={course.href}
                className="feat-card"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div className="feat-icon">{course.icon}</div>
                <div className="feat-title">{course.title}</div>
                <div className="feat-desc">{course.desc}</div>
                <span className="feat-tag">{course.meta}</span>
              </Link>
            ))}
          </div>
        )}

        {page.freeResources ? (
          <div className="free-resources-box">
            <p className="free-resources-label">{page.freeResources.label}</p>
            <h3 className="free-resources-title">{page.freeResources.title}</h3>
            <p className="free-resources-intro">{page.freeResources.intro}</p>
            <div className="free-resources-actions">
              {page.freeResources.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="btn-world-secondary"
                  onClick={() =>
                    setToast(`📥 Downloading ${item.label.replace(/^📥\s*/, "")}...`)
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg1, #161000)",
            border: "1px solid var(--ac3, #2a1e00)",
            borderRadius: 14,
            padding: "12px 24px",
            fontSize: 13,
            color: "var(--ac, var(--gd))",
            fontWeight: 600,
            zIndex: 999,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

/** Full Features + Pricing + Courses stack for world landings */
export default function WorldMarketingSections({
  world,
}: {
  world: ActiveWorld;
}) {
  return (
    <>
      <WorldFeaturesBlock world={world} />
      <WorldPricingBlock world={world} cancelPath="/" />
      {world === "writer" ? (
        <FlagshipCourseStack variant="both" />
      ) : world === "screenwriter" ? (
        <FlagshipCourseStack variant="both" />
      ) : world === "student" ? (
        <FlagshipCourseStack variant="both" />
      ) : (
        <WorldCoursesBlock world={world} />
      )}
    </>
  );
}

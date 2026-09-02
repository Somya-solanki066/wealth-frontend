"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWorld, WORLD_CONFIG, type WorldId } from "@/context/WorldContext";
import { BookOpen, LogOut, Flame, Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import "@/app/home-worlds.css";

function worldFromPath(pathname: string): Exclude<WorldId, "neutral"> | null {
  if (pathname.startsWith("/screenwriter")) return "screenwriter";
  if (pathname.startsWith("/student/")) return "student";
  if (pathname.startsWith("/writer")) return "writer";
  return null;
}

function NavbarContent() {
  const { user, signOutUser, loading, profile } = useAuth();
  const { world, setWorld, config, goHome } = useWorld();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";

  // Always null on SSR + first client paint — avoids hydration mismatch with localStorage
  const [streak, setStreak] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("writingStreak");
    if (cached) setStreak(parseInt(cached, 10));
  }, []);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      localStorage.removeItem("writingStreak");
      return;
    }

    const fetchStreak = async () => {
      try {
        const response = await api.get("/user/streak");
        const newStreak = response.data.writingStreak || 0;
        setStreak(newStreak);
        localStorage.setItem("writingStreak", newStreak.toString());
      } catch (err) {
        console.error("Failed to fetch streak in navbar:", err);
      }
    };

    fetchStreak();

    const handleStreakUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setStreak(customEvent.detail);
        localStorage.setItem("writingStreak", String(customEvent.detail));
      }
    };

    window.addEventListener("streakUpdated", handleStreakUpdate);
    return () => window.removeEventListener("streakUpdated", handleStreakUpdate);
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Path wins on world routes so SSR and client match (context may still be neutral on SSR)
  const pathWorld = worldFromPath(pathname);
  const activeWorld: Exclude<WorldId, "neutral"> =
    pathWorld ?? (world !== "neutral" ? world : "writer");
  const activeConfig = WORLD_CONFIG[activeWorld];

  const sectionFromPath = (): "features" | "pricing" | "courses" => {
    if (pathname.endsWith("/pricing")) return "pricing";
    if (pathname.endsWith("/courses")) return "courses";
    return "features";
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      goHome();
    }
  };

  const navCtaLabel =
    (pathWorld ? activeConfig : config)?.cta || activeConfig.cta || "Get Started Free";
  const logoIcon = activeConfig.icon;
  const showWorldLogo = Boolean(pathWorld) || (isHome && world !== "neutral");
  const accentBorder = "border-[var(--gm)]";
  const accentText = "text-[var(--gd)]";
  const showWorldSwitcher = world !== "neutral" || Boolean(pathWorld);
  const onWorldPage = Boolean(pathWorld);
  const currentSection = sectionFromPath();

  const handleWorldSwitch = (id: Exclude<WorldId, "neutral">) => {
    setWorld(id);
    if (onWorldPage) router.push(`/${id}/${currentSection}`);
    else if (!isHome) router.push(`/${id}/features`);
    closeMobileMenu();
  };

  const navLinkClass = (active: boolean) =>
    `block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
      active ? accentText : "text-[#909090] hover:text-[#F0EBE0] hover:bg-[#161616]"
    }`;

  return (
    <>
    <nav className="site-nav fixed top-0 left-0 right-0 z-50 bg-[#080808]/95 backdrop-blur-md border-b border-[#1a1a1a] px-3 sm:px-6 lg:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[60px] sm:h-[68px] gap-3 min-w-0">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-initial"
        >
          <div
            className={`hidden sm:flex w-9 h-9 rounded-lg border ${accentBorder} items-center justify-center text-lg bg-[#111] transition-all shrink-0`}
          >
            {showWorldLogo ? (
              <span className="text-base leading-none">{logoIcon}</span>
            ) : (
              <BookOpen className={`h-4 w-4 ${accentText}`} />
            )}
          </div>
          <span
            className={`font-serif font-black text-lg sm:text-xl tracking-wide truncate ${accentText}`}
          >
            Ink2Wealth
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-7">
          <Link
            href={`/${activeWorld}/features`}
            onClick={() => setWorld(activeWorld)}
            className={`text-[13px] font-medium transition-colors ${
              pathname.endsWith("/features") ? accentText : "text-[#606060] hover:text-[#F0EBE0]"
            }`}
          >
            Features
          </Link>
          <Link
            href={`/${activeWorld}/pricing`}
            onClick={() => setWorld(activeWorld)}
            className={`text-[13px] font-medium transition-colors ${
              pathname.endsWith("/pricing") ? accentText : "text-[#606060] hover:text-[#F0EBE0]"
            }`}
          >
            Pricing
          </Link>
          <Link
            href={`/${activeWorld}/courses`}
            onClick={() => setWorld(activeWorld)}
            className={`text-[13px] font-medium transition-colors ${
              pathname.endsWith("/courses") ? accentText : "text-[#606060] hover:text-[#F0EBE0]"
            }`}
          >
            Courses
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showWorldSwitcher && (
            <div className="nav-world-switcher desktop-nav-switcher hidden lg:flex">
              {(Object.keys(WORLD_CONFIG) as Exclude<WorldId, "neutral">[]).map((id) => {
                const item = WORLD_CONFIG[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className={`nws-btn ${item.switcherClass} ${activeWorld === id ? "on" : ""}`}
                    onClick={() => handleWorldSwitch(id)}
                  >
                    {item.icon} {item.shortLabel}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && user ? (
            <div className="hidden lg:flex items-center gap-3">
              {streak !== null && (
                <Link href="/dashboard">
                  <div
                    className="flex items-center gap-1.5 bg-[var(--gf)] border border-[var(--gd)]/30 hover:border-[var(--gd)]/50 px-3 py-1.5 rounded-xl text-[var(--gd)] text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Writing Streak"
                  >
                    <Flame className="h-4 w-4 fill-current text-orange-500 animate-pulse" />
                    <span>{streak} Days</span>
                  </div>
                </Link>
              )}
              {!isDashboard && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] text-white font-bold leading-none">
                  {profile?.displayName || "User"}
                </span>
                <span className="text-[8px] text-[var(--gd)] font-semibold mt-0.5 uppercase tracking-widest">
                  {activeConfig.shortLabel}
                </span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                className="px-2 py-2 rounded-xl"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden lg:block">
              <Button variant="primary" size="sm">
                {navCtaLabel}
              </Button>
            </Link>
          )}

          <button
            type="button"
            className="mobile-menu-btn lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>

    {showWorldSwitcher && (
      <div className="mobile-world-switcher-bar lg:hidden" aria-label="Switch world">
        <div className="mobile-world-switcher-inner">
          <div className="nav-world-switcher mobile-bar-switcher">
            {(Object.keys(WORLD_CONFIG) as Exclude<WorldId, "neutral">[]).map((id) => {
              const item = WORLD_CONFIG[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`nws-btn ${item.switcherClass} ${activeWorld === id ? "on" : ""}`}
                  onClick={() => handleWorldSwitch(id)}
                >
                  {item.icon} {item.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}

    <div
      className={`fixed-nav-spacer${showWorldSwitcher ? " with-world-switcher" : ""}`}
      aria-hidden="true"
    />

    {mobileMenuOpen && (
      <>
        <button
          type="button"
          className="mobile-nav-backdrop lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        />
        <aside className="mobile-nav-sidebar lg:hidden" aria-label="Mobile navigation">
          <div className="mobile-nav-sidebar-header">
            <span className="mobile-nav-sidebar-title">Menu</span>
            <button
              type="button"
              className="mobile-nav-close"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!loading && user && (
            <div className="mobile-nav-user">
              <div className="mobile-nav-user-name">{profile?.displayName || "User"}</div>
              <div className="mobile-nav-user-role">{activeConfig.shortLabel}</div>
            </div>
          )}

          {showWorldSwitcher && (
            <div className="mobile-nav-section">
              <div className="mobile-nav-label">Switch World</div>
              <div className="mobile-nav-world-grid">
                {(Object.keys(WORLD_CONFIG) as Exclude<WorldId, "neutral">[]).map((id) => {
                  const item = WORLD_CONFIG[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`mobile-nav-world-btn ${item.switcherClass} ${activeWorld === id ? "on" : ""}`}
                      onClick={() => handleWorldSwitch(id)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mobile-nav-section">
            <div className="mobile-nav-label">Explore</div>
            <nav className="mobile-nav-links">
              <Link
                href={`/${activeWorld}/features`}
                onClick={() => { setWorld(activeWorld); closeMobileMenu(); }}
                className={navLinkClass(pathname.endsWith("/features"))}
              >
                Features
              </Link>
              <Link
                href={`/${activeWorld}/pricing`}
                onClick={() => { setWorld(activeWorld); closeMobileMenu(); }}
                className={navLinkClass(pathname.endsWith("/pricing"))}
              >
                Pricing
              </Link>
              <Link
                href={`/${activeWorld}/courses`}
                onClick={() => { setWorld(activeWorld); closeMobileMenu(); }}
                className={navLinkClass(pathname.endsWith("/courses"))}
              >
                Courses
              </Link>
            </nav>
          </div>

          <div className="mobile-nav-actions">
            {!loading && user ? (
              <>
                {streak !== null && (
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="mobile-nav-streak"
                  >
                    <Flame className="h-4 w-4 fill-current text-orange-500" />
                    <span>{streak} Days Streak</span>
                  </Link>
                )}
                {!isDashboard && (
                  <Link href="/dashboard" onClick={closeMobileMenu} className="w-full">
                    <Button variant="outline" size="md" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="w-full"
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={closeMobileMenu} className="w-full">
                <Button variant="primary" size="md" className="w-full">
                  {navCtaLabel}
                </Button>
              </Link>
            )}
          </div>
        </aside>
      </>
    )}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="fixed-nav-spacer" aria-hidden="true" />}>
      <NavbarContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, LogOut, ChevronDown, User, Settings, Sparkles, FolderKanban, Flame } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/services/api";

function NavbarContent() {
  const { user, signOutUser, loading, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Streak state
  const [streak, setStreak] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("writingStreak");
      return cached ? parseInt(cached, 10) : null;
    }
    return null;
  });

  useEffect(() => {
    if (!user) {
      setStreak(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("writingStreak");
      }
      return;
    }

    const fetchStreak = async () => {
      try {
        const response = await api.get("/user/streak");
        const newStreak = response.data.writingStreak || 0;
        setStreak(newStreak);
        if (typeof window !== "undefined") {
          localStorage.setItem("writingStreak", newStreak.toString());
        }
      } catch (err) {
        console.error("Failed to fetch streak in navbar:", err);
      }
    };

    fetchStreak();

    const handleStreakUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setStreak(customEvent.detail);
        if (typeof window !== "undefined") {
          localStorage.setItem("writingStreak", customEvent.detail.toString());
        }
      }
    };

    window.addEventListener("streakUpdated", handleStreakUpdate);
    return () => {
      window.removeEventListener("streakUpdated", handleStreakUpdate);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Public Links (Logged Out - pointing to page.tsx query parameters)
  const publicLinks = [
    { name: "WIT-WEB Academy", href: "/?screen=witweb-landing" },
    { name: "SSG Blueprint", href: "/?screen=ssg-landing" },
    { name: "My Courses", href: "/login?redirectTo=/dashboard" },
  ];

  // Dashboard Dropdown Menus (Logged In)
  const dashboardMenus = {
    ink: {
      label: "INK",
      items: [
        { name: "Projects", href: "/dashboard?tab=home" },
        { name: "Novel Editor", href: "/dashboard?tab=novel" },
        { name: "Script Editor", href: "/dashboard?tab=script" },
        { name: "Chapter Analyzer", href: "/dashboard?tab=tools" },
        { name: "Smart Edit", href: "/dashboard?tab=tools" },
      ],
    },
    wealth: {
      label: "WEALTH",
      items: [
        { name: "Jobs", href: "/dashboard?tab=wealth" },
        { name: "Industry Connect", href: "/dashboard?tab=wealth" },
        { name: "Branding", href: "/dashboard?tab=wealth" },
        { name: "Promotion", href: "/dashboard?tab=wealth" },
        { name: "Publishing", href: "/dashboard?tab=wealth" },
      ],
    },
    student: {
      label: "STUDENT",
      items: [
        { name: "Study Planner", href: "/dashboard?tab=student" },
        { name: "Flashcards", href: "/dashboard?tab=student" },
        { name: "Citation Generator", href: "/dashboard?tab=student" },
        { name: "Course Video Finder", href: "/dashboard?tab=student" },
        { name: "Essay Writer", href: "/dashboard?tab=student" },
        { name: "Exam Techniques", href: "/dashboard?tab=student" },
      ],
    },
    coaching: {
      label: "COACHING",
      items: [
        { name: "Courses", href: "/courses" },
        { name: "YouTube", href: "/coach" },
        { name: "Community", href: "/coach" },
        { name: "Resources", href: "/dashboard?tab=resources" },
      ],
    },
  };

  // Public Links for Logged In users when on public site
  const loggedInPublicLinks = [
    { name: "Features", href: "/features" },
    { name: "Courses", href: "/courses" },
    { name: "WEALTH", href: "/wealth" },
    { name: "Students", href: "/student" },
    { name: "Coach Victor", href: "/coach" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/92 backdrop-blur-md border-b border-[#242424] px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[70px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-[38px] h-[38px] bg-gradient-to-br from-[#1e1500] to-[#2e2000] border border-[#7A5E1E] rounded-lg flex items-center justify-center text-lg text-[#C9A84C] group-hover:border-[#C9A84C] transition-all duration-200">
            <BookOpen className="h-4.5 w-4.5 text-[#C9A84C]" />
          </div>
          <span className="font-serif font-black text-xl text-[#C9A84C] tracking-wide">
            Ink2Wealth
          </span>
        </Link>

        {/* Conditional Center Links */}
        {pathname !== "/dashboard" ? (
          <div className="hidden lg:flex items-center gap-8">
            {user ? (
              // Logged in user on public site
              loggedInPublicLinks.map((link) => {
                const isActive = pathname === link.href || (typeof window !== "undefined" && window.location.hash === link.href.split("#")[1]);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-[13px] font-medium transition-colors duration-200 ${
                      isActive ? "text-[#C9A84C]" : "text-[#909090] hover:text-[#F0EBE0]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })
            ) : (
              // Logged out visitor on public site
              publicLinks.map((link) => {
                // Read current search param to match active state
                const isMatch = searchParams && searchParams.get("screen") === link.href.split("screen=")[1];
                const isHome = link.href === "/?screen=home" && (!searchParams || !searchParams.get("screen"));
                const isActive = isMatch || isHome;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-[13px] font-medium transition-colors duration-200 ${
                      isActive ? "text-[#C9A84C]" : "text-[#909090] hover:text-[#F0EBE0]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })
            )}
          </div>
        ) : (
          /* Empty center spacer for dashboard / logged-in state */
          <div className="hidden lg:flex items-center gap-8" />
        )}

        {/* CTA Actions */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="flex items-center gap-3">
              {streak !== null && (
                <Link href="/dashboard">
                  <div 
                    className="flex items-center gap-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 hover:border-[#C9A84C]/50 px-3 py-1.5 rounded-xl text-[#C9A84C] text-xs font-bold transition-all duration-300 hover:bg-[#C9A84C]/15 cursor-pointer flex items-center shrink-0"
                    title="Writing Streak"
                  >
                    <Flame className="h-4 w-4 fill-current text-orange-500 animate-pulse" />
                    <span>{streak} Days 🔥</span>
                  </div>
                </Link>
              )}
              {pathname === "/dashboard" ? (
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Go to Public Site
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] text-white font-bold leading-none">{profile?.displayName || "User"}</span>
                <span className="text-[8px] text-[#C9A84C] font-semibold mt-0.5 uppercase tracking-widest">Writer</span>
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
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-[70px] bg-[#080808]" />}>
      <NavbarContent />
    </Suspense>
  );
}

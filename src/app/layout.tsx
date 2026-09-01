import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import "./home-worlds.css";
import { AuthProvider } from "@/context/AuthContext";
import { WorldProvider } from "@/context/WorldContext";
import OnboardingGuard from "@/components/OnboardingGuard";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ink2Wealth — Write It. Script It. Earn From It.",
  description:
    "One app. Three worlds. Fiction writers, screenwriters, and students — Ink2Wealth shifts to serve you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080808] text-[#F0EBE0] font-sans">
        <AuthProvider>
          <WorldProvider>
            <OnboardingGuard>
              {children}
            </OnboardingGuard>
          </WorldProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

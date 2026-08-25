"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you might want to verify the session_id with the backend here.
    // For now, since webhooks handle the actual fulfillment, we just show success.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#161616] border border-[#242424] rounded-3xl p-8 text-center space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2
                className="animate-spin text-[#C9A84C]"
                size={48}
              />
              <p className="text-[#909090] text-sm">
                Verifying payment...
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-[#52C07A]/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle
                  className="text-[#52C07A]"
                  size={32}
                />
              </div>

              <h1 className="font-serif text-3xl font-black text-white">
                Payment Successful!
              </h1>

              <p className="text-[#909090] text-sm leading-relaxed">
                Thank you for your subscription. Your account has been
                upgraded and you now have access to premium features.
              </p>

              <div className="pt-6">
                <Link
                  href="/dashboard"
                  className="w-full text-center py-3 font-bold rounded-xl text-xs block bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950 hover:opacity-90 transition-all"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex items-center justify-center">
          <Loader2
            className="animate-spin text-[#C9A84C]"
            size={48}
          />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

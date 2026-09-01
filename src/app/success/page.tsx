"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const verify = async () => {
      if (!sessionId) {
        setError("Missing payment session. If you were charged, contact support.");
        setLoading(false);
        return;
      }

      if (!user) {
        // Auth can lag after Stripe redirect; wait briefly then show soft message.
        setError("Please sign in again to activate your premium plan.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/stripe/verify-session", { sessionId });
        if (cancelled) return;
        if (response.data?.success) {
          setPlanName(response.data.planName || "");
        } else {
          setError(response.data?.error || "Could not confirm payment.");
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err.response?.data?.error ||
            "Payment received, but activation is still pending. Refresh dashboard in a moment."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, user, authLoading]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#161616] border border-[#242424] rounded-3xl p-8 text-center space-y-6">
          {loading || authLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="animate-spin text-[var(--gd)]" size={48} />
              <p className="text-[#909090] text-sm">Verifying payment...</p>
            </div>
          ) : error && !planName ? (
            <>
              <div className="mx-auto w-16 h-16 bg-[var(--gd)]/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-[var(--gd)]" size={32} />
              </div>
              <h1 className="font-serif text-3xl font-black text-white">Almost there</h1>
              <p className="text-[#909090] text-sm leading-relaxed">{error}</p>
              <div className="pt-6">
                <Link
                  href="/dashboard"
                  className="w-full text-center py-3 font-bold rounded-xl text-xs block bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 hover:opacity-90 transition-all"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-[#52C07A]/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="text-[#52C07A]" size={32} />
              </div>

              <h1 className="font-serif text-3xl font-black text-white">
                Payment Successful!
              </h1>

              <p className="text-[#909090] text-sm leading-relaxed">
                {planName
                  ? `Your ${planName} plan is now active. Premium tools are unlocked on your dashboard.`
                  : "Thank you for your subscription. Your account has been upgraded and you now have access to premium features."}
              </p>
              {error && (
                <p className="text-[#909090] text-xs">{error}</p>
              )}

              <div className="pt-6">
                <Link
                  href="/dashboard"
                  className="w-full text-center py-3 font-bold rounded-xl text-xs block bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 hover:opacity-90 transition-all"
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
          <Loader2 className="animate-spin text-[var(--gd)]" size={48} />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

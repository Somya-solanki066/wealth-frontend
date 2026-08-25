"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, X, Star } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function PricingPage() {
  const { content } = useContent("pricing");
  const { user, token } = useAuth();
  const [toastMessage, setToastMessage] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [yearlyPlans, setYearlyPlans] = useState<any[]>([]);
  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/settings");
        if (response.data?.data?.plans) {
          const allPlans = response.data.data.plans;
          setPlans(allPlans);
          setYearlyPlans(allPlans.filter((p: any) => !p.type || p.type === 'yearly'));
          setMonthlyPlans(allPlans.filter((p: any) => p.type === 'monthly'));
        }
      } catch (error) {
        console.error("Failed to fetch plans", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  };

  const handleSelectPlan = async (planId: string, planPrice: string) => {
    if (!user || !token) {
      // Not logged in, go to register
      window.location.href = "/register";
      return;
    }
    
    setSubmitting(true);
    triggerToast("Processing...");

    try {
      const isFree = planPrice === '₦0' || planPrice.toLowerCase() === 'free';
      
      if (isFree) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/user/select-plan`,
          { planId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        window.location.href = "/dashboard";
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/stripe/create-checkout-session`,
          { planId, userId: user.uid, email: user.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          triggerToast("Failed to initialize payment.");
          setSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error("Failed to select plan:", err);
      triggerToast("Error processing request.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#161616] border border-[#7A5E1E] text-[#C9A84C] font-semibold text-xs px-6 py-3 rounded-xl shadow-2xl transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pt-[70px] pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
          
          {/* Page Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase">
              {content.pagePreTitle || "Simple Pricing"}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white">
              {content.pageTitleBlack || "Start Free."} <span className="text-[#C9A84C]">{content.pageTitleGold || "Upgrade Anytime."}</span>
            </h1>
            <p className="text-[#909090] text-sm md:text-base leading-relaxed">
              {content.pageSubtitle || "Choose the plan that works for you. Cancel anytime. No hidden fees."}
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            
            {loadingPlans ? (
              <div className="col-span-full text-center text-[#C9A84C] py-20 animate-pulse">
                Loading plans...
              </div>
            ) : yearlyPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => triggerToast(`${plan.name} selected!`)}
                className={`bg-[#161616] ${plan.badge ? 'border-2 border-[#7A5E1E] shadow-2xl' : 'border border-[#242424] hover:border-[#7A5E1E] shadow-lg'} rounded-3xl p-8 flex flex-col justify-between cursor-pointer transition-all duration-250 relative text-left overflow-hidden`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> {plan.badge}
                  </div>
                )}
                
                <div>
                  <h4 className={`text-[11px] font-bold uppercase tracking-widest ${plan.badge ? 'text-[#C9A84C]' : 'text-[#909090]'} mb-3`}>
                    {plan.name}
                  </h4>
                  <div className="font-serif text-4xl font-black text-[#C9A84C] mb-1">{plan.price}</div>
                  <p className="text-[10px] text-[#606060] mb-2">{plan.period}</p>
                  
                  {plan.discount && (
                    <p className="text-[10px] text-[#52C07A] font-bold mb-6">{plan.discount}</p>
                  )}
                  {!plan.discount && <div className="mb-6 h-4"></div> /* Spacer */}

                  <div className={`space-y-3.5 border-t ${plan.badge ? 'border-[#7A5E1E]/30' : 'border-[#242424]'} pt-6 mb-8 text-xs text-[#909090]`}>
                    {plan.features.map((feature: any, idx: number) => (
                      <div key={idx} className={`flex items-center gap-2 ${!feature.included ? 'text-[#606060]' : ''}`}>
                        {feature.included ? (
                          <Check className="h-4 w-4 text-[#52C07A] shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500/50 shrink-0" />
                        )}
                        {feature.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => handleSelectPlan(plan.id, plan.price)}
                  disabled={submitting}
                  className={`w-full text-center py-3 font-bold rounded-xl text-xs block ${
                    plan.badge || plan.price !== '₦0' 
                      ? 'bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950' 
                      : 'border border-[#242424] hover:bg-[#1c1c1c] text-[#F0EBE0]'
                  }`}
                >
                  {plan.price === '₦0' ? 'Get Started Free' : `Get ${plan.name} Access`}
                </button>
              </div>
            ))}
          </div>

          {/* Monthly plan details panel */}
          {monthlyPlans.length > 0 && (
            <div className="mt-16 text-center space-y-12">
              <div className="max-w-3xl mx-auto space-y-4">
                <h3 className="font-serif text-3xl font-bold text-white">
                  {content.monthlyTitle || "Monthly Plans Available"}
                </h3>
                <p className="text-xs text-[#909090]">
                  {content.monthlySubtitle || "Start month by month — cancel anytime."}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch justify-center">
                {monthlyPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => triggerToast(`${plan.name} selected!`)}
                    className={`bg-[#161616] ${plan.badge ? 'border-2 border-[#7A5E1E] shadow-2xl' : 'border border-[#242424] hover:border-[#7A5E1E] shadow-lg'} rounded-3xl p-8 flex flex-col justify-between cursor-pointer transition-all duration-250 relative text-left overflow-hidden`}
                  >
                    {plan.badge && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> {plan.badge}
                      </div>
                    )}
                    
                    <div>
                      <h4 className={`text-[11px] font-bold uppercase tracking-widest ${plan.badge ? 'text-[#C9A84C]' : 'text-[#909090]'} mb-3`}>
                        {plan.name}
                      </h4>
                      <div className="font-serif text-4xl font-black text-[#C9A84C] mb-1">{plan.price}</div>
                      <p className="text-[10px] text-[#606060] mb-2">{plan.period}</p>
                      
                      {plan.discount && (
                        <p className="text-[10px] text-[#52C07A] font-bold mb-6">{plan.discount}</p>
                      )}
                      {!plan.discount && <div className="mb-6 h-4"></div> /* Spacer */}

                      <div className={`space-y-3.5 border-t ${plan.badge ? 'border-[#7A5E1E]/30' : 'border-[#242424]'} pt-6 mb-8 text-xs text-[#909090]`}>
                        {plan.features.map((feature: any, idx: number) => (
                          <div key={idx} className={`flex items-center gap-2 ${!feature.included ? 'text-[#606060]' : ''}`}>
                            {feature.included ? (
                              <Check className="h-4 w-4 text-[#52C07A] shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-red-500/50 shrink-0" />
                            )}
                            {feature.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Link
                      href="/register"
                      className={`w-full text-center py-3 font-bold rounded-xl text-xs block ${
                        plan.badge || plan.price !== '₦0' 
                          ? 'bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950' 
                          : 'border border-[#242424] hover:bg-[#1c1c1c] text-[#F0EBE0]'
                      }`}
                    >
                      {plan.price === '₦0' ? 'Get Started Free' : `Get ${plan.name} Access`}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

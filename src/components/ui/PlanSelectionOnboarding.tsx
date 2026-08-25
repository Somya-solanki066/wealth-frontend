"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Check, X, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PlanSelectionOnboarding() {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [yearlyPlans, setYearlyPlans] = useState<any[]>([]);
  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/settings`);
        if (response.data?.data?.plans) {
          const allPlans = response.data.data.plans;
          setPlans(allPlans);
          setYearlyPlans(allPlans.filter((p: any) => !p.type || p.type === 'yearly'));
          setMonthlyPlans(allPlans.filter((p: any) => p.type === 'monthly'));
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
        setError("Failed to load subscription plans.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: string, planPrice: string) => {
    if (!user || !token) return;
    setSubmitting(true);
    setError("");

    try {
      const isFree = planPrice === '₦0' || planPrice.toLowerCase() === 'free';
      
      if (isFree) {
        // Free plan logic: update directly
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/user/select-plan`,
          { planId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        window.location.reload();
      } else {
        // Paid plan logic: redirect to Stripe Checkout
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/stripe/create-checkout-session`,
          { planId, userId: user.uid, email: user.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          setError("Failed to initialize payment session.");
          setSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error("Failed to select plan:", err);
      setError("Failed to process plan selection. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#080808] text-[#F0EBE0] overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase">
            Welcome to Ink2Wealth
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-white">
            Choose Your <span className="text-[#C9A84C]">Plan</span>
          </h1>
          <p className="text-[#909090] text-sm md:text-base leading-relaxed">
            Please select a plan to continue. You can always upgrade later.
          </p>
          {error && <p className="text-red-500 text-sm font-bold mt-4">{error}</p>}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#C9A84C]" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch relative">
            {submitting && (
              <div className="absolute inset-0 bg-[#080808]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                <Loader2 className="animate-spin text-[#C9A84C]" size={40} />
              </div>
            )}
            
            {yearlyPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#161616] ${plan.badge ? 'border-2 border-[#7A5E1E] shadow-2xl' : 'border border-[#242424]'} rounded-3xl p-8 flex flex-col justify-between relative text-left overflow-hidden`}
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
                  {!plan.discount && <div className="mb-6 h-4"></div>}

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
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={submitting}
                  className={`w-full text-center py-3 font-bold rounded-xl text-xs block transition-all mt-6 ${
                    plan.badge || plan.price !== '₦0' 
                      ? 'bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950 hover:opacity-90' 
                      : 'border border-[#242424] hover:bg-[#1c1c1c] text-[#F0EBE0]'
                  }`}
                >
                  {plan.price === '₦0' || plan.price.toLowerCase() === 'free' ? 'Start Free' : `Select ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Monthly Plans Section */}
        {!loading && monthlyPlans.length > 0 && (
          <div className="mt-16 text-center space-y-12">
            <div className="max-w-3xl mx-auto space-y-4">
              <h3 className="font-serif text-3xl font-bold text-white">
                Monthly Plans Available
              </h3>
              <p className="text-xs text-[#909090]">
                Start month by month — cancel anytime.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch relative justify-center">
              {submitting && (
                <div className="absolute inset-0 bg-[#080808]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                  <Loader2 className="animate-spin text-[#C9A84C]" size={40} />
                </div>
              )}
              
              {monthlyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-[#161616] ${plan.badge ? 'border-2 border-[#7A5E1E] shadow-2xl' : 'border border-[#242424]'} rounded-3xl p-8 flex flex-col justify-between relative text-left overflow-hidden`}
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
                    {!plan.discount && <div className="mb-6 h-4"></div>}

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
                    className={`w-full text-center py-3 font-bold rounded-xl text-xs block transition-all mt-6 ${
                      plan.badge || plan.price !== '₦0' 
                        ? 'bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] text-zinc-950 hover:opacity-90' 
                        : 'border border-[#242424] hover:bg-[#1c1c1c] text-[#F0EBE0]'
                    }`}
                  >
                    {plan.price === '₦0' || plan.price.toLowerCase() === 'free' ? 'Start Free' : `Select ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

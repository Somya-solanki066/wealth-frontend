"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Sparkles, Check, Loader2 } from "lucide-react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { isFreePlan } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { useWorld } from "@/context/WorldContext";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onUpgrade?: () => void;
}

export default function PaywallModal({
  isOpen,
  onClose,
  featureName = "Premium Writing Tool",
  onUpgrade,
}: PaywallModalProps) {
  const { user, updateUserProfile } = useAuth();
  const { world } = useWorld();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, world]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${getBackendApiUrl()}/settings`);
      const allPlans = response.data.data.plans || [];
      const activeWorld = world === "neutral" ? "writer" : world;
      setPlans(
        allPlans.filter(
          (p: any) => !isFreePlan(p) && (p.world || "writer") === activeWorld
        )
      );
    } catch (err) {
      console.error("Failed to load plans:", err);
      setError("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    if (!user) return;
    setUpgrading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${getBackendApiUrl()}/stripe/create-checkout-session`,
        { planId, email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      setError("Failed to initialize payment.");
    } catch (err: any) {
      console.error("Checkout failed:", err);
      setError(err.response?.data?.error || "Checkout failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Unlock Premium">
      <div className="text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-[var(--gd)]/10 border border-[var(--gm)] flex items-center justify-center text-[var(--gd)]">
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h4 className="font-serif text-base font-bold text-white">
            {featureName} is locked
          </h4>
          <p className="text-xs text-[#909090] max-w-sm mx-auto leading-relaxed">
            Get unlimited AI platform checks, screenplay validations, and direct pitch submissions to Nollywood.
          </p>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-[var(--gd)]" size={24} />
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-zinc-950 border border-[var(--gd)] rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-white">{plan.name}</h5>
                  <span className="text-[var(--gd)] font-bold">{plan.price}</span>
                </div>
                <div className="text-[10px] text-[#606060]">{plan.period}</div>
                <div className="space-y-1 text-[11px] text-[#909090] max-h-32 overflow-y-auto custom-scrollbar">
                  {plan.features?.filter((f: any) => f.included).map((feat: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#52C07A] shrink-0" /> {feat.name}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={upgrading}
                  className="w-full mt-2"
                >
                  {upgrading ? "Processing..." : `Subscribe ${plan.price}`}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="text-[11px] font-bold text-[#606060] hover:text-[#909090] transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
}

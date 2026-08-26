"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Sparkles, Check, Loader2 } from "lucide-react";
import axios from "axios";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { useAuth } from "@/context/AuthContext";

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
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${getBackendApiUrl()}/settings`);
      const allPlans = response.data.data.plans || [];
      // Filter out the free plan
      setPlans(allPlans.filter((p: any) => p.id !== 'free' && p.id !== 'plan_free'));
    } catch (err) {
      console.error("Failed to load plans:", err);
      setError("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUpgrade = async (planId: string) => {
    if (!user) return;
    setUpgrading(true);
    setError("");
    try {
      // Get the firebase token (assuming it's stored or available, or we just rely on cookies if setup)
      // Here we assume withCredentials is true or we pass token if needed.
      const token = await user.getIdToken();
      
      await axios.post(
        `${getBackendApiUrl()}/user/simulate-upgrade`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (onUpgrade) onUpgrade();
      // Reload page to reflect premium status
      window.location.reload();
    } catch (err: any) {
      console.error("Upgrade failed:", err);
      setError("Upgrade failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Unlock Premium">
      <div className="text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#C9A84C]/10 border border-[#7A5E1E] flex items-center justify-center text-[#C9A84C]">
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
            <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-zinc-950 border border-[#C9A84C] rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-white">{plan.name}</h5>
                  <span className="text-[#C9A84C] font-bold">{plan.price}</span>
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
                  onClick={() => handleSimulateUpgrade(plan.id)}
                  disabled={upgrading}
                  className="w-full mt-2"
                >
                  {upgrading ? "Processing..." : `Subscribe with RevenueCat (Test)`}
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

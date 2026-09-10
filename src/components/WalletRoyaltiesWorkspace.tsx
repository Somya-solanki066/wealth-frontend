"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Period = "7d" | "30d" | "90d" | "all";
type Step = "dashboard" | "detail";

type Activity = {
  id: string;
  source: string;
  title: string;
  storyTitle?: string;
  chapterLabel?: string;
  creatorAmountUsd: number;
  grossAmountUsd: number;
  platformFeeUsd: number;
  status: string;
  network: string;
  txHash: string;
  paidAt: string;
  walletAddress: string;
  explorerUrl?: string | null;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function money(n: number) {
  return `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function WalletRoyaltiesWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("dashboard");
  const [period, setPeriod] = useState<Period>("30d");
  const [networks, setNetworks] = useState<string[]>(["polygon"]);
  const [availableNetworks, setAvailableNetworks] = useState<
    { id: string; label: string; enabled: boolean }[]
  >([]);
  const [configMessage, setConfigMessage] = useState("");
  const [wallet, setWallet] = useState<{
    address: string;
    verified: boolean;
    networks: string[];
  } | null>(null);
  const [summary, setSummary] = useState({
    totalEarnedUsd: 0,
    confirmedTransactions: 0,
    pendingAmountUsd: 0,
    pendingTransactions: 0,
    thisMonthUsd: 0,
  });
  const [settings, setSettings] = useState({ creatorRoyaltyPercent: 90, platformFeePercent: 10 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadDashboard = useCallback(async (p: Period = "30d") => {
    try {
      const res = await api.get(`/writer/wallet-royalties/dashboard?period=${p}`);
      const d = res.data.dashboard;
      setWallet(d.wallet);
      setSummary(d.summary);
      setActivity(d.activity || []);
      if (d.settings) setSettings(d.settings);
      if (d.config?.message) setConfigMessage(d.config.message);
      if (d.config?.networks) setAvailableNetworks(d.config.networks);
      if (d.wallet?.networks?.length) setNetworks(d.wallet.networks);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load dashboard.");
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/wallet-royalties/config").then((res) => {
      if (res.data.config?.message) setConfigMessage(res.data.config.message);
      if (res.data.config?.networks) setAvailableNetworks(res.data.config.networks);
    });
    void loadDashboard("30d");
  }, [loadDashboard]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const connectAndVerify = async () => {
    setBusy(true);
    setError("");
    try {
      const challengeRes = await api.get("/writer/wallet-royalties/challenge");
      const { nonce, message } = challengeRes.data.challenge;

      let address = "";
      let signature = "";

      if (window.ethereum?.request) {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        address = accounts?.[0] || "";
        if (!address) throw new Error("No account returned.");
        try {
          signature = (await window.ethereum.request({
            method: "personal_sign",
            params: [message, address],
          })) as string;
        } catch {
          // User rejected sign — fall through to demo confirm for simulation UX
          signature = `demo_sig_${nonce}`;
          showToast("Signature skipped — demo verify used");
        }
      } else {
        address = `0xDEMO${crypto.randomUUID().replace(/-/g, "").slice(0, 36)}`;
        signature = `demo_sig_${nonce}`;
        showToast("Demo wallet linked (no MetaMask)");
      }

      const res = await api.post("/writer/wallet-royalties/wallet/link", {
        address,
        signature,
        nonce,
        networks,
      });
      setWallet(res.data.wallet);
      await loadDashboard(period);
      showToast("Wallet verified & linked");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Connect failed.");
    } finally {
      setBusy(false);
    }
  };

  const changeWallet = async () => {
    setBusy(true);
    try {
      await api.delete("/writer/wallet-royalties/wallet");
      setWallet(null);
      setActivity([]);
      setSummary({
        totalEarnedUsd: 0,
        confirmedTransactions: 0,
        pendingAmountUsd: 0,
        pendingTransactions: 0,
        thisMonthUsd: 0,
      });
      showToast("Wallet unlinked — history stays with the old address");
    } catch (err: any) {
      setError(err.response?.data?.error || "Unlink failed.");
    } finally {
      setBusy(false);
    }
  };

  const seedDemo = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/wallet-royalties/demo/seed");
      await loadDashboard(period);
      showToast(res.data.seeded ? "Demo activity loaded" : res.data.message || "Done");
    } catch (err: any) {
      setError(err.response?.data?.error || "Seed failed.");
    } finally {
      setBusy(false);
    }
  };

  const openDetail = async (item: Activity) => {
    setBusy(true);
    try {
      const res = await api.get(`/writer/wallet-royalties/transactions/${item.id}`);
      setSelected(res.data.transaction);
      setStep("detail");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load transaction.");
    } finally {
      setBusy(false);
    }
  };

  const periodLabel =
    period === "7d" ? "7d" : period === "90d" ? "90d" : period === "all" ? "all time" : "30d";

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "detail") {
            setStep("dashboard");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "detail" ? "Wallet Royalties" : "Web3 Writing"}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Wallet Royalties</h2>
          <p className="mt-1 text-sm text-[#909090]">Track earnings paid to a linked wallet</p>
        </div>
      </div>

      {configMessage && (
        <div className="rounded-xl border border-[#333] bg-[#161616] px-4 py-3 text-xs text-[#909090]">
          {configMessage}
        </div>
      )}

      {toast && (
        <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-2 text-sm text-[#52C07A]">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === "detail" && selected && (
        <div className="space-y-4 rounded-2xl border border-[#242424] bg-[#161616] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
            Transaction
          </p>
          <h3 className="font-serif text-xl text-white">{selected.title}</h3>
          <div className="space-y-2 text-sm text-[#F0EBE0]">
            {selected.storyTitle && (
              <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
                <span className="text-[#909090]">Story</span>
                <span>{selected.storyTitle}</span>
              </div>
            )}
            {selected.chapterLabel && (
              <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
                <span className="text-[#909090]">Chapter</span>
                <span>{selected.chapterLabel}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
              <span className="text-[#909090]">Creator amount</span>
              <span className="text-[#52C07A]">{money(selected.creatorAmountUsd)}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
              <span className="text-[#909090]">Gross / fee</span>
              <span>
                {money(selected.grossAmountUsd)} / {money(selected.platformFeeUsd)}
              </span>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
              <span className="text-[#909090]">Date</span>
              <span>{formatDate(selected.paidAt)}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
              <span className="text-[#909090]">Wallet</span>
              <span>{shortAddr(selected.walletAddress)}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
              <span className="text-[#909090]">Network</span>
              <span>{selected.network}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#242424] py-2">
              <span className="text-[#909090]">Status</span>
              <span>
                {selected.status === "confirmed"
                  ? "✓ Confirmed"
                  : selected.status === "pending"
                    ? "⏳ Pending"
                    : "✗ Failed"}
              </span>
            </div>
            <div className="py-2">
              <span className="text-[#909090]">Transaction</span>
              <p className="mt-1 break-all text-xs text-[#606060]">{selected.txHash}</p>
            </div>
          </div>
          {selected.explorerUrl ? (
            <a
              href={selected.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gd)] px-4 py-2.5 text-sm font-bold text-zinc-950"
            >
              <ExternalLink size={14} /> View on Explorer
            </a>
          ) : (
            <p className="text-center text-[11px] text-[#606060]">
              Demo tx — no public explorer link
            </p>
          )}
        </div>
      )}

      {step === "dashboard" && (
        <div className="space-y-5">
          {!wallet ? (
            <div className="space-y-4 rounded-2xl border border-[#242424] bg-[#161616] p-5">
              <p className="text-sm text-[#909090]">No wallet connected</p>
              <div>
                <p className={labelClass}>Networks</p>
                <div className="flex flex-wrap gap-2">
                  {(availableNetworks.length
                    ? availableNetworks
                    : [
                        { id: "polygon", label: "Polygon", enabled: true },
                        { id: "ethereum", label: "Ethereum", enabled: true },
                        { id: "base", label: "Base", enabled: true },
                      ]
                  ).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      disabled={n.enabled === false}
                      className={pill(networks.includes(n.id))}
                      onClick={() =>
                        setNetworks((list) =>
                          list.includes(n.id)
                            ? list.filter((x) => x !== n.id)
                            : [...list, n.id]
                        )
                      }
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-[#606060]">
                Sign a message to confirm ownership — no spend / no approval.
              </p>
              <Button className="w-full" onClick={() => void connectAndVerify()} disabled={busy}>
                {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Wallet size={14} className="mr-1.5" />}
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#242424] bg-[#161616] px-4 py-3">
                <div>
                  <p className="text-[11px] text-[#909090]">Linked wallet</p>
                  <p className="font-mono text-sm text-white">{shortAddr(wallet.address)}</p>
                </div>
                <span className="rounded-full bg-[#52C07A]/15 px-2.5 py-1 text-[11px] font-semibold text-[#52C07A]">
                  Connected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void changeWallet()} disabled={busy}>
                  Change Wallet
                </Button>
                <Button variant="secondary" onClick={() => void connectAndVerify()} disabled={busy}>
                  Re-verify
                </Button>
                {activity.length === 0 && (
                  <Button variant="secondary" onClick={() => void seedDemo()} disabled={busy}>
                    Load demo activity
                  </Button>
                )}
              </div>
            </>
          )}

          <div>
            <p className={labelClass}>Period</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["7d", "7 days"],
                  ["30d", "30 days"],
                  ["90d", "90 days"],
                  ["all", "All time"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={pill(period === id)}
                  onClick={() => {
                    setPeriod(id);
                    void loadDashboard(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
              <p className="font-serif text-2xl font-bold text-[var(--gd)]">
                {money(summary.totalEarnedUsd)}
              </p>
              <p className="mt-1 text-[11px] text-[#909090]">
                Paid to wallet ({periodLabel}) · confirmed
              </p>
            </div>
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
              <p className="font-serif text-2xl font-bold text-[var(--gd)]">
                {summary.confirmedTransactions}
              </p>
              <p className="mt-1 text-[11px] text-[#909090]">Confirmed transactions</p>
            </div>
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
              <p className="font-serif text-xl font-bold text-amber-400">
                {money(summary.pendingAmountUsd)}
              </p>
              <p className="mt-1 text-[11px] text-[#909090]">
                Pending ({summary.pendingTransactions})
              </p>
            </div>
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
              <p className="font-serif text-xl font-bold text-white">
                {money(summary.thisMonthUsd)}
              </p>
              <p className="mt-1 text-[11px] text-[#909090]">This month (confirmed)</p>
            </div>
          </div>

          <p className="text-[11px] text-[#606060]">
            Split rule: creator {settings.creatorRoyaltyPercent}% · platform{" "}
            {settings.platformFeePercent}% (admin-configurable; amounts from backend only)
          </p>

          <div>
            <p className={labelClass}>Recent activity</p>
            {activity.length === 0 ? (
              <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
                {wallet
                  ? "No royalty activity for this wallet in this period."
                  : "Connect a wallet to see earnings."}
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#242424] bg-[#161616]">
                {activity.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => void openDetail(a)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[#1c1c1c] ${
                      i > 0 ? "border-t border-[#242424]" : ""
                    }`}
                  >
                    <div>
                      <div className="text-sm text-[#F0EBE0]">{a.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#606060]">
                        {a.status === "confirmed"
                          ? "✓ Confirmed"
                          : a.status === "pending"
                            ? "⏳ Pending"
                            : "Failed"}{" "}
                        · {formatDate(a.paidAt)}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-sm font-semibold ${
                        a.status === "confirmed" ? "text-[#52C07A]" : "text-amber-400"
                      }`}
                    >
                      +{money(a.creatorAmountUsd)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

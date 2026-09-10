"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Loader2,
  RectangleHorizontal,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Tab = "set-gate" | "my-gates" | "reader";

type Novel = { id: string; name: string; type?: string };
type Chapter = { id: string; title: string; content?: string };
type Token = {
  id: string;
  name: string;
  label: string;
  standard: string;
  contractAddress: string;
  network: string;
  getTokenUrl?: string;
};
type Gate = {
  id?: string;
  projectId: string;
  projectName: string;
  chapterId: string;
  chapterTitle: string;
  tokenId: string;
  tokenName: string;
  standard: string;
  network: string;
  accessPolicy: string;
  status: string;
  getTokenUrl?: string;
  contractAddress?: string;
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

export default function TokenGatedWorkspace({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>("set-gate");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [projectId, setProjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [accessPolicy, setAccessPolicy] = useState<"current-ownership" | "one-time-unlock">(
    "current-ownership"
  );
  const [configMessage, setConfigMessage] = useState("");
  const [previewGate, setPreviewGate] = useState(false);

  // Reader preview
  const [readerProjectId, setReaderProjectId] = useState("");
  const [readerChapterId, setReaderChapterId] = useState("");
  const [readerChapters, setReaderChapters] = useState<Chapter[]>([]);
  const [wallet, setWallet] = useState("");
  const [verifyState, setVerifyState] = useState<
    "idle" | "checking" | "owned" | "not-owned" | "unlocked" | "public"
  >("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [gateInfo, setGateInfo] = useState<any>(null);
  const [chapterContent, setChapterContent] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadGates = useCallback(async () => {
    try {
      const res = await api.get("/writer/token-gate/gates");
      setGates(res.data.gates || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/token-gate/config").then((res) => {
      setConfigMessage(res.data.config?.message || "");
    });
    void api.get("/writer/token-gate/tokens").then((res) => {
      const list = res.data.tokens || [];
      setTokens(list);
      if (list[0]) setTokenId(list[0].id);
    });
    void api.get("/projects").then((res) => {
      const list = (res.data || []).filter((p: Novel) => p.type === "novel");
      setNovels(list);
    });
    void loadGates();
  }, [loadGates]);

  useEffect(() => {
    if (!projectId) {
      setChapters([]);
      setChapterId("");
      return;
    }
    void api.get(`/projects/${projectId}/chapters`).then((res) => {
      const list = res.data || [];
      setChapters(list);
      setChapterId(list[0]?.id || "");
    });
  }, [projectId]);

  useEffect(() => {
    if (!readerProjectId) {
      setReaderChapters([]);
      setReaderChapterId("");
      return;
    }
    void api.get(`/projects/${readerProjectId}/chapters`).then((res) => {
      const list = res.data || [];
      setReaderChapters(list);
      setReaderChapterId(list[0]?.id || "");
    });
  }, [readerProjectId]);

  useEffect(() => {
    setVerifyState("idle");
    setVerifyMessage("");
    setGateInfo(null);
    setChapterContent("");
    if (!readerProjectId || !readerChapterId) return;
    void api
      .get(`/writer/token-gate/access/${readerProjectId}/${readerChapterId}`)
      .then((res) => {
        if (!res.data.gated) {
          setVerifyState("public");
          const ch = readerChapters.find((c) => c.id === readerChapterId);
          setChapterContent(ch?.content || "");
        } else {
          setGateInfo(res.data.gate);
          setVerifyState("idle");
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [readerProjectId, readerChapterId, readerChapters]);

  const selectedToken = tokens.find((t) => t.id === tokenId);
  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const selectedNovel = novels.find((n) => n.id === projectId);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const setGate = async () => {
    if (!projectId || !chapterId || !tokenId) {
      setError("Select story, chapter, and token.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/writer/token-gate/gates", {
        projectId,
        chapterId,
        tokenId,
        accessPolicy,
        status: "active",
      });
      await loadGates();
      setPreviewGate(false);
      showToast("Gate saved");
      setTab("my-gates");
    } catch (err: any) {
      setError(err.response?.data?.error || "Set gate failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleGate = async (g: Gate) => {
    try {
      await api.patch(`/writer/token-gate/gates/${g.projectId}/${g.chapterId}`, {
        status: g.status === "active" ? "disabled" : "active",
      });
      await loadGates();
      showToast(g.status === "active" ? "Gate disabled" : "Gate enabled");
    } catch (err: any) {
      setError(err.response?.data?.error || "Update failed.");
    }
  };

  const deleteGate = async (g: Gate) => {
    try {
      await api.delete(`/writer/token-gate/gates/${g.projectId}/${g.chapterId}`);
      await loadGates();
      showToast("Gate removed");
    } catch (err: any) {
      setError(err.response?.data?.error || "Remove failed.");
    }
  };

  const connectWallet = async () => {
    setError("");
    try {
      if (window.ethereum?.request) {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (accounts?.[0]) {
          setWallet(accounts[0]);
          showToast("Wallet connected");
          return;
        }
      }
      const demo = `0xDEMO${crypto.randomUUID().replace(/-/g, "").slice(0, 34)}`;
      setWallet(demo);
      showToast("Demo wallet linked");
    } catch (err: any) {
      setError(err?.message || "Wallet connection failed.");
    }
  };

  const registerAsHolder = async () => {
    if (!gateInfo?.tokenName || !wallet) return;
    // Find token id from gates list or gateInfo - gate has token via verify
    const g = gates.find(
      (x) => x.projectId === readerProjectId && x.chapterId === readerChapterId
    );
    const tid = g?.tokenId || tokens.find((t) => t.name === gateInfo.tokenName)?.id;
    if (!tid) {
      setError("Token not found for demo holder registration.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/writer/token-gate/tokens/${tid}/demo-holder`, {
        walletAddress: wallet,
      });
      showToast("Wallet added as demo holder");
      await verifyOwnership();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to register holder.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOwnership = async () => {
    if (!wallet || !readerProjectId || !readerChapterId) return;
    setVerifyState("checking");
    setVerifyMessage("Checking token ownership…");
    setError("");
    try {
      const res = await api.post("/writer/token-gate/verify", {
        projectId: readerProjectId,
        chapterId: readerChapterId,
        walletAddress: wallet,
      });
      const result = res.data.result;
      setGateInfo(result.gate || result.token || gateInfo);
      setVerifyMessage(result.message || "");
      if (result.unlocked) {
        setVerifyState(result.reason === "public" ? "public" : "owned");
        const ch = readerChapters.find((c) => c.id === readerChapterId);
        setChapterContent(ch?.content || "");
      } else {
        setVerifyState("not-owned");
        setGateInfo({ ...(result.gate || {}), ...(result.token || {}) });
      }
    } catch (err: any) {
      setVerifyState("idle");
      setError(err.response?.data?.error || "Verification failed.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => onBack?.()}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        Web3 Writing
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
          <RectangleHorizontal size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Token-Gated Release</h2>
          <p className="mt-1 text-sm text-[#909090]">Unlock chapters by token ownership</p>
        </div>
      </div>

      {configMessage && (
        <div className="rounded-xl border border-[#333] bg-[#161616] px-4 py-3 text-xs text-[#909090]">
          <span className="font-semibold text-[var(--gd)]">Demo verify mode. </span>
          {configMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={pill(tab === "set-gate")} onClick={() => setTab("set-gate")}>
          Set gate
        </button>
        <button type="button" className={pill(tab === "my-gates")} onClick={() => setTab("my-gates")}>
          My gates
        </button>
        <button type="button" className={pill(tab === "reader")} onClick={() => setTab("reader")}>
          Reader preview
        </button>
      </div>

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

      {tab === "set-gate" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Select Story</span>
            <select
              className={inputClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Choose a novel…</option>
              {novels.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Select Chapter</span>
            <select
              className={inputClass}
              value={chapterId}
              disabled={!projectId}
              onChange={(e) => setChapterId(e.target.value)}
            >
              {!projectId && <option value="">Select a story first</option>}
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Required Token</span>
            <select
              className={inputClass}
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            >
              {tokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {selectedToken && (
              <div className="mt-2 space-y-1 text-[11px] text-[#606060]">
                <div>Network: {selectedToken.network}</div>
                <div className="break-all">Contract: {selectedToken.contractAddress}</div>
                <div>Standard: {selectedToken.standard}</div>
              </div>
            )}
          </label>

          <div>
            <p className={labelClass}>Access rule</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pill(accessPolicy === "current-ownership")}
                onClick={() => setAccessPolicy("current-ownership")}
              >
                Current ownership
              </button>
              <button
                type="button"
                className={pill(accessPolicy === "one-time-unlock")}
                onClick={() => setAccessPolicy("one-time-unlock")}
              >
                One-time unlock
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#606060]">
              Current ownership = access lost if token is transferred. One-time = stays unlocked after
              first verify.
            </p>
          </div>

          {!previewGate ? (
            <Button
              className="w-full"
              onClick={() => {
                if (!projectId || !chapterId || !tokenId) {
                  setError("Select story, chapter, and token.");
                  return;
                }
                setError("");
                setPreviewGate(true);
              }}
            >
              Set gate
            </Button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#161616] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
                Confirm gate
              </p>
              <div className="space-y-2 text-sm text-[#F0EBE0]">
                <div className="flex justify-between gap-2">
                  <span className="text-[#909090]">Story</span>
                  <span>{selectedNovel?.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#909090]">Chapter</span>
                  <span>{selectedChapter?.title}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#909090]">Token</span>
                  <span>{selectedToken?.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#909090]">Access</span>
                  <span>Token holder only</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#909090]">Status</span>
                  <span>Active</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setPreviewGate(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void setGate()} disabled={busy}>
                  {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                  Save Gate Rules
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "my-gates" && (
        <div className="space-y-3">
          {gates.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No gates set yet.
            </p>
          ) : (
            gates.map((g) => (
              <div
                key={g.id || `${g.projectId}-${g.chapterId}`}
                className="rounded-2xl border border-[#242424] bg-[#161616] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-white">{g.projectName}</div>
                    <div className="mt-1 text-sm text-[#c8c4bc]">
                      🔒 {g.chapterTitle} — {g.tokenName}
                    </div>
                    <div className="mt-1 text-[11px] text-[#606060]">
                      {g.status} · {g.accessPolicy} · {g.network}
                    </div>
                  </div>
                  <Lock size={16} className="text-[var(--gd)]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void toggleGate(g)}>
                    {g.status === "active" ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="secondary" onClick={() => void deleteGate(g)}>
                    <Trash2 size={12} className="mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "reader" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Story</span>
            <select
              className={inputClass}
              value={readerProjectId}
              onChange={(e) => setReaderProjectId(e.target.value)}
            >
              <option value="">Choose…</option>
              {novels.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Chapter</span>
            <select
              className={inputClass}
              value={readerChapterId}
              disabled={!readerProjectId}
              onChange={(e) => setReaderChapterId(e.target.value)}
            >
              {readerChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          {verifyState === "public" && (
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
              <p className="text-sm text-[#52C07A]">Public chapter — no token required.</p>
              <div
                className="mt-4 max-h-[280px] overflow-y-auto font-serif text-sm text-[#F0EBE0] whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: chapterContent || "<p class='text-[#606060]'>Empty chapter.</p>",
                }}
              />
            </div>
          )}

          {verifyState !== "public" && readerChapterId && (
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4">
              <div className="flex items-center gap-2 text-[var(--gd)]">
                <Lock size={18} />
                <p className="font-semibold text-white">
                  {readerChapters.find((c) => c.id === readerChapterId)?.title || "Chapter"}
                </p>
              </div>

              {(verifyState === "idle" || verifyState === "checking") && (
                <>
                  <p className="text-sm text-[#909090]">
                    🔒 Token Required
                    <br />
                    This chapter is available to{" "}
                    {gateInfo?.tokenName || "token"} holders.
                  </p>
                  {!wallet ? (
                    <Button className="w-full" onClick={() => void connectWallet()}>
                      <Wallet size={14} className="mr-1.5" /> Connect Wallet
                    </Button>
                  ) : (
                    <>
                      <p className="text-sm text-[#c8c4bc]">Wallet: {shortAddr(wallet)}</p>
                      <Button
                        className="w-full"
                        onClick={() => void verifyOwnership()}
                        disabled={busy || verifyState === "checking"}
                      >
                        {verifyState === "checking" ? (
                          <Loader2 size={14} className="mr-1.5 animate-spin" />
                        ) : (
                          <Shield size={14} className="mr-1.5" />
                        )}
                        {verifyState === "checking" ? "Checking…" : "Check ownership"}
                      </Button>
                    </>
                  )}
                </>
              )}

              {verifyState === "owned" && (
                <>
                  <div className="flex items-center gap-2 text-[#52C07A]">
                    <CheckCircle2 size={18} />
                    <p className="font-semibold">Access Granted</p>
                  </div>
                  <p className="text-sm text-[#909090]">{verifyMessage}</p>
                  <div
                    className="max-h-[280px] overflow-y-auto font-serif text-sm text-[#F0EBE0] whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: chapterContent || "<p class='text-[#606060]'>Empty chapter.</p>",
                    }}
                  />
                </>
              )}

              {verifyState === "not-owned" && (
                <>
                  <div className="flex items-center gap-2 text-amber-400">
                    <Lock size={18} />
                    <p className="font-semibold text-white">Chapter Locked</p>
                  </div>
                  <p className="text-sm text-[#909090]">{verifyMessage}</p>
                  <div className="grid gap-2">
                    {gateInfo?.getTokenUrl && (
                      <a
                        href={gateInfo.getTokenUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-[var(--gd)] px-4 py-2.5 text-sm font-bold text-zinc-950"
                      >
                        Get the Token
                      </a>
                    )}
                    <Button variant="secondary" onClick={() => void connectWallet()}>
                      Try Another Wallet
                    </Button>
                    <Button variant="secondary" onClick={() => void registerAsHolder()} disabled={busy}>
                      Demo: mark this wallet as holder
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

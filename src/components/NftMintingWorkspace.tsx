"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  FolderOpen,
  Hexagon,
  Loader2,
  Share2,
  Wallet,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Step =
  | "form"
  | "wallet"
  | "confirm"
  | "minting"
  | "success"
  | "failed"
  | "gallery";

type Novel = { id: string; name: string; type?: string; genre?: string };
type Chapter = { id: string; title: string; content?: string };

type ContentOption = {
  id: string;
  kind: "chapter" | "cover" | "special";
  label: string;
};

type MintConfig = {
  mode: "simulation" | "live";
  contractConfigured: boolean;
  message: string;
  networks: { id: string; label: string; enabled: boolean }[];
  defaultNetwork: string;
};

type Collectible = {
  id?: string;
  projectName: string;
  contentLabel: string;
  editionNumber: number;
  editionSize: number;
  network: string;
  walletAddress: string;
  metadata?: { title?: string; description?: string; creator?: string; genre?: string };
  tokenId: string;
  txHash: string;
  status: string;
  mode: string;
  errorMessage?: string;
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

export default function NftMintingWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("form");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [projectId, setProjectId] = useState("");
  const [contentKey, setContentKey] = useState("");
  const [editionSize, setEditionSize] = useState(100);
  const [network, setNetwork] = useState("polygon");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creator, setCreator] = useState("");
  const [genre, setGenre] = useState("");
  const [supply, setSupply] = useState({ mintedCount: 0, editionSize: 0, remaining: 0, exists: false });
  const [config, setConfig] = useState<MintConfig | null>(null);
  const [wallet, setWallet] = useState("");
  const [collectible, setCollectible] = useState<Collectible | null>(null);
  const [gallery, setGallery] = useState<Collectible[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const contentOptions: ContentOption[] = useMemo(() => {
    const opts: ContentOption[] = chapters.map((c) => ({
      id: c.id,
      kind: "chapter",
      label: c.title || "Chapter",
    }));
    opts.push({ id: "cover", kind: "cover", label: "Cover" });
    opts.push({ id: "special", kind: "special", label: "Special Edition" });
    return opts;
  }, [chapters]);

  const selectedContent = contentOptions.find(
    (c) => `${c.kind}:${c.id}` === contentKey
  );

  const loadGallery = useCallback(async () => {
    try {
      const res = await api.get("/writer/nft-mint/collectibles");
      setGallery(res.data.collectibles || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/nft-mint/config").then((res) => {
      setConfig(res.data.config);
      const enabled = (res.data.config?.networks || []).find((n: any) => n.enabled);
      if (enabled) setNetwork(enabled.id);
      else if (res.data.config?.defaultNetwork && res.data.config.defaultNetwork !== "demo") {
        setNetwork(res.data.config.defaultNetwork);
      }
    });
    void api.get("/projects").then((res) => {
      const list = (res.data || []).filter((p: Novel) => p.type === "novel");
      setNovels(list);
    });
    void loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    if (!projectId) {
      setChapters([]);
      setContentKey("");
      return;
    }
    void api.get(`/projects/${projectId}/chapters`).then((res) => {
      const list = res.data || [];
      setChapters(list);
      if (list[0]) setContentKey(`chapter:${list[0].id}`);
      else setContentKey("cover:cover");
    });
    const novel = novels.find((n) => n.id === projectId);
    if (novel?.genre) setGenre(String(novel.genre));
  }, [projectId, novels]);

  useEffect(() => {
    if (!projectId || !selectedContent) return;
    const t = setTimeout(() => {
      void api
        .post("/writer/nft-mint/preview", {
          projectId,
          contentId: selectedContent.id,
          contentKind: selectedContent.kind,
          creator: creator || undefined,
          genre: genre || undefined,
          title: title || undefined,
          description: description || undefined,
        })
        .then((res) => {
          const m = res.data.preview?.metadata;
          if (m) {
            if (!title) setTitle(m.title || "");
            if (!description) setDescription(m.description || "");
            if (!creator) setCreator(m.creator || "");
            if (!genre) setGenre(m.genre || "");
          }
          if (res.data.supply) setSupply(res.data.supply);
        })
        .catch(() => {
          /* ignore preview errors while typing */
        });
    }, 350);
    return () => clearTimeout(t);
    // intentionally omit title/description to avoid loops — refresh when selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, contentKey, selectedContent?.id, selectedContent?.kind]);

  const refreshPreview = async () => {
    if (!projectId || !selectedContent) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/nft-mint/preview", {
        projectId,
        contentId: selectedContent.id,
        contentKind: selectedContent.kind,
        creator,
        genre,
        title,
        description,
      });
      const m = res.data.preview?.metadata;
      if (m) {
        setTitle(m.title || title);
        setDescription(m.description || description);
        setCreator(m.creator || creator);
        setGenre(m.genre || genre);
      }
      if (res.data.supply) setSupply(res.data.supply);
    } catch (err: any) {
      setError(err.response?.data?.error || "Preview failed.");
    } finally {
      setBusy(false);
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
      // Demo wallet when no extension — still allows simulation mint
      const demo = `0xDEMO${crypto.randomUUID().replace(/-/g, "").slice(0, 34)}`;
      setWallet(demo);
      showToast("Demo wallet linked (no MetaMask detected)");
    } catch (err: any) {
      setError(err?.message || "Wallet connection failed.");
    }
  };

  const startMintFlow = async () => {
    if (!projectId || !selectedContent) {
      setError("Select a story and chapter/cover.");
      return;
    }
    if (editionSize < 1) {
      setError("Edition size must be at least 1.");
      return;
    }
    await refreshPreview();
    if (!wallet) {
      setStep("wallet");
      return;
    }
    setStep("confirm");
  };

  const confirmMint = async () => {
    if (!selectedContent || !wallet) return;
    setStep("minting");
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/nft-mint/mint", {
        projectId,
        contentId: selectedContent.id,
        contentKind: selectedContent.kind,
        editionSize,
        network,
        walletAddress: wallet,
        creator,
        genre,
        title,
        description,
      });
      const c = res.data.collectible as Collectible;
      setCollectible(c);
      await loadGallery();
      if (c.status === "failed") {
        setError(c.errorMessage || "Mint failed.");
        setStep("failed");
      } else {
        setStep("success");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Mint failed.");
      setStep("failed");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
    } catch {
      setError("Copy failed.");
    }
  };

  const remaining =
    supply.exists && supply.editionSize > 0
      ? `${supply.mintedCount} / ${supply.editionSize} minted · ${supply.remaining} left`
      : `${editionSize} / ${editionSize} available`;

  const pill = (active: boolean, disabled?: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      disabled
        ? "cursor-not-allowed border border-[#222] text-[#555]"
        : active
          ? "bg-[var(--gd)] text-zinc-950"
          : "border border-[#333] text-[#c8c4bc]"
    }`;

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "gallery" || step === "success" || step === "failed") {
            setStep("form");
            return;
          }
          if (step === "confirm" || step === "wallet") {
            setStep("form");
            return;
          }
          if (step === "minting") return;
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "form" ? "Web3 Writing" : "NFT Chapter Minting"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <Hexagon size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">NFT Chapter Minting</h2>
            <p className="mt-1 text-sm text-[#909090]">Mint a chapter or cover as a collectible</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("gallery");
            void loadGallery();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
        >
          <FolderOpen size={12} /> My Collectibles
        </button>
      </div>

      {config && (
        <div className="rounded-xl border border-[#333] bg-[#161616] px-4 py-3 text-xs text-[#909090]">
          {config.mode === "simulation" ? (
            <span>
              <span className="font-semibold text-[var(--gd)]">Demo mint mode. </span>
              {config.message}
            </span>
          ) : (
            config.message
          )}
        </div>
      )}

      {toast && (
        <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-2 text-sm text-[#52C07A]">
          {toast}
        </div>
      )}
      {error && step !== "failed" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === "gallery" && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
            My Collectibles
          </p>
          {gallery.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No minted collectibles yet.
            </p>
          ) : (
            gallery.map((g) => (
              <button
                key={g.id}
                type="button"
                className="w-full rounded-2xl border border-[#242424] bg-[#161616] p-4 text-left hover:border-[#333]"
                onClick={() => {
                  setCollectible(g);
                  setStep("success");
                }}
              >
                <div className="font-medium text-white">{g.contentLabel}</div>
                <div className="mt-1 text-xs text-[#909090]">
                  #{String(g.editionNumber).padStart(3, "0")} / {g.editionSize} · {g.projectName}
                </div>
                <div className="mt-1 text-[11px] text-[#606060]">
                  {g.mode === "simulation" ? "Demo" : g.network} · {shortAddr(g.walletAddress)}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {step === "form" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Select Story</span>
            <select
              className={inputClass}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTitle("");
                setDescription("");
              }}
            >
              <option value="">Choose a novel…</option>
              {novels.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
            {novels.length === 0 && (
              <p className="mt-1.5 text-[11px] text-[#606060]">
                No novels found. Create one in Writer&apos;s World first.
              </p>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>Select Content</span>
            <select
              className={inputClass}
              value={contentKey}
              disabled={!projectId}
              onChange={(e) => {
                setContentKey(e.target.value);
                setTitle("");
                setDescription("");
              }}
            >
              {!projectId && <option value="">Select a story first</option>}
              {contentOptions.map((c) => (
                <option key={`${c.kind}:${c.id}`} value={`${c.kind}:${c.id}`}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              NFT Details
            </p>
            <p className="text-[11px] text-[#606060]">
              Metadata uses a content URI reference — full chapter text is not put on-chain.
            </p>
            <label className="block">
              <span className={labelClass}>Title</span>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelClass}>Description</span>
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Creator</span>
              <input className={inputClass} value={creator} onChange={(e) => setCreator(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelClass}>Genre</span>
              <input className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)} />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Edition size</span>
            <input
              type="number"
              min={1}
              max={10000}
              className={inputClass}
              value={editionSize}
              onChange={(e) => setEditionSize(Number(e.target.value) || 1)}
              disabled={supply.exists && supply.mintedCount > 0}
            />
            <p className="mt-1.5 text-[11px] text-[#606060]">Available: {remaining}</p>
          </label>

          <div>
            <p className={labelClass}>Blockchain</p>
            <div className="flex flex-wrap gap-2">
              {(config?.networks || [
                { id: "polygon", label: "Polygon", enabled: false },
                { id: "ethereum", label: "Ethereum", enabled: false },
                { id: "base", label: "Base", enabled: false },
              ]).map((n) => {
                const liveEnabled = Boolean(config?.contractConfigured && n.enabled);
                const selectable = !config?.contractConfigured || liveEnabled;
                return (
                  <button
                    key={n.id}
                    type="button"
                    disabled={!selectable && Boolean(config?.contractConfigured)}
                    className={pill(network === n.id, !selectable && Boolean(config?.contractConfigured))}
                    onClick={() => selectable && setNetwork(n.id)}
                  >
                    {n.label}
                    {!liveEnabled && config?.mode === "simulation" ? " (demo)" : ""}
                  </button>
                );
              })}
            </div>
            {!config?.contractConfigured && (
              <p className="mt-2 text-[11px] text-[#606060]">
                Live networks stay inactive until NFT_NETWORK + NFT_CONTRACT_ADDRESS are set. Demo mint
                still records collectibles and tracks edition supply.
              </p>
            )}
          </div>

          {wallet && (
            <div className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-3 text-sm text-[#c8c4bc]">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-[var(--gd)]" />
                Wallet: {shortAddr(wallet)}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={() => void startMintFlow()} disabled={busy || !projectId}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Mint as collectible
          </Button>
        </div>
      )}

      {step === "wallet" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Connect Wallet
            </p>
            <p className="mt-2 text-sm text-[#909090]">
              Connect MetaMask if available, or continue with a demo wallet for simulation mints.
            </p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => void connectWallet()}>
                <Wallet size={14} className="mr-1.5" /> Connect Wallet
              </Button>
              <p className="text-center text-[11px] text-[#606060]">MetaMask · WalletConnect-ready UI</p>
            </div>
            {wallet && (
              <>
                <p className="mt-4 text-sm text-[#F0EBE0]">Connected: {shortAddr(wallet)}</p>
                <Button className="mt-3 w-full" onClick={() => setStep("confirm")}>
                  Continue to confirm
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Confirm Mint
            </p>
            <div className="text-sm text-[#F0EBE0]">
              <div className="flex justify-between gap-3 border-b border-[#242424] py-2">
                <span className="text-[#909090]">NFT</span>
                <span className="text-right">{title}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-[#242424] py-2">
                <span className="text-[#909090]">Edition</span>
                <span>{editionSize}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-[#242424] py-2">
                <span className="text-[#909090]">Network</span>
                <span>
                  {config?.mode === "simulation" ? `Demo (${network})` : network}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-b border-[#242424] py-2">
                <span className="text-[#909090]">Wallet</span>
                <span>{shortAddr(wallet)}</span>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <span className="text-[#909090]">Est. network fee</span>
                <span>{config?.mode === "simulation" ? "$0 (demo)" : "Wallet will show fee"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep("form")}>
              Cancel
            </Button>
            <Button onClick={() => void confirmMint()} disabled={busy}>
              Confirm & Mint
            </Button>
          </div>
        </div>
      )}

      {step === "minting" && (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] px-4 py-12 text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-[var(--gd)]" size={28} />
          <p className="font-medium text-white">Preparing NFT…</p>
          <p className="mt-2 text-sm text-[#909090]">Recording metadata and edition supply</p>
        </div>
      )}

      {step === "failed" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-semibold text-red-300">Mint failed</p>
            <p className="mt-2 text-sm text-red-200/80">{error || "Something went wrong."}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep("form")}>
              Back
            </Button>
            <Button onClick={() => void confirmMint()}>Retry</Button>
          </div>
        </div>
      )}

      {step === "success" && collectible && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#52C07A]/30 bg-[#52C07A]/10 p-5">
            <div className="flex items-center gap-2 text-[#52C07A]">
              <CheckCircle2 size={20} />
              <p className="font-semibold">NFT Minted Successfully</p>
            </div>
            <p className="mt-3 font-serif text-xl text-white">
              {collectible.metadata?.title || collectible.projectName}
            </p>
            <p className="mt-1 text-sm text-[#909090]">{collectible.contentLabel}</p>
            <div className="mt-4 space-y-2 text-sm text-[#c8c4bc]">
              <div>
                Edition #{String(collectible.editionNumber).padStart(3, "0")} /{" "}
                {collectible.editionSize}
              </div>
              <div>Owner {shortAddr(collectible.walletAddress)}</div>
              <div className="break-all text-xs text-[#606060]">Token {collectible.tokenId}</div>
              <div className="break-all text-xs text-[#606060]">Tx {collectible.txHash}</div>
              {collectible.mode === "simulation" && (
                <p className="text-[11px] text-[var(--gd)]">Demo collectible — not on a public chain yet.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => void copyText(collectible.tokenId, "Token ID")}
            >
              <Copy size={14} className="mr-1.5" /> Token ID
            </Button>
            <Button
              variant="secondary"
              onClick={() => void copyText(collectible.txHash, "Transaction")}
            >
              <Copy size={14} className="mr-1.5" /> Transaction
            </Button>
            <Button
              variant="secondary"
              className="col-span-2"
              onClick={() =>
                void copyText(
                  `${collectible.metadata?.title || collectible.projectName}\n${collectible.contentLabel}\n#${collectible.editionNumber}/${collectible.editionSize}`,
                  "Share text"
                )
              }
            >
              <Share2 size={14} className="mr-1.5" /> Share
            </Button>
            <Button className="col-span-2" onClick={() => setStep("gallery")}>
              View My Collectibles
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

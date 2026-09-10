"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  Check,
  Circle,
  FileText,
  Loader2,
  Plus,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import { ACTIVE_BRIEF_KEY } from "@/components/BriefBuilderWorkspace";

type DocType = "nda" | "brief" | "draft" | "final" | "invoice" | "other";

type HandoffDoc = {
  id: string;
  type: DocType;
  name: string;
  url: string;
  status?: string;
  uploadedAt: string;
};

type Progress = {
  done: number;
  total: number;
  percent: number;
  complete: boolean;
  milestones: { id: string; label: string; done: boolean }[];
};

type Project = {
  id?: string;
  bookId?: string | null;
  clientName: string;
  bookTitle: string;
  checked: Record<string, boolean>;
  reviewStatus: "waiting" | "approved" | "changes" | null;
  clientFeedback: string;
  invoiceAmount: number;
  invoiceStatus: "none" | "created" | "sent" | "paid";
  briefText: string;
  documents: HandoffDoc[];
  archived: boolean;
  progress: Progress;
};

type BookOption = {
  id: string;
  title: string;
  clientName?: string;
  mode?: string;
};

type SectionItem = { id: string; label: string };

type View = "list" | "project";

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const DELIVERY_SUMMARY = [
  { id: "nda_signed", label: "NDA signed" },
  { id: "brief_confirmed", label: "Brief confirmed with client" },
  { id: "ms_delivered", label: "Final manuscript delivered" },
  { id: "inv_sent", label: "Invoice sent" },
];

function apiOrigin() {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return base.replace(/\/api\/?$/, "");
}

function fileUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${apiOrigin()}${url}`;
}

export default function ClientHandoffWorkspace({
  onBack,
  onOpenBriefBuilder,
}: {
  onBack?: () => void;
  onOpenBriefBuilder?: () => void;
}) {
  const [view, setView] = useState<View>("list");
  const [projects, setProjects] = useState<Project[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Record<string, SectionItem[]>>({
    nda: [
      { id: "nda_sent", label: "NDA sent" },
      { id: "nda_signed", label: "NDA signed" },
      { id: "nda_uploaded", label: "NDA document uploaded" },
    ],
    brief: [
      { id: "brief_received", label: "Brief received" },
      { id: "brief_scope", label: "Scope confirmed" },
      { id: "brief_deadline", label: "Deadline confirmed" },
      { id: "brief_budget", label: "Budget confirmed" },
      { id: "brief_revisions", label: "Revision terms confirmed" },
    ],
    manuscript: [
      { id: "ms_draft", label: "Draft ready" },
      { id: "ms_internal", label: "Internal review complete" },
      { id: "ms_delivered", label: "Final manuscript delivered" },
      { id: "ms_received", label: "Client received" },
    ],
    invoice: [
      { id: "inv_created", label: "Invoice created" },
      { id: "inv_sent", label: "Invoice sent" },
      { id: "inv_paid", label: "Payment received" },
    ],
  });
  const [newClient, setNewClient] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefDraft, setBriefDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<DocType>("nda");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get("/writer/client-handoff/projects");
      setProjects(res.data.projects || []);
    } catch {
      setProjects([]);
    }
  }, []);

  const loadBooks = useCallback(async () => {
    try {
      const res = await api.get("/writer/self-interview/books", { params: { mode: "client" } });
      setBooks(res.data.books || []);
    } catch {
      setBooks([]);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    void loadBooks();
    void api.get("/writer/client-handoff/meta").then((res) => {
      setSections(res.data.sections || {});
    });
    try {
      const raw = sessionStorage.getItem("ink2wealth_client_handoff");
      if (raw) {
        const h = JSON.parse(raw);
        sessionStorage.removeItem("ink2wealth_client_handoff");
        if (h.bookId) {
          void openFromBook(h);
        }
      }
      const briefRaw = sessionStorage.getItem(ACTIVE_BRIEF_KEY);
      if (briefRaw && !raw) {
        const b = JSON.parse(briefRaw);
        if (b?.content || b?.text || b?.brief) {
          setBriefDraft(String(b.content || b.text || b.brief || ""));
          setNewClient(String(b.clientName || b.client || ""));
          setNewTitle(String(b.projectTitle || b.title || ""));
          showToast("Brief ready to attach — create or open a project");
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProjects, loadBooks]);

  const openFromBook = async (h: {
    bookId: string;
    clientName?: string;
    bookTitle?: string;
  }) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/client-handoff/projects", {
        bookId: h.bookId,
        clientName: h.clientName,
        bookTitle: h.bookTitle,
      });
      setProject(res.data.project);
      setBriefDraft(res.data.project.briefText || "");
      setView("project");
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not open project.");
    } finally {
      setBusy(false);
    }
  };

  const openProject = (p: Project) => {
    setProject(p);
    setBriefDraft(p.briefText || "");
    setEditingBrief(false);
    setView("project");
  };

  const createProject = async () => {
    if (!newClient.trim() || !newTitle.trim()) {
      setError("Enter client name and book title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/client-handoff/projects", {
        clientName: newClient.trim(),
        bookTitle: newTitle.trim(),
        briefText: briefDraft || undefined,
      });
      setProject(res.data.project);
      setView("project");
      setNewClient("");
      setNewTitle("");
      await loadProjects();
      showToast("Client project created");
    } catch (err: any) {
      setError(err.response?.data?.error || "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    if (!project?.id) return;
    const prev = project;
    try {
      const res = await api.patch(`/writer/client-handoff/projects/${project.id}`, body);
      setProject(res.data.project);
      setProjects((list) =>
        list.map((p) => (p.id === res.data.project.id ? res.data.project : p))
      );
    } catch (err: any) {
      setProject(prev);
      setError(err.response?.data?.error || "Save failed.");
    }
  };

  const toggle = async (itemId: string) => {
    if (!project) return;
    setProject({
      ...project,
      checked: { ...project.checked, [itemId]: !project.checked[itemId] },
    });
    await patch({ toggleItemId: itemId });
  };

  const startUpload = (type: DocType) => {
    setUploadType(type);
    fileRef.current?.click();
  };

  const onFile = async (file: File) => {
    if (!project?.id) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", uploadType);
      if (uploadType === "nda") fd.append("status", "signed");
      if (uploadType === "final") fd.append("status", "delivered");
      const res = await api.post(
        `/writer/client-handoff/projects/${project.id}/upload`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setProject(res.data.project);
      showToast("Document uploaded");
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveBrief = async () => {
    await patch({
      briefText: briefDraft,
      checked: { ...project!.checked, brief_received: true },
    });
    setEditingBrief(false);
    showToast("Brief saved");
  };

  const markComplete = async () => {
    if (!project?.progress.complete) {
      setError("Complete all milestones (NDA, brief, manuscript, approval, invoice, payment) first.");
      return;
    }
    await patch({ archived: true });
    showToast("Project archived");
    setView("list");
    await loadProjects();
  };

  const pct = project?.progress.percent ?? 0;

  const docByType = useMemo(() => {
    const map: Partial<Record<DocType, HandoffDoc>> = {};
    for (const d of project?.documents || []) map[d.type] = d;
    return map;
  }, [project]);

  const CheckRow = ({ id, label }: { id: string; label: string }) => {
    const on = !!project?.checked[id];
    return (
      <button
        type="button"
        onClick={() => void toggle(id)}
        className="flex w-full items-center gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3.5 text-left hover:border-[#333]"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            on
              ? "border-[var(--gd)] bg-[var(--gd)] text-zinc-950"
              : "border-[#606060] text-transparent"
          }`}
        >
          <Check size={12} strokeWidth={3} />
        </span>
        <span className={`text-sm ${on ? "text-[#c8c4bc] line-through" : "text-white"}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (view === "project") {
            setView("list");
            void loadProjects();
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {view === "list" ? "Nonfiction & Ghostwriting" : "Client Handoff"}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
          <Square size={18} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Client Handoff</h2>
          <p className="mt-1 text-sm text-[#909090]">NDAs, briefs, delivery checklists</p>
        </div>
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

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />

      {view === "list" && (
        <div className="space-y-4">
          <p className="text-sm text-[#F0EBE0]">Select project</p>

          {books.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#606060]">
                Client books
              </p>
              {books.map((b) => {
                const linked = projects.find((p) => p.bookId === b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      linked
                        ? openProject(linked)
                        : void openFromBook({
                            bookId: b.id,
                            clientName: b.clientName,
                            bookTitle: b.title,
                          })
                    }
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3.5 text-left hover:border-[#333]"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        Client — {b.clientName || "Client"}
                      </div>
                      <div className="mt-1 text-[11px] text-[#606060]">
                        “{b.title}”
                        {linked ? ` · ${linked.progress.percent}%` : " · Start handoff"}
                      </div>
                    </div>
                    {linked?.progress.complete ? (
                      <Check size={16} className="text-[#52C07A]" />
                    ) : (
                      <Circle size={16} className="text-[#606060]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {projects.filter((p) => !p.bookId || !books.some((b) => b.id === p.bookId)).length >
            0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#606060]">
                Handoff projects
              </p>
              {projects
                .filter((p) => !p.bookId || !books.some((b) => b.id === p.bookId))
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-2 rounded-xl border border-[#242424] bg-[#161616] p-3"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => openProject(p)}
                    >
                      <div className="text-sm text-white">Client — {p.clientName}</div>
                      <div className="mt-1 text-[11px] text-[#606060]">
                        “{p.bookTitle}” · {p.progress.percent}%
                      </div>
                    </button>
                    <button
                      type="button"
                      className="p-2 text-[#909090] hover:text-red-300"
                      onClick={async () => {
                        await api.delete(`/writer/client-handoff/projects/${p.id}`);
                        await loadProjects();
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-[#242424] bg-[#121212] p-4">
            <p className="text-xs text-[#909090]">+ New Client Project</p>
            <input
              className={inputClass}
              placeholder="Client name"
              value={newClient}
              onChange={(e) => setNewClient(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Book / project title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button className="w-full" disabled={busy} onClick={() => void createProject()}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plus size={14} className="mr-1.5" />}
              Create project
            </Button>
          </div>
        </div>
      )}

      {view === "project" && project && (
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Client
            </p>
            <h3 className="mt-1 font-serif text-xl font-bold text-white">
              {project.clientName} — {project.bookTitle}
            </h3>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-[#606060]">Project status</p>
                <p className="mt-1 font-serif text-3xl font-bold text-[var(--gd)]">{pct}%</p>
              </div>
              <p className="text-xs text-[#909090]">
                {project.progress.done}/{project.progress.total} milestones
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
              <div
                className="h-full rounded-full bg-[var(--gd)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Delivery checklist summary (matches screenshot) */}
          <div className="space-y-2">
            <p className="text-sm text-[#F0EBE0]">Delivery checklist</p>
            {DELIVERY_SUMMARY.map((item) => (
              <CheckRow key={item.id} id={item.id} label={item.label} />
            ))}
          </div>

          {/* NDA detail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#606060]">NDA</p>
              <span className="text-[11px] text-[var(--gd)]">
                {project.checked.nda_signed ? "Status: ✓ Signed" : "Status: Pending"}
              </span>
            </div>
            {(sections.nda || []).map((item) => (
              <CheckRow key={item.id} id={item.id} label={item.label} />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => startUpload("nda")}>
                <Upload size={14} className="mr-1.5" /> Upload NDA
              </Button>
              {docByType.nda ? (
                <a
                  href={fileUrl(docByType.nda.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-[#333] px-3 py-2 text-sm font-semibold text-[#c8c4bc]"
                >
                  View NDA
                </a>
              ) : (
                <Button variant="secondary" disabled>
                  View NDA
                </Button>
              )}
            </div>
          </div>

          {/* Brief */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#606060]">
                Client Brief
              </p>
              {onOpenBriefBuilder && (
                <button
                  type="button"
                  className="text-[11px] font-semibold text-[var(--gd)]"
                  onClick={onOpenBriefBuilder}
                >
                  Open Brief Builder
                </button>
              )}
            </div>
            {(sections.brief || []).map((item) => (
              <CheckRow key={item.id} id={item.id} label={item.label} />
            ))}
            {editingBrief ? (
              <div className="space-y-2">
                <textarea
                  className={`${inputClass} min-h-[120px]`}
                  value={briefDraft}
                  onChange={(e) => setBriefDraft(e.target.value)}
                  placeholder="Scope, deadline, budget, revision terms..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => void saveBrief()}>Save Brief</Button>
                  <Button variant="secondary" onClick={() => setEditingBrief(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setEditingBrief(true)}>
                  {project.briefText ? "Edit Brief" : "Add Brief"}
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => startUpload("brief")}>
                  <Upload size={14} className="mr-1.5" /> Upload Brief
                </Button>
              </div>
            )}
            {project.briefText && !editingBrief && (
              <p className="rounded-xl border border-[#242424] bg-[#121212] px-3 py-2 text-xs text-[#909090] whitespace-pre-wrap">
                {project.briefText.slice(0, 400)}
                {project.briefText.length > 400 ? "…" : ""}
              </p>
            )}
          </div>

          {/* Manuscript */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#606060]">
              Final Manuscript
            </p>
            {(sections.manuscript || []).map((item) => (
              <CheckRow key={item.id} id={item.id} label={item.label} />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => startUpload("draft")}>
                Upload Draft
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => startUpload("final")}>
                Upload Final
              </Button>
            </div>
            {(docByType.final || docByType.draft) && (
              <p className="text-xs text-[#606060]">
                File: {(docByType.final || docByType.draft)!.name}
              </p>
            )}
            <Button
              className="w-full"
              disabled={busy || !docByType.final}
              onClick={() =>
                void patch({
                  checked: {
                    ...project.checked,
                    ms_delivered: true,
                    ms_received: true,
                  },
                  reviewStatus: project.reviewStatus || "waiting",
                })
              }
            >
              Mark as Delivered
            </Button>
          </div>

          {/* Client Review */}
          <div className="space-y-3 rounded-xl border border-[#242424] bg-[#161616] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#606060]">
              Client Review
            </p>
            <p className="text-sm text-[#F0EBE0]">
              Status:{" "}
              <span className="text-[var(--gd)]">
                {project.reviewStatus === "approved"
                  ? "Approved"
                  : project.reviewStatus === "changes"
                    ? "Changes requested"
                    : project.checked.ms_delivered
                      ? "Waiting for client"
                      : "Not started"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "waiting" as const, label: "Waiting" },
                { id: "approved" as const, label: "Approved" },
                { id: "changes" as const, label: "Changes requested" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => void patch({ reviewStatus: r.id })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    project.reviewStatus === r.id
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] text-[#c8c4bc]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className={labelClass}>Client feedback</span>
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={project.clientFeedback}
                onChange={(e) =>
                  setProject({ ...project, clientFeedback: e.target.value })
                }
                onBlur={() => void patch({ clientFeedback: project.clientFeedback })}
                placeholder="Notes from the client..."
              />
            </label>
          </div>

          {/* Invoice */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#606060]">Invoice</p>
            {(sections.invoice || []).map((item) => (
              <CheckRow key={item.id} id={item.id} label={item.label} />
            ))}
            <label className="block">
              <span className={labelClass}>Amount</span>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={project.invoiceAmount || ""}
                onChange={(e) =>
                  setProject({
                    ...project,
                    invoiceAmount: Number(e.target.value) || 0,
                  })
                }
                onBlur={() => void patch({ invoiceAmount: project.invoiceAmount })}
                placeholder="1500"
              />
            </label>
            <p className="text-xs text-[#909090]">
              Invoice:{" "}
              <span className="text-[var(--gd)]">
                {project.invoiceStatus === "none" ? "—" : project.invoiceStatus}
              </span>
              {" · "}
              Payment:{" "}
              <span className="text-[var(--gd)]">
                {project.checked.inv_paid || project.invoiceStatus === "paid"
                  ? "Paid"
                  : project.checked.inv_sent
                    ? "Pending"
                    : "—"}
              </span>
            </p>
            <Button variant="secondary" disabled={busy} onClick={() => startUpload("invoice")}>
              Upload Invoice
            </Button>
          </div>

          {/* Document vault */}
          <div className="space-y-3">
            <p className="text-sm text-[#F0EBE0]">Project Documents</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { type: "nda" as const, title: "NDA", sub: "Standard template", icon: Square },
                  { type: "brief" as const, title: "Brief", sub: "Scope & terms", icon: AlignLeft },
                  { type: "draft" as const, title: "Draft", sub: "Manuscript draft", icon: FileText },
                  {
                    type: "final" as const,
                    title: "Final Manuscript",
                    sub: "Delivered file",
                    icon: FileText,
                  },
                  { type: "invoice" as const, title: "Invoice", sub: "Billing", icon: FileText },
                ] as const
              ).map((card) => {
                const doc = docByType[card.type];
                const Icon = card.icon;
                return (
                  <div
                    key={card.type}
                    className="rounded-2xl border border-[#242424] bg-[#161616] p-4"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => (doc ? window.open(fileUrl(doc.url), "_blank") : startUpload(card.type))}
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--gm)]/30 text-[var(--gd)]">
                        <Icon size={16} />
                      </div>
                      <div className="text-sm font-medium text-white">{card.title}</div>
                      <div className="mt-1 text-[11px] text-[#606060]">
                        {doc ? `${doc.status || "Uploaded"} ✓` : card.sub}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-semibold text-[var(--gd)]"
                      onClick={() => startUpload(card.type)}
                    >
                      {doc ? "Replace" : "Upload"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {project.progress.complete ? (
            <div className="space-y-3 rounded-2xl border border-[#52C07A]/30 bg-[#52C07A]/10 p-5">
              <p className="font-serif text-xl font-bold text-white">PROJECT COMPLETE ✓</p>
              <ul className="space-y-1 text-sm text-[#c8c4bc]">
                {project.progress.milestones.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <Check size={14} className="text-[#52C07A]" /> {m.label} ✓
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => void markComplete()}>
                Archive Project
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              variant="secondary"
              disabled={!project.progress.complete}
              onClick={() => void markComplete()}
            >
              Mark Project Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

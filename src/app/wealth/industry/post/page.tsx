"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import DatePicker from "@/components/ui/DatePicker";
import WealthIndustryNav from "@/components/wealth/WealthIndustryNav";
import { CALL_TYPES, LOCATION_TYPES } from "@/lib/industry";

export default function PostOpenCallPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [callType, setCallType] = useState("script_submission");
  const [genre, setGenre] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [deadline, setDeadline] = useState("");
  const [prize, setPrize] = useState("");
  const [fee, setFee] = useState("");
  const [locationType, setLocationType] = useState("remote");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/industry/post")}`);
    }
  }, [authLoading, user, router]);

  const submit = async () => {
    if (!title.trim() || !organization.trim()) {
      setError("Title and organization are required.");
      return;
    }
    if (description.trim().length < 40) {
      setError("Description must be at least 40 characters.");
      return;
    }
    if (!deadline) {
      setError("Deadline is required.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/wealth/industry", {
        title: title.trim(),
        organization: organization.trim(),
        callType,
        genre: genre.trim(),
        targetMarket: targetMarket.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        deadline,
        prize: prize.trim(),
        fee: fee.trim(),
        locationType,
      });
      setSuccess(res.data.message || "Submitted for review.");
      window.setTimeout(() => router.push("/wealth/industry/mine"), 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to post listing.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#909090] text-xs">
        Loading…
      </div>
    );
  }

  const field =
    "mb-3.5 w-full rounded-xl border border-[#242424] bg-[#161616] px-3.5 py-3 text-[13px] text-[#F0EBE0] outline-none focus:border-[var(--gm)]";
  const label = "mb-1.5 block text-[9px] font-bold uppercase tracking-[2px] text-[var(--gm)]";

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[720px]">
          <WealthIndustryNav active="post" />
          <h1 className="font-serif text-3xl font-black text-white mb-2">Post an Open Call</h1>
          <p className="text-xs text-[#909090] mb-6">
            Listings go to admin review before appearing on the Industry board.
          </p>

          <label className={label}>Title</label>
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Seeking feature romance screenplay" />
          <label className={label}>Organization</label>
          <input className={field} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Studio / production company" />
          <label className={label}>Call Type</label>
          <select className={field} value={callType} onChange={(e) => setCallType(e.target.value)}>
            {CALL_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className={label}>Genre</label>
          <input className={field} value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Thriller, Romance" />
          <label className={label}>Target Market</label>
          <input className={field} value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} placeholder="e.g. Nollywood, Netflix Africa" />
          <label className={label}>Description</label>
          <textarea className={`${field} min-h-[120px]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you looking for?" />
          <label className={label}>Requirements</label>
          <textarea className={`${field} min-h-[80px]`} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Format, length, experience…" />
          <label className={label}>Deadline</label>
          <div className="mb-3.5">
            <DatePicker value={deadline} onChange={setDeadline} accent="gold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Prize / Budget</label>
              <input className={field} value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className={label}>Entry Fee</label>
              <input className={field} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Optional / Free" />
            </div>
          </div>
          <label className={label}>Location</label>
          <select className={field} value={locationType} onChange={(e) => setLocationType(e.target.value)}>
            {LOCATION_TYPES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          {error ? <p className="text-xs text-red-400 mb-3">{error}</p> : null}
          {success ? <p className="text-xs text-[var(--ok)] mb-3">{success}</p> : null}

          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="w-full rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] py-3.5 text-sm font-bold text-[#080808] disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

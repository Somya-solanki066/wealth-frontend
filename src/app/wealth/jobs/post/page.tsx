"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import DatePicker from "@/components/ui/DatePicker";
import WealthJobsNav from "@/components/wealth/WealthJobsNav";
import {
  BUDGET_TYPES,
  JOB_CATEGORIES,
  JOB_TYPES,
  LOCATION_TYPES,
} from "@/lib/wealthJobs";

export default function PostJobPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("novel");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState("fixed");
  const [deadline, setDeadline] = useState("");
  const [jobType, setJobType] = useState("contract");
  const [locationType, setLocationType] = useState("remote");
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/jobs/post")}`);
    }
  }, [authLoading, user, router]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Job title is required.");
      return;
    }
    if (description.trim().length < 40) {
      setError("Description must be at least 40 characters.");
      return;
    }
    if (!budget.trim()) {
      setError("Budget is required.");
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
      const res = await api.post("/wealth/jobs", {
        title: title.trim(),
        category,
        description: description.trim(),
        budget,
        budgetDisplay: budget.trim().startsWith("$") ? budget.trim() : `$${budget.trim()}`,
        budgetType,
        deadline,
        jobType,
        locationType,
        urgent,
      });
      setSuccess(res.data.message || "Job submitted for admin review.");
      window.setTimeout(() => {
        router.push("/wealth/jobs/mine");
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to post job.");
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

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[720px]">
          <WealthJobsNav active="post" />
          <h1 className="font-serif text-3xl font-black text-white mb-2">Post a Job</h1>
          <p className="text-xs text-[#909090] mb-6">
            Jobs go to admin review before appearing on the public board.
          </p>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 space-y-4">
            <Input
              label="Job Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Romance Novel Ghostwriter"
            />
            <Select
              label="Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={JOB_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))}
            />
            <Textarea
              label="Description *"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project, requirements, deliverables..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Budget *"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500 or $500"
              />
              <Select
                label="Budget Type"
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                options={BUDGET_TYPES.map((t) => ({ label: t.label, value: t.value }))}
              />
            </div>
            <DatePicker
              label="Deadline *"
              value={deadline}
              onChange={setDeadline}
              accent="gold"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Job Type *"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                options={JOB_TYPES.map((t) => ({ label: t.label, value: t.value }))}
              />
              <Select
                label="Location *"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                options={LOCATION_TYPES.map((t) => ({ label: t.label, value: t.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#909090] cursor-pointer">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
              />
              Mark as Urgent
            </label>

            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            {success ? <p className="text-xs text-[#52C07A]">{success}</p> : null}

            <Button type="button" className="w-full" isLoading={loading} onClick={submit}>
              Submit for Review
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

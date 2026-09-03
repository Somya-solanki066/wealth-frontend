"use client";

import { useState } from "react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

export default function ApplyForm({
  jobId,
  onSuccess,
  onCancel,
}: {
  jobId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [coverMessage, setCoverMessage] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experience, setExperience] = useState("");
  const [expectedRate, setExpectedRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (coverMessage.trim().length < 20) {
      setError("Cover message must be at least 20 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post(`/wealth/jobs/${jobId}/applications`, {
        coverMessage: coverMessage.trim(),
        portfolioUrl: portfolioUrl.trim(),
        experience: experience.trim(),
        expectedRate: expectedRate.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        label="Cover Message *"
        rows={5}
        value={coverMessage}
        onChange={(e) => setCoverMessage(e.target.value)}
        placeholder="Introduce yourself and why you're a fit for this job..."
      />
      <Input
        label="Portfolio URL"
        value={portfolioUrl}
        onChange={(e) => setPortfolioUrl(e.target.value)}
        placeholder="https://..."
      />
      <Textarea
        label="Relevant Experience"
        rows={3}
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        placeholder="Years, genres, platforms..."
      />
      <Input
        label="Expected Rate"
        value={expectedRate}
        onChange={(e) => setExpectedRate(e.target.value)}
        placeholder="e.g. $500 fixed or $0.03/word"
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" isLoading={loading} onClick={submit}>
          Submit Application
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

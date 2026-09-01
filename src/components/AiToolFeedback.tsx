"use client";

import { useState } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp, MinusCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import api from "@/services/api";

type FeedbackTool = "chapter-analyzer" | "smart-edit";
type FeedbackRating = "yes" | "partial" | "no";

const RATING_OPTIONS: {
  value: FeedbackRating;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "yes",
    label: "Working well",
    description: "AI results look accurate and helpful",
    icon: <ThumbsUp className="h-4 w-4" />,
  },
  {
    value: "partial",
    label: "Partially working",
    description: "Some results are useful, some are not",
    icon: <MinusCircle className="h-4 w-4" />,
  },
  {
    value: "no",
    label: "Not working",
    description: "AI is giving wrong results or failing",
    icon: <ThumbsDown className="h-4 w-4" />,
  },
];

export default function AiToolFeedback({
  tool,
  title = "Share Your Feedback",
  description = "Tell us if the AI is working correctly and share any problems you are facing.",
  context,
}: {
  tool: FeedbackTool;
  title?: string;
  description?: string;
  context?: Record<string, string>;
}) {
  const [rating, setRating] = useState<FeedbackRating | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!rating) {
      setStatus({ type: "error", text: "Please select whether the AI is working correctly." });
      return;
    }

    if (message.trim().length < 10) {
      setStatus({ type: "error", text: "Please write at least 10 characters about your experience." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      await api.post("/feedback", {
        tool,
        rating,
        message: message.trim(),
        context: context || {},
      });

      setStatus({ type: "success", text: "Thank you! Your feedback has been submitted." });
      setMessage("");
      setRating("");
    } catch (err: any) {
      setStatus({
        type: "error",
        text: err.response?.data?.error || "Failed to submit feedback. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card hoverable={false} className="p-6 space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--gd)]" />
          <h3 className="font-serif text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-xs text-[#909090] leading-relaxed">{description}</p>
      </div>

      <div className="space-y-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090]">
          Is the AI working correctly for you?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RATING_OPTIONS.map((option) => {
            const selected = rating === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRating(option.value)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  selected
                    ? "border-[var(--gm)] bg-[var(--gd)]/10"
                    : "border-[#242424] bg-[#080808] hover:border-[#404040]"
                }`}
              >
                <div className={`flex items-center gap-2 mb-1 ${selected ? "text-[var(--gd)]" : "text-white"}`}>
                  {option.icon}
                  <span className="text-xs font-bold">{option.label}</span>
                </div>
                <p className="text-[10px] text-[#909090] leading-relaxed">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090]">
          Your feedback / problems faced
        </span>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share what worked, what did not, errors you saw, or how we can improve..."
          className="min-h-[120px] bg-zinc-950 text-sm"
        />
      </div>

      {status && (
        <p
          className={`text-xs ${
            status.type === "success" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {status.text}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} isLoading={isSubmitting} size="sm">
          Submit Feedback
        </Button>
      </div>
    </Card>
  );
}

"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useCourseCheckout, type CourseProductId } from "@/hooks/useCourseCheckout";

type CourseEnrollButtonProps = {
  courseId: CourseProductId;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCheckoutError?: (message: string) => void;
};

export default function CourseEnrollButton({
  courseId,
  children,
  className = "",
  style,
  disabled,
  onClick,
  onCheckoutError,
}: CourseEnrollButtonProps) {
  const { startCheckout, loading } = useCourseCheckout();

  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={disabled || loading}
      onClick={async (e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        try {
          await startCheckout(courseId);
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Checkout failed. Please try again.";
          onCheckoutError?.(message);
        }
      }}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

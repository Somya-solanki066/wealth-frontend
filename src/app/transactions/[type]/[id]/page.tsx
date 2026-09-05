"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { transactionDetailPath } from "@/lib/transactionUtils";

/** Legacy route — redirect into dashboard so sidebar stays visible. */
export default function TransactionDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const type = String(params.type || "");
  const id = String(params.id || "");

  useEffect(() => {
    if (type && id) {
      router.replace(transactionDetailPath(type, id));
    } else {
      router.replace("/dashboard?tab=transactions");
    }
  }, [type, id, router]);

  return null;
}

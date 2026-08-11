"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function CheckoutSuccessTracker() {
  const router = useRouter();

  useEffect(() => {
    trackEvent("assinatura_concluida");
    router.replace("/app/conta");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

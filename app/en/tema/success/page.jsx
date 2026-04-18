"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TemaSuccessPageEN() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    try {
      localStorage.setItem(
        "dyana_tema_post_payment",
        JSON.stringify({
          source: "tema_single",
          session_id: sessionId || "",
          ts: Date.now(),
        })
      );
    } catch (err) {
      console.warn("[TEMA SUCCESS][EN] localStorage write failed:", err);
    }

    router.replace("/en/tema");
  }, [router, searchParams]);

  return null;
}
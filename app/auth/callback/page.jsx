"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyMagicLink } from "../../lib/authClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = params.get("type") || "magiclink";

    if (!tokenHash) {
      console.error("[AUTH-CALLBACK] token_hash mancante");
      router.replace("/");
      return;
    }

    console.info("[AUTH-CALLBACK] verifyMagicLink()", { type });

    verifyMagicLink(tokenHash, type)
      .then(() => {
        console.info("[AUTH-CALLBACK] login OK, redirect /oroscopo");
        router.replace("/oroscopo");
      })
      .catch((err) => {
        console.error("[AUTH-CALLBACK] verify error", err);
        router.replace("/");
      });
  }, [params, router]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Accesso in corso…</h2>
      <p>Sto verificando il tuo link.</p>
    </div>
  );
}

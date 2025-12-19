"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  // ✅ nuovo flow: token_hash -> /auth/magic-link/verify -> JWT DYANA già pronto
  verifyMagicLink,

  // ✅ vecchio flow (fallback): access_token supabase -> /auth/exchange -> JWT DYANA
  exchangeSupabaseTokenForDyanaJwt,

  clearToken,
} from "../../../lib/authClient";

function readResumeTarget() {
  try {
    const path = localStorage.getItem("dyana_resume_path") || "/";
    const qs = localStorage.getItem("dyana_resume_qs") || "";
    const ts = parseInt(localStorage.getItem("dyana_resume_ts") || "0", 10);

    // scadenza resume 30 minuti (opzionale)
    if (ts && Date.now() - ts > 30 * 60 * 1000) return { path: "/" };

    return { path, qs };
  } catch {
    return { path: "/" };
  }
}

function clearResumeTarget() {
  try {
    localStorage.removeItem("dyana_resume_path");
    localStorage.removeItem("dyana_resume_qs");
    localStorage.removeItem("dyana_resume_ts");
  } catch {}
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("loading"); // loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        // -----------------------------
        // 1) NUOVO FLOW (consigliato):
        // /auth/callback?token_hash=...&type=magiclink|signup|recovery|invite
        // -----------------------------
        const tokenHash = sp?.get("token_hash");
        const typeQ = sp?.get("type") || "magiclink";

       if (tokenHash) {
  await verifyMagicLink(tokenHash, typeQ);

  // ✅ Notifica alle altre tab/pagine che l'accesso è completato
  try { localStorage.setItem("dyana_auth_done", String(Date.now())); } catch {}
  try {
    const bc = new BroadcastChannel("dyana_auth");
    bc.postMessage({ type: "AUTH_DONE", ts: Date.now() });
    bc.close();
  } catch {}

  const { path, qs } = readResumeTarget();
  const target = qs ? `${path}?${qs}` : path;
  clearResumeTarget();
  router.replace(target);
  return;
}


        // -----------------------------
        // 2) FALLBACK: FLOW SUPABASE HASH
        // /auth/callback#access_token=...&type=...
        // (utile se qualcuno arriva da altri template o flow)
        // -----------------------------
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hp = new URLSearchParams((hash || "").replace("#", ""));
        const sbAccessToken = hp.get("access_token");

        if (sbAccessToken) {
          await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);
// Notifica alle altre tab che l'accesso è completato
try { localStorage.setItem("dyana_auth_done", String(Date.now())); } catch {}

try {
  const bc = new BroadcastChannel("dyana_auth");
  bc.postMessage({ type: "AUTH_DONE", ts: Date.now() });
  bc.close();
} catch {}

          const { path, qs } = readResumeTarget();
          const target = qs ? `${path}?${qs}` : path;
          clearResumeTarget();
          router.replace(target);
          return;
        }

        // -----------------------------
        // 3) NIENTE TOKEN: errore
        // -----------------------------
        throw new Error("Token mancante nel link. Richiedi un nuovo magic link.");
      } catch (e) {
        try {
          clearToken();
        } catch {}
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    }

    run();
  }, [router, sp]);

  if (status === "error") {
    return (
      <div className="card">
        <h1 className="card-title">Errore accesso</h1>
        <p className="card-text" style={{ color: "#ff9a9a" }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="card-title">Sto completando l’accesso…</h1>
      <p className="card-text" style={{ opacity: 0.85 }}>Un momento.</p>
    </div>
  );
}

// app/auth/callback/CallbackClient.jsx
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

const WELCOME_PATH = "/welcome";

/**
 * Resume target salvato prima di aprire il gate (quando chiedi email / login)
 * Lo teniamo per poter “continuare” dopo (dalla welcome), ma qui non ci torniamo più direttamente.
 */
function clearResumeTarget() {
  try {
    localStorage.removeItem("dyana_resume_path");
    localStorage.removeItem("dyana_resume_qs");
    localStorage.removeItem("dyana_resume_ts");
  } catch {}
}

function notifyAuthDone() {
  try { localStorage.setItem("dyana_auth_done", String(Date.now())); } catch {}
  try {
    const bc = new BroadcastChannel("dyana_auth");
    bc.postMessage({ type: "AUTH_DONE", ts: Date.now() });
    bc.close();
  } catch {}
}

function resolveWelcomeMode(typeQ) {
  // nuovi utenti: signup / invite
  if (typeQ === "signup" || typeQ === "invite") return "new";
  // tutto il resto: ritorno (magiclink / recovery / ecc.)
  return "back";
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
        // 1) NUOVO FLOW:
        // /auth/callback?token_hash=...&type=magiclink|signup|recovery|invite
        // -----------------------------
        const tokenHash = sp?.get("token_hash");
        const typeQ = sp?.get("type") || "magiclink";

        if (tokenHash) {
          await verifyMagicLink(tokenHash, typeQ);
          notifyAuthDone();

          const mode = resolveWelcomeMode(typeQ);

          // Per i nuovi: evitiamo di portarci dietro resume "sporchi" di pagine a metà
          if (mode === "new") clearResumeTarget();

          router.replace(`${WELCOME_PATH}?mode=${mode}`);
          return;
        }

        // -----------------------------
        // 2) FALLBACK: FLOW SUPABASE HASH
        // /auth/callback#access_token=...&type=...
        // -----------------------------
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hp = new URLSearchParams((hash || "").replace("#", ""));
        const sbAccessToken = hp.get("access_token");
        const typeHash = hp.get("type") || "magiclink";

        if (sbAccessToken) {
          await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);
          notifyAuthDone();

          const mode = resolveWelcomeMode(typeHash);
          if (mode === "new") clearResumeTarget();

          router.replace(`${WELCOME_PATH}?mode=${mode}`);
          return;
        }

        // -----------------------------
        // 3) NIENTE TOKEN: errore
        // -----------------------------
        throw new Error("Token mancante nel link. Richiedi un nuovo magic link.");
      } catch (e) {
        try { clearToken(); } catch {}
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

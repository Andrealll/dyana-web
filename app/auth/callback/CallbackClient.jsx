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
 * Resume target salvato prima di aprire il gate (es. quando l'utente clicca "Approfondisci")
 * Se manca o scade, torniamo alla home (o puoi cambiare in /welcome).
 */
function readResumeTarget() {
  try {
    const path = localStorage.getItem("dyana_resume_path") || "/";
    const qs = localStorage.getItem("dyana_resume_qs") || "";
    const ts = parseInt(localStorage.getItem("dyana_resume_ts") || "0", 10);

    // scadenza resume 30 minuti
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

function notifyAuthDone() {
  try {
    localStorage.setItem("dyana_auth_done", String(Date.now()));
  } catch {}

  try {
    const bc = new BroadcastChannel("dyana_auth");
    bc.postMessage({ type: "AUTH_DONE", ts: Date.now() });
    bc.close();
  } catch {}
}

function isNewUserType(typeQ) {
  return typeQ === "signup" || typeQ === "invite";
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("loading"); // loading | kamikaze | error
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
          notifyAuthDone();

          // ✅ NUOVI UTENTI -> WELCOME
          if (isNewUserType(typeQ)) {
            clearResumeTarget(); // evita rientri su pagine "a metà" durante onboarding
            router.replace(WELCOME_PATH);
            return;
          }

          // ✅ ESISTENTI -> KAMIKAZE (prova a chiudersi)
          try {
            window.close();
          } catch {}

          // Se il browser blocca la chiusura (tipico da email), mostriamo testo minimale
          setStatus("kamikaze");
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

          // Se arriva da signup/invite anche qui, andiamo a welcome
          if (isNewUserType(typeHash)) {
            clearResumeTarget();
            router.replace(WELCOME_PATH);
            return;
          }

          // ESISTENTI -> KAMIKAZE
          try {
            window.close();
          } catch {}
          setStatus("kamikaze");
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

  if (status === "kamikaze") {
    return (
      <div className="card">
        <h1 className="card-title">Accesso completato</h1>

        <p className="card-text" style={{ opacity: 0.9 }}>
          Ora puoi tornare alla scheda DYANA che avevi aperta e continuare.
        </p>

        <p className="card-text" style={{ opacity: 0.75, fontSize: "0.9rem" }}>
          Se questa pagina non si chiude da sola, puoi chiuderla manualmente.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() => {
            const { path, qs } = readResumeTarget();
            const target = qs ? `${path}?${qs}` : path;
            clearResumeTarget();
            router.replace(target);
          }}
        >
          Torna a DYANA
        </button>
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

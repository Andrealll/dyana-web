// app/auth/callback/CallbackClient.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import {
  verifyMagicLink,
  exchangeSupabaseTokenForDyanaJwt,
  clearToken,
} from "../../../lib/authClient";

const WELCOME_PATH = "/welcome";
const AUTH_DONE_KEY = "dyana_auth_done";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Config mancante: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon);
}

function clearResumeTarget() {
  try {
    localStorage.removeItem("dyana_resume_path");
    localStorage.removeItem("dyana_resume_qs");
    localStorage.removeItem("dyana_resume_ts");
  } catch {}
}

function notifyAuthDone() {
  try { localStorage.setItem(AUTH_DONE_KEY, String(Date.now())); } catch {}

  // evento locale (stessa tab)
  try {
    window.dispatchEvent(new CustomEvent("dyana:auth", { detail: { type: "AUTH_DONE", ts: Date.now() } }));
  } catch {}

  // broadcast (altre tab)
  try {
    const bc = new BroadcastChannel("dyana_auth");
    bc.postMessage({ type: "AUTH_DONE", ts: Date.now() });
    bc.close();
  } catch {}
}

function resolveWelcomeMode(typeQ) {
  if (typeQ === "signup" || typeQ === "invite") return "new";
  return "back";
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
		console.log("DYANA CALLBACK URL:", window.location.href);
		// 0) PKCE FLOW (?code=...)
        const code = sp?.get("code");
        if (code) {
          const supabase = getSupabase();

          // Scambia code -> sessione Supabase (set cookie/storage nella WebView)
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;

          notifyAuthDone();

          // Se Supabase passa type=signup/invite lo usiamo, altrimenti "magiclink"
          const typeQ0 = sp?.get("type") || "magiclink";
          const mode = resolveWelcomeMode(typeQ0);

          router.replace(`${WELCOME_PATH}?mode=${mode}`);
          return;
        }

		  
        // 1) NUOVO FLOW (token_hash)
        const tokenHash = sp?.get("token_hash");
        const typeQ = sp?.get("type") || "magiclink";

        if (tokenHash) {
          await verifyMagicLink(tokenHash, typeQ);
          notifyAuthDone();

          const mode = resolveWelcomeMode(typeQ);
         // if (mode === "new") clearResumeTarget();  NON cancelliamo mai il resume qui: serve a /welcome -> "Continua"

          router.replace(`${WELCOME_PATH}?mode=${mode}`);
          return;
        }

        // 2) FALLBACK (hash access_token)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hp = new URLSearchParams((hash || "").replace("#", ""));
        const sbAccessToken = hp.get("access_token");
        const typeHash = hp.get("type") || "magiclink";

        if (sbAccessToken) {
          await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);
          notifyAuthDone();

          const mode = resolveWelcomeMode(typeHash);
          //if (mode === "new") clearResumeTarget(); NON cancelliamo mai il resume qui: serve a /welcome -> "Continua"


          router.replace(`${WELCOME_PATH}?mode=${mode}`);
          return;
        }

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
        <p className="card-text" style={{ color: "#ff9a9a" }}>{error}</p>
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

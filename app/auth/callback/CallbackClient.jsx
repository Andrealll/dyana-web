"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  exchangeSupabaseTokenForDyanaJwt,
  clearToken,
} from "../../../lib/authClient";

function readResumeTarget() {
  try {
    const path = localStorage.getItem("dyana_resume_path") || "/";
    const qs = localStorage.getItem("dyana_resume_qs") || "";
    const ts = parseInt(localStorage.getItem("dyana_resume_ts") || "0", 10);

    // opzionale: scadenza resume 30 minuti
    if (ts && Date.now() - ts > 30 * 60 * 1000) return { path: "/" };

    return { path, qs };
  } catch {
    return { path: "/" };
  }
}

export default function CallbackClient() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        // 1) Leggi access_token dal fragment (come reset password)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const params = new URLSearchParams(hash.replace("#", ""));

        const sbAccessToken = params.get("access_token");
        const type = params.get("type"); // "magiclink" | "recovery" | ...

        if (!sbAccessToken) {
          throw new Error("Token mancante nel link. Richiedi un nuovo magic link.");
        }

        // 2) Exchange: Supabase token -> JWT DYANA (astrobot_access_token)
        await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);

        // 3) Resume: torna dove era l’utente (pagina compilata)
        const { path, qs } = readResumeTarget();
        const target = qs ? `${path}?${qs}` : path;

        router.replace(target);
      } catch (e) {
        // fallback: pulizia e messaggio
        try { clearToken(); } catch {}
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    }

    run();
  }, [router]);

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

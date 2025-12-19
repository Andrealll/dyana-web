"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { exchangeSupabaseTokenForDyanaJwt } from "../../../lib/authClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function readHashAccessToken() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash?.replace(/^#/, "") || "";
  if (!hash) return null;
  const p = new URLSearchParams(hash);
  return p.get("access_token");
}

function getResumeTargetAndClear() {
  try {
    const path = localStorage.getItem("dyana_resume_path") || "/";
    const qs = localStorage.getItem("dyana_resume_qs") || "";

    // evita loop: pulisci subito
    localStorage.removeItem("dyana_resume_path");
    localStorage.removeItem("dyana_resume_qs");
    localStorage.removeItem("dyana_resume_ts");

    return qs ? `${path}?${qs}` : path;
  } catch {
    return "/";
  }
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        if (!supabase) {
          throw new Error("Supabase non configurato (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY mancanti).");
        }

        // 1) PKCE: code -> session
        const code = sp.get("code");
        let sbAccessToken = null;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw new Error(error.message || "exchangeCodeForSession fallita.");
          sbAccessToken = data?.session?.access_token || null;
        } else {
          // 2) fallback: access_token in hash
          sbAccessToken = readHashAccessToken();
        }

        if (!sbAccessToken) {
          throw new Error("Callback senza code/access_token (link scaduto o redirect non corretto).");
        }

        // 3) Exchange verso astrobot-auth-pub -> DYANA JWT
        await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);

        // 4) redirect dove stava l’utente
        const target = getResumeTargetAndClear();
        router.replace(target);
      } catch (e) {
        console.error("[AUTH/CALLBACK] errore:", e);
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    }
    run();
  }, [sp, router]);

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

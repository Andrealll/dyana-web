"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exchangeSupabaseTokenForDyanaJwt } from "../../../lib/authClient";

function getHashParam(name) {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  return p.get(name);
}

function getResumeTargetAndClear() {
  try {
    const path = localStorage.getItem("dyana_resume_path") || "/";
    const qs = localStorage.getItem("dyana_resume_qs") || "";
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
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const sbAccessToken = getHashParam("access_token");
        if (!sbAccessToken) {
          throw new Error("Token mancante nel link (access_token). Richiedi un nuovo link.");
        }

        // scambio supabase token -> DYANA JWT e salva in localStorage
        await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);

        const target = getResumeTargetAndClear();
        router.replace(target);
      } catch (e) {
        console.error("[AUTH/CALLBACK] errore:", e);
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

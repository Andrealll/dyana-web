"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exchangeSupabaseTokenForDyanaJwt } from "../../../lib/authClient";

function safeReadHashToken() {
  try {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.length < 2) return null;
    const sp = new URLSearchParams(hash.replace("#", ""));
    return sp.get("access_token");
  } catch {
    return null;
  }
}

function readResumePath() {
  try {
    const p = localStorage.getItem("dyana_resume_path");
    return p && typeof p === "string" ? p : "/";
  } catch {
    return "/";
  }
}

function clearResume() {
  try {
    localStorage.removeItem("dyana_resume_path");
    localStorage.removeItem("dyana_resume_qs");
    localStorage.removeItem("dyana_resume_ts");
  } catch {}
}

export default function CallbackClient() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const sbAccessToken = safeReadHashToken();
        if (!sbAccessToken) {
          throw new Error("Token mancante nel link. Richiedi un nuovo accesso via email.");
        }

        // 1) Exchange → salva dyana_jwt in localStorage (saveToken dentro authClient)
        await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);

        // 2) Torna dove eri
        const resumePath = readResumePath();
        clearResume();

        router.replace(resumePath || "/");
      } catch (e) {
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    })();
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

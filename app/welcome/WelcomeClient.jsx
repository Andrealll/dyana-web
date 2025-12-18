"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyMagicLink, saveToken, fetchCreditsState } from "../../lib/authClient";

export default function WelcomeClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const ml = sp.get("ml");

  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);

  const resumeUrl = useMemo(() => {
    try {
      const path = localStorage.getItem("dyana_resume_path") || "/";
      const qs = localStorage.getItem("dyana_resume_qs") || "";
      return qs ? `${path}?${qs}` : path;
    } catch {
      return "/";
    }
  }, []);

  function clearResume() {
    try {
      localStorage.removeItem("dyana_resume_path");
      localStorage.removeItem("dyana_resume_qs");
      localStorage.removeItem("dyana_resume_ts");
    } catch {}
  }

  useEffect(() => {
    async function finalize() {
      if (!ml) {
        setStatus("error");
        setError("Link mancante.");
        return;
      }

      try {
        const data = await verifyMagicLink(ml);
        if (!data?.access_token) throw new Error("Token non presente nella risposta.");

        saveToken(data.access_token);

        try {
          const st = await fetchCreditsState(data.access_token);
          if (typeof st?.remaining_credits === "number") setCredits(st.remaining_credits);
        } catch {}

        setStatus("ok");
      } catch (e) {
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    }

    finalize();
  }, [ml]);

  return (
    <div className="card">
      {status === "loading" && (
        <>
          <h1 className="card-title">Sto completando l’accesso…</h1>
          <p className="card-text" style={{ opacity: 0.85 }}>Un momento.</p>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="card-title">Non riesco a completare l’accesso</h1>
          <p className="card-text" style={{ color: "#ff9a9a" }}>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/login")}>
            Vai al login
          </button>
        </>
      )}

      {status === "ok" && (
        <>
          <h1 className="card-title">Benvenuto su DYANA</h1>
          <p className="card-text">Accesso completato. Crediti: {credits}</p>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              clearResume();
              router.push("/");
            }}
          >
            Torna alla home
          </button>

          {/* Se vuoi davvero tornare alla lettura, scommenta:
          <button
            className="btn"
            style={{ marginTop: 10 }}
            onClick={() => {
              const target = resumeUrl;
              clearResume();
              router.push(target);
            }}
          >
            Torna alla tua lettura
          </button>
          */}
        </>
      )}
    </div>
  );
}

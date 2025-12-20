"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCreditsState, getAnyAuthTokenAsync } from "../../lib/authClient";

export default function WelcomeClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const mode = sp?.get("mode") || "back"; // new | back
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(null);

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
    async function load() {
      try {
        // Qui NON verifichiamo il link: lo fa /auth/callback.
        const token = await getAnyAuthTokenAsync?.();
        if (!token) {
          setStatus("error");
          setError("Sessione non trovata. Richiedi un nuovo link di accesso.");
          return;
        }

        try {
          const st = await fetchCreditsState(token);
          if (typeof st?.remaining_credits === "number") setCredits(st.remaining_credits);
          else if (typeof st?.credits === "number") setCredits(st.credits);
        } catch {}

        setStatus("ok");
      } catch (e) {
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    }

    load();
  }, []);

  if (status === "loading") {
    return (
      <div className="card">
        <h1 className="card-title">Sto completando l’accesso…</h1>
        <p className="card-text" style={{ opacity: 0.85 }}>Un momento.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card">
        <h1 className="card-title">Non riesco a completare l’accesso</h1>
        <p className="card-text" style={{ color: "#ff9a9a" }}>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/login")}>
          Vai al login
        </button>
      </div>
    );
  }

  // ok
  const title = mode === "new" ? "Benvenuto su DYANA" : "Bentornato su DYANA";

  return (
    <div className="card">
      <h1 className="card-title">{title}</h1>

      {mode === "new" ? (
        <>
          <p className="card-text" style={{ opacity: 0.9 }}>
            Accesso completato.
          </p>
          <p className="card-text" style={{ opacity: 0.9 }}>
            Hai <strong>5 crediti gratuiti</strong> per iniziare. Inoltre, riceverai <strong>1 credito gratuito al giorno</strong> per calcolare i tuoi oroscopi!.
          </p>
        </>
      ) : (
        <>
          <p className="card-text" style={{ opacity: 0.9 }}>
            Accesso completato: ora sei loggato.
          </p>
          <p className="card-text" style={{ opacity: 0.9 }}>
            Puoi continuare da dove eri rimasto.
          </p>
        </>
      )}

      <p className="card-text" style={{ marginTop: 10 }}>
        Crediti disponibili: <strong>{credits ?? "—"}</strong>
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        {mode === "back" && (
          <button
            className="btn btn-primary"
            onClick={() => {
              const target = resumeUrl;
              clearResume();
              router.push(target);
            }}
          >
            Continua
          </button>
        )}

        <button
          className={mode === "back" ? "btn" : "btn btn-primary"}
          onClick={() => {
            clearResume();
            router.push("/");
          }}
        >
          Torna alla home
        </button>
      </div>
    </div>
  );
}

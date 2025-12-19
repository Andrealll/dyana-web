"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  fetchCreditsState,
  getAnyAuthTokenAsync,
  clearToken,
} from "../../lib/authClient";

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
        // In questo flow la verifica è già stata fatta dal callback.
        // Qui controlliamo solo se siamo davvero loggati e carichiamo crediti.
        const token = await getAnyAuthTokenAsync?.();

        if (!token) {
          setStatus("error");
          setError("Sessione non trovata. Richiedi un nuovo link di accesso.");
          return;
        }

        try {
          const st = await fetchCreditsState(token);
          if (typeof st?.remaining_credits === "number") setCredits(st.remaining_credits);
          else if (typeof st?.credits === "number") setCredits(st.credits); // fallback se schema diverso
        } catch {
          // se credits non riesce, non blocchiamo la welcome
        }

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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => router.push("/login")}>
            Vai al login
          </button>
          <button
            className="btn"
            onClick={() => {
              try { clearToken(); } catch {}
              router.push("/");
            }}
          >
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  // status === "ok"
  const title = mode === "new" ? "Benvenuto su DYANA" : "Bentornato su DYANA";

  return (
    <div className="card">
      <h1 className="card-title">{title}</h1>

      {mode === "new" ? (
        <>
          <p className="card-text" style={{ opacity: 0.9 }}>
            Il tuo accesso è completato.
          </p>
          <p className="card-text" style={{ opacity: 0.9 }}>
            Hai un pacchetto di <strong>crediti gratuiti</strong> per iniziare.
            In più, riceverai <strong>1 credito gratuito al giorno</strong>.
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

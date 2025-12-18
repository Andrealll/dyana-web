"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DyanaNavbar from "../../components/DyanaNavbar";
import DyanaFooter from "../../components/DyanaFooter";
import { verifyMagicLink, saveToken, fetchCreditsState } from "../../lib/authClient";

export default function WelcomePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ml = sp.get("ml");

  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);

  const CREDITS_INTRO_KEY = "dyana_credits_intro_seen_v1";
  const [showCreditsIntro, setShowCreditsIntro] = useState(false);

  const [userRole, setUserRole] = useState("guest");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    let cancelled = false;

    async function finalize() {
      if (!ml) {
        if (!cancelled) {
          setStatus("error");
          setError("Link mancante.");
        }
        return;
      }

      try {
        const data = await verifyMagicLink(ml);
        if (!data?.access_token) throw new Error("Token non presente nella risposta.");

        saveToken(data.access_token);
        if (!cancelled) setUserRole("user");

        // one-shot: lo mostriamo qui, ma senza bottoni. Lo marchiamo come visto subito.
        try {
          const seen = localStorage.getItem(CREDITS_INTRO_KEY) === "1";
          if (!seen) localStorage.setItem(CREDITS_INTRO_KEY, "1");
          if (!cancelled) setShowCreditsIntro(!seen);
        } catch {
          if (!cancelled) setShowCreditsIntro(true);
        }

        try {
          const st = await fetchCreditsState(data.access_token);
          if (!cancelled && typeof st?.remaining_credits === "number") {
            setCredits(st.remaining_credits);
          }
          if (!cancelled && typeof st?.role === "string") {
            setUserRole(st.role);
          }
        } catch {}

        if (!cancelled) setStatus("ok");
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e?.message || "Impossibile completare l’accesso.");
        }
      }
    }

    finalize();

    return () => {
      cancelled = true;
    };
  }, [ml]);

  return (
    <main className="page-root">
      {mounted && (
        <DyanaNavbar userRole={userRole} credits={credits} onLogout={() => {}} />
      )}

      <section className="landing-wrapper">
        <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="card">
            {status === "loading" && (
              <>
                <h1 className="card-title">Sto completando l’accesso…</h1>
                <p className="card-text" style={{ opacity: 0.85 }}>
                  Un momento, ti riporto alla tua esperienza.
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <h1 className="card-title">Non riesco a completare l’accesso</h1>
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {error}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/login")}
                  style={{ marginTop: 16 }}
                >
                  Accedi
                </button>
              </>
            )}

            {status === "ok" && (
              <>
                <h1 className="card-title">Benvenuto su DYANA</h1>

                <p className="card-text">
                  Il tuo saldo attuale è <b>{credits}</b> crediti.
                </p>

                {showCreditsIntro && (
                  <div style={{ marginTop: 12 }}>
                    <p className="card-text" style={{ marginTop: 8 }}>
                      Per iniziare ti abbiamo assegnato <b>5 crediti gratuiti</b>.
                    </p>
                    <p className="card-text" style={{ marginTop: 8 }}>
                      Ogni giorno ricevi <b>1 credito gratuito</b> per consultare il tuo{" "}
                      <b>oroscopo giornaliero</b>.
                    </p>
                    <p className="card-text" style={{ marginTop: 8 }}>
                      Le altre letture utilizzano i crediti disponibili nel tuo saldo.
                    </p>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    // se vuoi, ripulisci resume: non serve più qui
                    clearResume();
                    router.push("/");
                  }}
                >
                  Torna alla Home
                </button>
              </>
            )}
          </div>
        </section>
      </section>


    </main>
  );
}

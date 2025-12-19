"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { sendAuthMagicLink, setResumeTarget } from "../../lib/authClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = "guest";
  const userCredits = 0;

  // Evita hydration issue navbar
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleSendLink(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");
    setLoading(true);

    try {
      const eNorm = (email || "").trim().toLowerCase();
      if (!eNorm || !eNorm.includes("@")) {
        setErrore("Inserisci un’email valida.");
        return;
      }

      // Resume: dopo callback vai all’area personale (o dove vuoi)
      setResumeTarget({ path: "/area-personale", readingId: "login_magiclink" });

      // redirectUrl: sempre /auth/callback sul dominio corrente
      const redirectUrl =
        typeof window !== "undefined" && window.location?.origin
          ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
          : "https://dyana.app/auth/callback";

      await sendAuthMagicLink(eNorm, redirectUrl);

      setSuccess(
        "Link inviato. Apri l’email e clicca sul link per entrare (controlla anche spam/promozioni)."
      );
    } catch (err) {
      console.error("[LoginPage] magic link error", err);
      setErrore(err?.message || "Non riesco a inviare il link. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-root">
      {mounted && (
        <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={() => {}} />
      )}

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Accedi a DYANA</h1>
          <p className="section-subtitle">
            Inserisci la tua email: ti invieremo un link sicuro per entrare.
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "480px", margin: "0 auto" }}>
            {errore && (
              <p className="card-text" style={{ color: "#ff9a9a" }}>
                {errore}
              </p>
            )}
            {success && (
              <p className="card-text" style={{ color: "#9cffb2" }}>
                {success}
              </p>
            )}

            <form
              onSubmit={handleSendLink}
              style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}
            >
              <label className="card-text">Email</label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                disabled={loading}
              />

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Attendi, sto generando…" : "Invia link su email e aprilo per entrare"}
              </button>

              <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 6 }}>
                Continuando accetti le{" "}
                <Link href="/condizioni" className="link" target="_blank" rel="noreferrer">
                  Condizioni del servizio
                </Link>{" "}
                e l’{" "}
                <Link href="/privacy" className="link" target="_blank" rel="noreferrer">
                  Informativa Privacy
                </Link>
                .
              </p>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

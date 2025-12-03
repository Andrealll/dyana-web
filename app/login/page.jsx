
//LOGIN
// LOGIN

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { loginWithCredentials, registerWithEmail } from "../../lib/authClient";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // ✅ Flag privacy SOLO per iscrizione
  const [privacyRegister, setPrivacyRegister] = useState(true);

  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");

  const userRole = "guest";
  const userCredits = 0;

  // ✅ Evita problemi di hydration: montiamo la navbar solo lato client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    try {
      await loginWithCredentials(email, password);
      window.location.href = "/area-personale";
    } catch (err) {
      console.error("[LoginPage] errore login", err);
      // 👇 usiamo il messaggio reale, fallback al testo generico
      setErrore(err?.message || "Email o password non validi.");
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    if (!email || !password) {
      setErrore("Inserisci email e password.");
      return;
    }

    if (password !== password2) {
      setErrore("Le password non coincidono.");
      return;
    }

    if (!privacyRegister) {
      setErrore("Devi accettare l’informativa privacy per iscriverti.");
      return;
    }

    try {
      await registerWithEmail(email, password);
      setSuccess("Registrazione completata! Controlla la tua email.");
      setMode("login");
    } catch (err) {
      setErrore(err.message);
    }
  }

  return (
    <main className="page-root">
      {mounted && (
        <DyanaNavbar
          userRole={userRole}
          credits={userCredits}
          onLogout={() => {}}
        />
      )}

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Accedi a DYANA</h1>
          <p className="section-subtitle">
            Usa il tuo account oppure creane uno nuovo.
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "480px", margin: "0 auto" }}>
            {/* Switch tab */}
            <div style={{ display: "flex", marginBottom: 20 }}>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: mode === "login" ? "#2c4050" : "#444",
                  borderRadius: "6px 0 0 6px",
                }}
                onClick={() => {
                  setMode("login");
                  setErrore("");
                  setSuccess("");
                }}
              >
                Accedi
              </button>

              <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: mode === "register" ? "#2c4050" : "#444",
                  borderRadius: "0 6px 6px 0",
                }}
                onClick={() => {
                  setMode("register");
                  setErrore("");
                  setSuccess("");
                }}
              >
                Iscriviti
              </button>
            </div>

            {/* Errori e successi */}
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

            {/* ======================
               FORM LOGIN (senza flag)
               ====================== */}
            {mode === "login" ? (
              <form
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <label className="card-text">Email</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label className="card-text">Password</label>
                <input
                  className="form-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" className="btn btn-primary">
                  Entra
                </button>

                <p
                  className="card-text"
                  style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 6 }}
                >
                  Hai dimenticato la password?{" "}
                  <Link href="/forgot-password" className="nav-link">
                    Recuperala
                  </Link>
                  .
                </p>
              </form>
            ) : (
              /* =========================
                 FORM ISCRIZIONE (flag qui)
                 ========================= */
              <form
                onSubmit={handleSignup}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <label className="card-text">Email</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label className="card-text">Password</label>
                <input
                  className="form-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <label className="card-text">Conferma Password</label>
                <input
                  className="form-input"
                  type="password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />

                {/* Link alle condizioni del servizio */}
                <p
                  className="card-text"
                  style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 4 }}
                >
                  Leggi le{" "}
                  <Link href="/condizioni" className="nav-link">
                    condizioni del servizio
                  </Link>
                  .
                </p>

                {/* Flag privacy spuntato di default */}
                <label
                  className="card-text"
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    fontSize: "0.8rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={privacyRegister}
                    onChange={(e) => setPrivacyRegister(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    Ho letto e accetto l&apos;{" "}
                    <Link href="/privacy" className="nav-link">
                      informativa privacy
                    </Link>
                    .
                  </span>
                </label>

                <button type="submit" className="btn btn-primary">
                  Registrati
                </button>
              </form>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

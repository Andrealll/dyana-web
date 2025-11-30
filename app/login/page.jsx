"use client";

import { useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { loginWithCredentials, registerWithEmail } from "../../lib/authClient";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");

  const userRole = "guest";
  const userCredits = 0;

  async function handleLogin(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    try {
      await loginWithCredentials(email, password);
      window.location.href = "/tema";
    } catch (err) {
      setErrore("Email o password non validi.");
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
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={() => {}} />

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

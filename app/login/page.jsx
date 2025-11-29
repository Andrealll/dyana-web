"use client";

import DyanaNavbar from "../../components/DyanaNavbar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  loginWithCredentials,
  clearToken,
} from "../../lib/authClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");

  // Stato per la navbar (semplificato)
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    const t = getToken();
    if (t) {
      setTokenPreview(t.slice(0, 20));
      // stima base: se hai un token, consideriamo "free" con 2 crediti
      setUserRole("free");
      setUserCredits(2);
    } else {
      setTokenPreview("");
      setUserRole("guest");
      setUserCredits(0);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");
    setLoading(true);

    try {
      await loginWithCredentials(email, password);
      const t = getToken();
      if (t) {
        setTokenPreview(t.slice(0, 20));
        setUserRole("free");      // puoi raffinarlo leggendo il payload del JWT
        setUserCredits(2);
      }
      setSuccess("Login effettuato con successo ✅");
      // dopo un attimo ti porto su /tema (puoi cambiare se vuoi)
      setTimeout(() => {
        router.push("/tema");
      }, 800);
    } catch (err) {
      console.error("[LOGIN] Errore:", err);
      setErrore(err.message || "Errore durante il login");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    setTokenPreview("");
    setSuccess("");
    setErrore("");
    setUserRole("guest");
    setUserCredits(0);
    alert("Logout effettuato");
  }

  return (
    <main className="page-root">
      {/* NAVBAR DYANA UGUALE ALLE ALTRE PAGINE */}
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={handleLogout}
      />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Accedi a DYANA</h1>
          <p className="section-subtitle">
            Usa il tuo account DYANA per usare le funzionalità premium
            (Tema Natale AI, Oroscopo, Compatibilità, Q&amp;A).
          </p>
        </header>

        <section className="section">
          <div
            className="card"
            style={{ maxWidth: "480px", margin: "0 auto 24px auto" }}
          >
            <h3 className="card-title" style={{ marginBottom: 8 }}>
              Login
            </h3>
            <p
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.8 }}
            >
              Inserisci le credenziali configurate su{" "}
              <code>astrobot_auth_pub</code>. Dopo il login verrai riportato al{" "}
              <code>Tema Natale</code>.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 12,
              }}
            >
              <div>
                <label className="card-text">Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="demo"
                  required
                />
              </div>

              <div>
                <label className="card-text">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? "Accesso..." : "Accedi"}
              </button>

              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.8rem", marginTop: 4 }}
                onClick={handleLogout}
              >
                Logout
              </button>

              {tokenPreview && (
                <p
                  className="card-text"
                  style={{
                    fontSize: "0.75rem",
                    opacity: 0.65,
                    marginTop: 6,
                  }}
                >
                  Token presente: {tokenPreview}...
                </p>
              )}

              {errore && (
                <p
                  className="card-text"
                  style={{ color: "#ff9a9a", marginTop: 6 }}
                >
                  {errore}
                </p>
              )}
              {success && (
                <p
                  className="card-text"
                  style={{ color: "#9cffb2", marginTop: 6 }}
                >
                  {success}
                </p>
              )}
            </form>

            <p
              className="card-text"
              style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 12 }}
            >
              Torna al{" "}
              <Link href="/tema" className="nav-link">
                Tema Natale
              </Link>
              .
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

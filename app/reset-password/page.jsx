"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar"; 
import { createClient } from "@supabase/supabase-js";

// ==========================
// SUPABASE CLIENT
// ==========================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function ResetPasswordPage() {
  // UI state
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");

  // Navbar (guest)
  const [userRole] = useState("guest");
  const [userCredits] = useState(0);

  // Access token dal link email
  const [accessToken, setAccessToken] = useState(null);
  const [linkOk, setLinkOk] = useState(true);

  // ==========================
  // 🚀 On mount: estrai access_token dall’URL
  // ==========================
  useEffect(() => {
    if (!supabase) {
      setErrore(
        "Reset password non configurato (manca NEXT_PUBLIC_SUPABASE_URL o ANON_KEY)."
      );
      setLinkOk(false);
      return;
    }

    const hash = window.location.hash;
    const token = new URLSearchParams(hash.replace("#", "")).get("access_token");

    if (!token) {
      setErrore(
        "Questo link di reset non è più valido o non contiene un token. Richiedi un nuovo link dalla pagina di login."
      );
      setLinkOk(false);
      return;
    }

    setAccessToken(token);
  }, []);

  // ==========================
  // 🔐 Submit nuova password
  // ==========================
  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    if (!supabase) {
      setErrore(
        "Reset password non configurato (manca NEXT_PUBLIC_SUPABASE_URL o ANON_KEY)."
      );
      return;
    }

    if (!accessToken) {
      setErrore(
        "Token non valido. Richiedi un nuovo link dalla pagina di login."
      );
      return;
    }

    if (!password || !password2) {
      setErrore("Inserisci e conferma la nuova password.");
      return;
    }

    if (password !== password2) {
      setErrore("Le password non coincidono.");
      return;
    }

    if (password.length < 8) {
      setErrore("La password deve avere almeno 8 caratteri.");
      return;
    }

    setLoading(true);
    try {
      // 🚀 RESET PASSWORD SUPABASE (token nel Bearer)
      const { error } = await supabase.auth.updateUser(
        { password },
        {
          accessToken: accessToken, // <- token estratto dal link email
        }
      );

      if (error) {
        console.error("[RESET] Errore updateUser:", error);
        setErrore(
          error.message ||
            "Errore durante l'aggiornamento della password. Richiedi un nuovo link."
        );
        return;
      }

      setSuccess(
        "Password aggiornata con successo! Ora puoi tornare al login DYANA ed accedere."
      );
    } catch (err) {
      console.error("[RESET] Errore inatteso:", err);
      setErrore("Errore inatteso durante il reset. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // UI
  // ==========================
  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={() => {}} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Imposta una nuova password</h1>
          <p className="section-subtitle">
            Stai completando il reset della password per il tuo account DYANA.
          </p>
        </header>

        <section className="section">
          <div
            className="card"
            style={{
              maxWidth: "480px",
              margin: "0 auto 24px auto",
            }}
          >
            {!linkOk ? (
              <>
                <p className="card-text" style={{ marginBottom: 12 }}>
                  {errore ||
                    "Questo link non è valido. Richiedi un nuovo link dalla pagina di login."}
                </p>
                <Link href="/login" className="btn btn-primary">
                  Torna al login
                </Link>
              </>
            ) : (
              <>
                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Scegli una nuova password per il tuo account. Dopo averla
                  aggiornata, torna alla pagina di login DYANA e accedi normalmente.
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
                    <label className="card-text">Nuova password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder="Nuova password"
                      required
                    />
                  </div>

                  <div>
                    <label className="card-text">Conferma nuova password</label>
                    <input
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className="form-input"
                      placeholder="Ripeti la password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  >
                    {loading ? "Aggiornamento..." : "Aggiorna password"}
                  </button>
                </form>

                {errore && (
                  <p
                    className="card-text"
                    style={{
                      color: "#ff9a9a",
                      marginTop: 6,
                    }}
                  >
                    {errore}
                  </p>
                )}

                {success && (
                  <p
                    className="card-text"
                    style={{
                      color: "#9cffb2",
                      marginTop: 6,
                    }}
                  >
                    {success}
                  </p>
                )}

                <p
                  className="card-text"
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.75,
                    marginTop: 12,
                  }}
                >
                  Quando hai finito, puoi tornare al{" "}
                  <Link href="/login" className="nav-link">
                    login DYANA
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

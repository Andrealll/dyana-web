"use client";

import { useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { sendPasswordResetEmail } from "../../lib/authClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    if (!email) {
      setErrore("Inserisci la tua email.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSuccess(
        "Se esiste un account associato a questa email, riceverai un link per reimpostare la password."
      );
    } catch (err) {
      console.error("[FORGOT-PASS] errore:", err);
      setErrore(
        err.message ||
          "Errore durante l'invio dell'email di reset. Riprova più tardi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-root">
      {/* Navbar: ora si auto-gestisce (email + crediti se loggato) */}
      <DyanaNavbar />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Hai dimenticato la password?</h1>
          <p className="section-subtitle">
            Inserisci la tua email: se esiste un account DYANA, riceverai un link
            per impostare una nuova password.
          </p>
        </header>

        <section className="section">
          <div
            className="card"
            style={{
              maxWidth: "480px",
              margin: "0 auto",
            }}
          >
            {errore && (
              <p
                className="card-text"
                style={{ color: "#ff9a9a", marginBottom: 8 }}
              >
                {errore}
              </p>
            )}

            {success && (
              <p
                className="card-text"
                style={{ color: "#9cffb2", marginBottom: 8 }}
              >
                {success}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
              }}
            >
              <label className="card-text">Email</label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: 4 }}
              >
                {loading ? "Invio in corso..." : "Invia link di reset"}
              </button>
            </form>

            <p
              className="card-text"
              style={{
                fontSize: "0.8rem",
                opacity: 0.75,
                marginTop: 12,
              }}
            >
              Hai già reimpostato la password?{" "}
              <Link href="/login" className="nav-link">
                Torna al login
              </Link>
              .
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

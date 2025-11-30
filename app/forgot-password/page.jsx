"use client";

import { useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { sendPasswordResetEmail } from "../../lib/authClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");

  const userRole = "guest";
  const userCredits = 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(email);
      setSuccess("Email inviata! Controlla la tua posta.");
    } catch (err) {
      setErrore(err.message);
    }
  }

  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={() => {}} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Recupera la password</h1>
          <p className="section-subtitle">
            Inserisci la tua email. Riceverai un link per reimpostare la password.
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "480px", margin: "0 auto" }}>
            {errore && <p className="card-text" style={{ color: "#ff9a9a" }}>{errore}</p>}
            {success && <p className="card-text" style={{ color: "#9cffb2" }}>{success}</p>}

            <form
              onSubmit={handleSubmit}
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

              <button type="submit" className="btn btn-primary">
                Invia link
              </button>
            </form>

            <p
              className="card-text"
              style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 12 }}
            >
              Torna al{" "}
              <Link href="/login" className="nav-link">
                login DYANA
              </Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

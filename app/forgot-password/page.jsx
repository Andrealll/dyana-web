"use client";

import { useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { useI18n } from "../../lib/i18n/useI18n";
import { sendPasswordResetEmail } from "../../lib/authClient";

export default function ForgotPasswordPage() {
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    if (!email) {
      setErrore(t("forgotPassword.errors.emailRequired"));
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSuccess(t("forgotPassword.success.emailSent"));
    } catch (err) {
      console.error("[FORGOT-PASS] errore:", err);
      setErrore(
        err.message || t("forgotPassword.errors.sendFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-root">
      <DyanaNavbar />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">{t("forgotPassword.title")}</h1>
          <p className="section-subtitle">
            {t("forgotPassword.subtitle")}
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
              <label className="card-text">
                {t("forgotPassword.form.emailLabel")}
              </label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("forgotPassword.form.emailPlaceholder")}
                disabled={loading}
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: 4 }}
              >
                {loading
                  ? t("forgotPassword.form.loading")
                  : t("forgotPassword.form.submit")}
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
              {t("forgotPassword.footer.prefix")}{" "}
              <Link href="/login" className="nav-link">
                {t("forgotPassword.footer.backToLogin")}
              </Link>
              .
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
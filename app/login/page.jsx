"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { useI18n } from "../../lib/i18n/useI18n";
import { sendAuthMagicLink, setResumeTarget } from "../../lib/authClient";

export default function LoginPage() {
  const { t } = useI18n();

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
        setErrore(t("login.errors.invalidEmail"));
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

      setSuccess(t("login.success.linkSent"));
    } catch (err) {
      console.error("[LoginPage] magic link error", err);
      setErrore(err?.message || t("login.errors.sendFailed"));
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
          <h1 className="section-title">{t("login.title")}</h1>
          <p className="section-subtitle">{t("login.subtitle")}</p>
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
              <label className="card-text">{t("login.form.emailLabel")}</label>
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.form.emailPlaceholder")}
                disabled={loading}
              />

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t("login.form.loading") : t("login.form.submit")}
              </button>

              <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 6 }}>
                {t("login.legal.prefix")}{" "}
                <Link href="/condizioni" className="link" target="_blank" rel="noreferrer">
                  {t("login.legal.terms")}
                </Link>{" "}
                {t("login.legal.andPrivacy")}{" "}
                <Link href="/privacy" className="link" target="_blank" rel="noreferrer">
                  {t("login.legal.privacy")}
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
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DyanaNavbar from "../../components/DyanaNavbar";
import { useI18n } from "../../lib/i18n/useI18n";
import {
  sendAuthMagicLink,
  setResumeTarget,
  loginWithCredentials,
  registerWithEmail,
} from "../../lib/authClient";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [mode, setMode] = useState("login"); // login | register | magic
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = "guest";
  const userCredits = 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleSubmit(e) {
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

      setResumeTarget({ path: "/area-personale" });

      if (mode === "login") {
        if (!password) {
          setErrore(t("login.errors.passwordRequired"));
          return;
        }

        await loginWithCredentials(eNorm, password);
        router.replace("/area-personale");
        return;
      }

      if (mode === "register") {
        if (!password || password.length < 6) {
          setErrore(t("login.errors.passwordMin"));
          return;
        }

        if (password !== password2) {
          setErrore(t("login.errors.passwordMismatch"));
          return;
        }

        await registerWithEmail(eNorm, password);
        await loginWithCredentials(eNorm, password);

        router.replace("/area-personale");
        return;
      }

      if (mode === "magic") {
        const redirectUrl =
          typeof window !== "undefined" && window.location?.origin
            ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
            : "https://dyana.app/auth/callback";

        await sendAuthMagicLink(eNorm, redirectUrl);
        setSuccess(t("login.success.linkSent"));
        return;
      }

      setErrore(t("login.errors.sendFailed"));
    } catch (err) {
      console.error("[LoginPage] auth error", err);
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
          <div className="card" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <button
                type="button"
                className={mode === "login" ? "btn btn-primary" : "btn"}
                onClick={() => {
                  setMode("login");
                  setErrore("");
                  setSuccess("");
                }}
                disabled={loading}
              >
                {t("login.tabs.login")}
              </button>

              <button
                type="button"
                className={mode === "register" ? "btn btn-primary" : "btn"}
                onClick={() => {
                  setMode("register");
                  setErrore("");
                  setSuccess("");
                }}
                disabled={loading}
              >
                {t("login.tabs.register")}
              </button>

              <button
                type="button"
                className={mode === "magic" ? "btn btn-primary" : "btn"}
                onClick={() => {
                  setMode("magic");
                  setErrore("");
                  setSuccess("");
                }}
                disabled={loading}
              >
                {t("login.tabs.magic")}
              </button>
            </div>

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
              onSubmit={handleSubmit}
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

              {mode !== "magic" && (
  <>
    <label className="card-text">
      {t("login.form.passwordLabel")}
    </label>
    <input
      className="form-input"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder={t("login.form.passwordPlaceholder")}
      disabled={loading}
      autoComplete={
        mode === "login" ? "current-password" : "new-password"
      }
    />

{mode === "login" && (
  <Link
    href="/forgot-password"
    className="link"
    style={{ fontSize: "0.9rem", marginTop: "4px" }}
  >
    {t("login.form.forgotPassword")}
  </Link>
)}
  </>
)}

              {mode === "register" && (
                <>
                  <label className="card-text">{t("login.form.repeatPasswordLabel")}</label>
                  <input
                    className="form-input"
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder={t("login.form.repeatPasswordPlaceholder")}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading
                  ? t("login.form.loading")
                  : mode === "login"
                  ? t("login.form.submitLogin")
                  : mode === "register"
                  ? t("login.form.submitRegister")
                  : t("login.form.submitMagic")}
              </button>

              <p
                className="card-text"
                style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 6 }}
              >
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
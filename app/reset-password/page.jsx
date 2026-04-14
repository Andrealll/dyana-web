"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { createClient } from "@supabase/supabase-js";
import { useI18n } from "../../lib/i18n/useI18n";

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
  const { t } = useI18n();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");

  const [userRole] = useState("guest");
  const [userCredits] = useState(0);

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [linkOk, setLinkOk] = useState(true);

  // ==========================
  // On mount: estrai token dall’URL
  // ==========================
  useEffect(() => {
    if (!supabase) {
      setErrore(t("resetPassword.errors.notConfigured"));
      setLinkOk(false);
      return;
    }

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace("#", ""));

    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    const type = params.get("type");

    if (!access || !refresh || type !== "recovery") {
      setErrore(t("resetPassword.errors.invalidLink"));
      setLinkOk(false);
      return;
    }

    setAccessToken(access);
    setRefreshToken(refresh);
  }, [t]);

  // ==========================
  // Submit nuova password
  // ==========================
  async function handleSubmit(e) {
    e.preventDefault();
    setErrore("");
    setSuccess("");

    if (!supabase) {
      setErrore(t("resetPassword.errors.notConfigured"));
      return;
    }

    if (!accessToken || !refreshToken) {
      setErrore(t("resetPassword.errors.invalidToken"));
      return;
    }

    if (!password || !password2) {
      setErrore(t("resetPassword.errors.passwordRequired"));
      return;
    }

    if (password !== password2) {
      setErrore(t("resetPassword.errors.passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setErrore(t("resetPassword.errors.passwordMin"));
      return;
    }

    setLoading(true);

    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error("[RESET] Errore setSession:", sessionError);
        setErrore(
          sessionError.message || t("resetPassword.errors.invalidToken")
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("[RESET] Errore updateUser:", updateError);
        setErrore(
          updateError.message || t("resetPassword.errors.updateFailed")
        );
        return;
      }

      setSuccess(t("resetPassword.success.updated"));

      // pulizia URL
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, "/reset-password");
      }
    } catch (err) {
      console.error("[RESET] Errore inatteso:", err);
      setErrore(t("resetPassword.errors.unexpected"));
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
          <h1 className="section-title">{t("resetPassword.title")}</h1>
          <p className="section-subtitle">
            {t("resetPassword.subtitle")}
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
                  {errore || t("resetPassword.errors.invalidLinkFallback")}
                </p>
                <Link href="/login" className="btn btn-primary">
                  {t("resetPassword.cta.backToLogin")}
                </Link>
              </>
            ) : (
              <>
                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  {t("resetPassword.description")}
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
                    <label className="card-text">
                      {t("resetPassword.form.passwordLabel")}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      placeholder={t("resetPassword.form.passwordPlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="card-text">
                      {t("resetPassword.form.repeatPasswordLabel")}
                    </label>
                    <input
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className="form-input"
                      placeholder={t("resetPassword.form.repeatPasswordPlaceholder")}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  >
                    {loading
                      ? t("resetPassword.form.loading")
                      : t("resetPassword.form.submit")}
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
                  {t("resetPassword.footer.prefix")}{" "}
                  <Link href="/login" className="nav-link">
                    {t("resetPassword.footer.loginLink")}
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
"use client";

import { useEffect, useState } from "react";
import DyanaNavbar from "../../components/DyanaNavbar";
import { useI18n } from "../../lib/i18n/useI18n";
import { getToken, clearToken } from "../../lib/authClient";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_BASE;

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function CreditiPage() {
  const { t } = useI18n();

  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPack, setLoadingPack] = useState(null);
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [jwt, setJwt] = useState(null);

  const [userRole, setUserRole] = useState("guest");
  const [userCredits] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setJwt(token);
      setUserRole("user");
    } else {
      setJwt(null);
      setUserRole("guest");
    }
  }, []);

  useEffect(() => {
    async function fetchPacks() {
      setErrore("");
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/payments/packs`);
        if (!res.ok) {
          throw new Error(t("creditsPage.errors.loadPacks"));
        }

        const data = await res.json();
        setPacks(data.packs || []);
      } catch (err) {
        console.error("[CREDITI] Errore load packs:", err);
        setErrore(err.message || t("creditsPage.errors.loadPacksGeneric"));
      } finally {
        setLoading(false);
      }
    }

    fetchPacks();
  }, [t]);

  async function handleCompra(packId) {
    setErrore("");
    setSuccess("");

    const currentToken = getToken();
    if (!currentToken) {
      setJwt(null);
      setUserRole("guest");
      setErrore(t("creditsPage.errors.loginRequired"));
      return;
    }

    setJwt(currentToken);

    const payload = decodeJwtPayload(currentToken);
    const userId = payload?.sub;

    if (!userId) {
      setErrore(t("creditsPage.errors.invalidToken"));
      return;
    }

    const selectedPack = packs.find((p) => p.id === packId);
    if (!selectedPack?.stripe_price_id) {
      setErrore(t("creditsPage.errors.invalidPack"));
      return;
    }

    setLoadingPack(packId);

    try {
      const successUrl = `${window.location.origin}/crediti/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/crediti/cancel`;

      const res = await fetch(`${API_BASE}/billing/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          price_id: selectedPack.stripe_price_id,
          success_url: successUrl,
          cancel_url: cancelUrl,
          user_id: userId,
          pack_id: packId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("creditsPage.errors.checkoutSession"));
      }

      const data = await res.json();

      if (data.checkout_url) {
        const url = data.checkout_url;

        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url });
          return;
        }

        window.location.href = url;
        return;
      }

      setSuccess(t("creditsPage.errors.missingCheckoutUrl"));
    } catch (err) {
      console.error("[CREDITI] Errore acquisto:", err);
      setErrore(err.message || t("creditsPage.errors.unexpectedPurchase"));
    } finally {
      setLoadingPack(null);
    }
  }

  function handleLogout() {
    clearToken();
    setJwt(null);
    setUserRole("guest");
  }

  return (
    <main className="page-root">
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={handleLogout}
      />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">{t("creditsPage.title")}</h1>
          <p className="section-subtitle">{t("creditsPage.subtitle")}</p>
        </header>

        <section className="section">
          {loading && packs.length === 0 ? (
            <p className="card-text">{t("creditsPage.loading.packs")}</p>
          ) : (
            <div
              className="card"
              style={{
                maxWidth: "960px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="card"
                  style={{
                    border:
                      pack.id === "medium"
                        ? "1px solid var(--dyana-gold)"
                        : "1px solid rgba(255,255,255,0.08)",
                    boxShadow:
                      pack.id === "medium"
                        ? "0 0 16px rgba(187, 154, 99, 0.35)"
                        : "none",
                  }}
                >
                  {pack.id === "medium" && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--dyana-gold)",
                        marginBottom: 6,
                      }}
                    >
                      {t("creditsPage.pack.bestValue")}
                    </div>
                  )}

                  <h2
                    className="section-title"
                    style={{ fontSize: "1.25rem", marginBottom: 8 }}
                  >
                    {pack.name}
                  </h2>

                  <p className="card-text" style={{ marginBottom: 8 }}>
                    {pack.description}
                  </p>

                  <p className="card-text" style={{ marginBottom: 4 }}>
                    <strong>{pack.credits}</strong> {t("creditsPage.pack.credits")}
                  </p>

                  <p
                    className="card-text"
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {pack.price_eur} €
                  </p>

                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "auto" }}
                    disabled={loadingPack === pack.id}
                    onClick={() => handleCompra(pack.id)}
                  >
                    {loadingPack === pack.id
                      ? t("creditsPage.pack.preparingPayment")
                      : t("creditsPage.pack.buyNow")}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              maxWidth: "640px",
              margin: "24px auto 0 auto",
              textAlign: "center",
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

            <p
              className="card-text"
              style={{ fontSize: "0.85rem", opacity: 0.8 }}
            >
              {t("creditsPage.info.footer")}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
// AREA PERSONALE
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { useI18n } from "../../lib/i18n/useI18n";
import {
  getToken,
  fetchCreditsState,
  fetchUsageHistory,
  updateMarketingConsent,
  deleteProfile,
  clearToken,
} from "../../lib/authClient";

// =======================
// Helpers formattazione
// =======================
function formatUsageDate(value, locale) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const dateLocale = locale === "en" ? "en-GB" : "it-IT";

  return d.toLocaleString(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUsageFeature(feature, scope, t) {
  if (feature === "tema_ai") return t("areaPersonal.features.birthChart");
  if (feature === "sinastria_ai") return t("areaPersonal.features.synastry");

  if (feature === "oroscopo_ai") {
    const labelByScope = {
      daily: t("areaPersonal.features.horoscopeDaily"),
      weekly: t("areaPersonal.features.horoscopeWeekly"),
      monthly: t("areaPersonal.features.horoscopeMonthly"),
      yearly: t("areaPersonal.features.horoscopeYearly"),
    };
    return labelByScope[scope] || t("areaPersonal.features.horoscopeGeneric");
  }

  // Alcuni record hanno feature tipo "oroscopo_ai_monthly"
  if (feature && feature.startsWith("oroscopo_ai_")) {
    const suffix = feature.replace("oroscopo_ai_", "");
    const labelBySuffix = {
      daily: t("areaPersonal.features.horoscopeDaily"),
      weekly: t("areaPersonal.features.horoscopeWeekly"),
      monthly: t("areaPersonal.features.horoscopeMonthly"),
      yearly: t("areaPersonal.features.horoscopeYearly"),
    };
    return labelBySuffix[suffix] || t("areaPersonal.features.horoscopeGeneric");
  }

  return feature || "";
}

function formatPurchaseAmount(amount, currency) {
  if (amount == null) return "";
  const euros = amount / 100;
  const curr = currency || "EUR";
  return `${euros.toFixed(2)} ${curr}`;
}

export default function AreaPersonalePage() {
  const router = useRouter();
  const { t, locale } = useI18n();

  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [erroreMarketing, setErroreMarketing] = useState("");
  const [successMarketing, setSuccessMarketing] = useState("");

  const [creditsState, setCreditsState] = useState(null);
  const [usage, setUsage] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🔹 valori per la navbar, derivati dallo stato reale dei crediti
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    async function loadData() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setErrore("");

        const cs = await fetchCreditsState(token);
        console.log("[AREA] credits state:", cs);
        setCreditsState(cs);

        // marketing
        setMarketingConsent(Boolean(cs?.marketing_consent));

        // navbar
        const role = cs?.role || "user";
        const total = cs?.total_available ?? 0;
        setUserRole(role);
        setUserCredits(total);

        const usageData = await fetchUsageHistory(token);
        setUsage(usageData?.usage || usageData?.usage_logs || []);
        setPurchases(usageData?.purchases || []);
      } catch (err) {
        console.error("[AREA PERSONALE] errore:", err);
        setErrore(t("areaPersonal.errors.loadData"));
      } finally {
        setLoading(false);
      }
    }

    loadData();

    function handleCreditsRefresh() {
      console.log("[AREA PERSONALE] Evento dyana:refresh-credits → reload");
      loadData();
    }

    function handleLegacyCreditsUpdated() {
      console.log("[AREA PERSONALE] Evento diyana-credits-updated → reload");
      loadData();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("dyana:refresh-credits", handleCreditsRefresh);
      window.addEventListener(
        "diyana-credits-updated",
        handleLegacyCreditsUpdated
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "dyana:refresh-credits",
          handleCreditsRefresh
        );
        window.removeEventListener(
          "diyana-credits-updated",
          handleLegacyCreditsUpdated
        );
      }
    };
  }, [router, t]);

  function handleLogoutFromNavbar() {
    clearToken();

    setCreditsState(null);
    setUsage([]);
    setPurchases([]);
    setErrore("");
    setUserRole("guest");
    setUserCredits(0);

    router.push("/");
  }

  function formatUsageMode(u) {
    if (!u) return "";
    if (u.billing_mode === "free") return "FREE";
    if (u.billing_mode === "paid") return "PREMIUM";
    if (u.tier === "free") return "FREE";
    if (u.tier === "premium") return "PREMIUM";
    return "";
  }

  async function handleToggleMarketing() {
    const token = getToken();
    if (!token) {
      setErrore(t("areaPersonal.errors.sessionExpired"));
      return;
    }

    const newValue = !marketingConsent;
    setErroreMarketing("");
    setSuccessMarketing("");

    try {
      await updateMarketingConsent(token, newValue);
      setMarketingConsent(newValue);
      setSuccessMarketing(t("areaPersonal.success.marketingUpdate"));
      setCreditsState((prev) =>
        prev ? { ...prev, marketing_consent: newValue } : prev
      );
    } catch (err) {
      console.error("[AREA-PERSONALE] errore marketing:", err);
      setErroreMarketing(t("areaPersonal.errors.marketingUpdate"));
    }
  }

  async function handleDeleteProfile() {
    const token = getToken();
    if (!token) {
      setErrore(t("areaPersonal.errors.sessionExpired"));
      return;
    }

    setDeleting(true);
    setErrore("");

    try {
      await deleteProfile(token);
      localStorage.removeItem("dyana_jwt");
      window.location.href = "/";
    } catch (err) {
      console.error("[AREA-PERSONALE] errore cancellazione profilo:", err);
      setErrore(t("areaPersonal.errors.deleteProfile"));
      setDeleting(false);
    }
  }

  const email = creditsState?.email || "—";

  return (
    <main className="page-root">
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={handleLogoutFromNavbar}
      />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">{t("areaPersonal.title")}</h1>
          <p className="section-subtitle">{t("areaPersonal.subtitle")}</p>
        </header>

        <section className="section" style={{ display: "grid", gap: 16 }}>
          {errore && (
            <p className="card-text" style={{ color: "#ff9a9a" }}>
              {errore}
            </p>
          )}
          {erroreMarketing && (
            <p className="card-text" style={{ color: "#ffb199" }}>
              {erroreMarketing}
            </p>
          )}
          {successMarketing && (
            <p className="card-text" style={{ color: "#9cffb2" }}>
              {successMarketing}
            </p>
          )}

          {/* PROFILO UTENTE */}
          <div className="card">
            <h2 className="card-title">{t("areaPersonal.profile.title")}</h2>

            <p
              className="card-text"
              style={{ marginTop: 12, marginBottom: 8 }}
            >
              <strong>{t("areaPersonal.profile.email")}</strong>{" "}
              <span style={{ opacity: email === "—" ? 0.8 : 1 }}>{email}</span>
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 8,
              }}
            >
              <label
                className="card-text"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={handleToggleMarketing}
                  style={{ margin: 0 }}
                />
                <span>{t("areaPersonal.profile.marketingConsent")}</span>
              </label>
              <Link
                href="/privacy"
                className="nav-link"
                style={{ fontSize: "0.8rem" }}
              >
                {t("areaPersonal.profile.privacyNotice")}
              </Link>
            </div>
          </div>

          {/* CREDITI DISPONIBILI */}
          <div className="card">
            <h2 className="card-title">{t("areaPersonal.credits.title")}</h2>
            {loading && !creditsState ? (
              <p className="card-text" style={{ marginTop: 8 }}>
                {t("areaPersonal.credits.loading")}
              </p>
            ) : creditsState ? (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                }}
              >
                <p className="card-text">
                  <strong>{creditsState.total_available}</strong>{" "}
                  {t("areaPersonal.credits.total")}
                </p>
                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  {t("areaPersonal.credits.paid")} {creditsState.paid} •{" "}
                  {t("areaPersonal.credits.freeLeftToday")}{" "}
                  {creditsState.free_left}
                </p>
                <Link href="/crediti" className="btn btn-primary">
                  {t("areaPersonal.credits.recharge")}
                </Link>
              </div>
            ) : (
              <p
                className="card-text"
                style={{ opacity: 0.8, marginTop: 8 }}
              >
                {t("areaPersonal.credits.noInfo")}
              </p>
            )}
          </div>

          {/* ULTIME LETTURE PREMIUM */}
          <div className="card">
            <h2 className="card-title">{t("areaPersonal.readings.title")}</h2>
            {loading && !usage.length ? (
              <p className="card-text" style={{ marginTop: 8 }}>
                {t("areaPersonal.credits.loading")}
              </p>
            ) : usage.length === 0 ? (
              <p className="card-text" style={{ opacity: 0.8, marginTop: 8 }}>
                {t("areaPersonal.readings.empty")}
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0 0",
                }}
              >
                {usage.map((u) => {
                  const tierLabel =
                    u.tier === "premium"
                      ? t("areaPersonal.readings.tierPremium")
                      : t("areaPersonal.readings.tierFree");
                  const paid = u.cost_paid_credits ?? 0;
                  const free = u.cost_free_credits ?? 0;

                  return (
                    <li
                      key={u.id}
                      className="card-text"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>
                        {formatUsageDate(u.when, locale)} –{" "}
                        {formatUsageFeature(u.feature, u.scope, t)}{" "}
                        <span
                          style={{
                            fontSize: "0.8rem",
                            opacity: 0.8,
                            marginLeft: 4,
                          }}
                        >
                          ({tierLabel})
                        </span>
                      </span>

                      <span>
                        {paid || free
                          ? `${paid} ${t("areaPersonal.readings.paidCredits")} / ${free} ${t("areaPersonal.readings.freeCredits")}`
                          : t("areaPersonal.readings.zeroCredits")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* RICARICHE */}
          <div className="card">
            <h2 className="card-title">{t("areaPersonal.purchases.title")}</h2>
            {loading && !purchases.length ? (
              <p className="card-text" style={{ marginTop: 8 }}>
                {t("areaPersonal.credits.loading")}
              </p>
            ) : purchases.length === 0 ? (
              <p
                className="card-text"
                style={{ opacity: 0.8, marginTop: 8 }}
              >
                {t("areaPersonal.purchases.empty")}
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0 0",
                }}
              >
                {purchases.map((p) => (
                  <li
                    key={p.id}
                    className="card-text"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>
                      {formatUsageDate(p.when, locale)} – {p.product}
                    </span>
                    <span>
                      {formatPurchaseAmount(p.amount, p.currency)}
                      {p.credits_added
                        ? ` • +${p.credits_added} ${t("areaPersonal.purchases.creditsAdded")}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GESTIONE ACCOUNT */}
          <div className="card">
            <h2 className="card-title">{t("areaPersonal.account.title")}</h2>
            <p
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.85, marginTop: 8 }}
            >
              {t("areaPersonal.account.deleteWarning")}
            </p>

            {showDeleteConfirm ? (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.9 }}
                >
                  {t("areaPersonal.account.deleteConfirm")}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    disabled={deleting}
                    onClick={handleDeleteProfile}
                  >
                    {deleting
                      ? t("areaPersonal.account.deleting")
                      : t("areaPersonal.account.confirmDelete")}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    {t("areaPersonal.account.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t("areaPersonal.account.delete")}
              </button>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
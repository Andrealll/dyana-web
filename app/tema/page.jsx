// app/tema/page.jsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { enqueueConversionEvent } from "../../components/ConversionTracker";
import { useI18n } from "../../lib/i18n/useI18n";
import {
  loginWithCredentials,
  registerWithEmail,
  getToken,
  clearToken,
  getAnyAuthTokenAsync,
  ensureGuestToken,
  fetchCreditsState,
  setResumeTarget,
  sendAuthMagicLink,
  updateMarketingConsent,
} from "../../lib/authClient";
import {
  getCountryOptions,
  buildCityWithCountry,
} from "../../lib/constantsCountry";



// ==========================
// COSTANTI GLOBALI
// ==========================
const TYPEBOT_DYANA_ID = "dyana-ai";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8001"
    : "https://chatbot-test-0h4o.onrender.com");

const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";
const OROSCOPO_DRAFT_KEY = "dyana_oroscopo_draft_v1";

// non usata qui, ok lasciarla

const AUTH_DONE_KEY = "dyana_auth_done";
const POST_LOGIN_ACTION_KEY = "dyana_post_login_action";
if (typeof window !== "undefined") {
  console.log("[DYANA] API_BASE runtime:", API_BASE);
}

// ==========================
// Helper decode JWT
// ==========================
function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ==========================
// NORMALIZZAZIONE CAPITOLI
// ==========================
function normalizeCapitoli(capitoliRaw) {
  if (!capitoliRaw) return [];
  if (Array.isArray(capitoliRaw)) return capitoliRaw;

  if (typeof capitoliRaw === "object") {
    return Object.entries(capitoliRaw).map(([titolo, testo]) => ({
      chiave: String(titolo).toLowerCase().replace(/\s+/g, "_"),
      titolo,
      testo,
    }));
  }
  return [];
}

// ==========================
// COMPONENTE PRINCIPALE
// ==========================
export default function TemaPage() {
 const { t, locale } = useI18n();

  console.log("[TEMA PAGE] BUILD MARKER = 2025-12-19-XYZ");

  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
	country: "",
  });

  const [oraIgnota, setOraIgnota] = useState(false);

  const [loading, setLoading] = useState(false);
  
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const [errore, setErrore] = useState("");
  const [noCredits, setNoCredits] = useState(false);

  const [interpretazione, setInterpretazione] = useState("");
  const [contenuto, setContenuto] = useState(null);
  const [risultato, setRisultato] = useState(null);
  const [temaVis, setTemaVis] = useState(null);

  const [billing, setBilling] = useState(null);

  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  const [sessionId] = useState(() => `tema_session_${Date.now()}`);
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  // ===== UX allineata a Oroscopo: free sempre sopra, premium sotto =====
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  // ===== Navbar/credits state (allineato a /credits/state) =====
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_tema");

  // trial guest 1/0 (o null se non disponibile)
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  // Email gate inline (allineato a Oroscopo)
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("magic");

  // magic | register | login
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  // UX: feedback chiaro post-login e loading Premium
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [postAuthToast, setPostAuthToast] = useState("");
  const [premiumCtaLoading, setPremiumCtaLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);

  // Consenso marketing: prefleggato a sì
  const [gateMarketing, setGateMarketing] = useState(true);

  const isLoggedIn = !!getToken() && userRole !== "guest";

  const isPremium = premiumLoaded;

  // ==========================
  // Mappa sezioni (legacy)
  // ==========================
  const sectionLabels = {
    psicologia_profonda: t("tema.sections.psicologia_profonda"),
    amore_relazioni: t("tema.sections.amore_relazioni"),
    lavoro_carriera: t("tema.sections.lavoro_carriera"),
    fortuna_crescita: t("tema.sections.fortuna_crescita"),
    talenti: t("tema.sections.talenti"),
    sfide: t("tema.sections.sfide"),
    consigli: t("tema.sections.consigli"),
  };

  const capitoliArray = normalizeCapitoli(contenuto?.capitoli);

  // ==========================
  // Testo passato a DYANA (Q&A)
  // ==========================
  let readingTextForDyana = interpretazione || "";

  if (contenuto) {
    if (isPremium && capitoliArray.length > 0) {
      const extraParts = [];
      capitoliArray.forEach((cap, idx) => {
        const titolo = cap.titolo || `${t("tema.premium.chapter")} ${idx + 1}`;
        const testo = cap.testo || cap.contenuto || cap.testo_breve || "";
        if (testo) extraParts.push(`${titolo}:\n${testo}`);
      });
      if (extraParts.length > 0) {
        readingTextForDyana +=
          (readingTextForDyana ? "\n\n" : "") + extraParts.join("\n\n");
      }
    } else if (isPremium) {
      const extraParts = [];
      Object.entries(sectionLabels).forEach(([key, label]) => {
        const text = contenuto?.[key];
        if (text) extraParts.push(`${label}:\n${text}`);
      });
      if (extraParts.length > 0) {
        readingTextForDyana +=
          (readingTextForDyana ? "\n\n" : "") + extraParts.join("\n\n");
      }
    }
  }

  const hasReading = !!interpretazione;

  // ======================================================
  // Refresh user/credits (allineato Oroscopo)
  // ======================================================
  const refreshUserFromToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_tema");
      return;
    }
    const payload = decodeJwtPayload(token);
    setUserRole(payload?.role || "free");
    setUserIdForDyana(payload?.sub || "guest_tema");
  }, []);

  const refreshCreditsUI = useCallback(async () => {
    try {
      const token = await getAnyAuthTokenAsync();
      if (!token) return;

      const state = await fetchCreditsState(token);

      const role = state?.role || state?.cs_role || null;
      const remaining =
        typeof state?.remaining_credits === "number"
          ? state.remaining_credits
          : typeof state?.cs_remaining_credits === "number"
          ? state.cs_remaining_credits
          : null;

      const trialAvailable =
        typeof state?.trial_available === "number"
          ? state.trial_available
          : typeof state?.cs_trial_available === "number"
          ? state.cs_trial_available
          : null;

      if (role) setUserRole(role);
      if (remaining != null) setUserCredits(remaining);
      if (trialAvailable != null) setGuestTrialLeft(trialAvailable);
    } catch (e) {
      console.warn("[TEMA] refreshCreditsUI failed:", e?.message || e);
    }
  }, []);

  useEffect(() => {
    refreshUserFromToken();

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }, [refreshUserFromToken, refreshCreditsUI]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onAuthDone = async () => {
      try {
        localStorage.removeItem(AUTH_DONE_KEY);
      } catch {}

      refreshUserFromToken();
      await refreshCreditsUI();

      setEmailGateOpen(false);
      setGateErr("");
      setGateMsg("");

      setJustLoggedIn(true);
      setPostAuthToast(t("tema.messages.postLoginToast"));
      setTimeout(() => setJustLoggedIn(false), 6000);

      try {
        localStorage.removeItem(POST_LOGIN_ACTION_KEY);
      } catch {}
    };

    const storageHandler = (e) => {
      if (e?.key === AUTH_DONE_KEY) onAuthDone();
    };

    const localHandler = (e) => {
      if (e?.detail?.type === "AUTH_DONE") onAuthDone();
    };

    window.addEventListener("storage", storageHandler);
    window.addEventListener("dyana:auth", localHandler);

    let bc = null;
    try {
      bc = new BroadcastChannel("dyana_auth");
      bc.onmessage = (msg) => {
        if (msg?.data?.type === "AUTH_DONE") onAuthDone();
      };
    } catch {}

    try {
      const pending = localStorage.getItem(AUTH_DONE_KEY);
      if (pending) onAuthDone();
    } catch {}

    return () => {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("dyana:auth", localHandler);
      try {
        bc && bc.close();
      } catch {}
    };
  }, [refreshUserFromToken, refreshCreditsUI, t]);

  function handleLogout() {
    clearToken();
    setUserRole("guest");
    setUserCredits(0);
    setUserIdForDyana("guest_tema");
    setGuestTrialLeft(null);

    setPremiumLoaded(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setDiyanaOpen(false);

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
      setLoading(false);
      setGateLoading(false);
    })();
  }

  // ======================================================
  // CALL /tema_ai
  // ======================================================
 async function callTema({ tier }) {
    const oraEffettiva = oraIgnota ? null : form.ora || "";

    const payload = {
      citta: form.citta,
      data: form.data,
      ora: oraEffettiva,
      country_code: form.country || null,
      nome: form.nome || null,
      tier,
      lang: locale === "en" ? "en" : "it",
      ora_ignota: oraIgnota,
    };

    console.log("[TEMA][CALL] /tema_ai", { tier, API_BASE, payload });

    let token = await getAnyAuthTokenAsync();
    console.log("[TEMA][CALL] token present?", !!token);
    if (!token && ASTROBOT_JWT_TEMA) token = ASTROBOT_JWT_TEMA;

    const headers = {
      "Content-Type": "application/json",
      "X-Client-Source": "dyana_web/tema",
      "X-Client-Session": sessionId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/tema_ai`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return { res, data };
  }

  // ======================================================
  // Apply response (parsing invariato)
  // ======================================================
  function applyTemaResponse(data) {
    setRisultato(data);

    if (data?.billing) {
      setBilling(data.billing);
      const remaining = data.billing.remaining_credits;
      if (typeof remaining === "number") {
        setUserCredits(remaining);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dyana-credits-updated", {
              detail: {
                feature: "tema_ai",
                remaining_credits: remaining,
                billing_mode: data.billing.mode,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("dyana:refresh-credits", {
              detail: {
                feature: "tema_ai",
                remaining_credits: remaining,
                billing_mode: data.billing.mode,
              },
            })
          );
        }
      }
    } else {
      setBilling(null);
    }

    const chartBase64 =
      data?.chart_png_base64 || data?.tema_vis?.chart_png_base64 || null;
    const graficoJson = data?.tema_vis?.grafico || null;

    const metaVis =
      (data?.tema_vis && data.tema_vis.meta) || data?.tema_meta || null;
    const pianetiVis = data?.tema_vis?.pianeti || [];
    const aspettiVis = data?.tema_vis?.aspetti || [];

    if (
      chartBase64 ||
      graficoJson ||
      metaVis ||
      pianetiVis.length > 0 ||
      aspettiVis.length > 0
    ) {
      setTemaVis({
        chart_png_base64: chartBase64,
        grafico: graficoJson,
        meta: metaVis,
        pianeti: pianetiVis,
        aspetti: aspettiVis,
      });
    } else {
      setTemaVis(null);
    }

    setRisultato(data?.result || null);

    const content =
      data?.result?.content ??
      data?.tema_ai?.content ??
      data?.tema_ai ??
      data?.content ??
      null;

    setContenuto(content);

    const resultWrapper = data?.result || null;
    if (resultWrapper?.error) {
      setInterpretazione("");
      setErrore(
        `${t("tema.errors.aiPrefix")}: ${resultWrapper.error}` +
          (resultWrapper.parse_error ? ` — ${resultWrapper.parse_error}` : "")
      );
      setReadingPayload(data);
      return;
    }

    const profiloGenerale = (content?.profilo_generale || "").trim();
    setInterpretazione(
      profiloGenerale || t("tema.messages.interpretationUnavailable")
    );

    const meta = data?.payload_ai?.meta ?? content?.meta ?? {};

    const readingIdFromBackend = meta.reading_id || meta.id || `tema_${Date.now()}`;

    setReadingId(readingIdFromBackend);
    setReadingPayload(data);

    setKbTags(meta.kb_tags || meta.kb || ["tema_natale"]);
  }

  // ======================================================
  // FREE (sempre primo step)
  // ======================================================
  async function generaFree() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);

    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");

    setPremiumLoaded(false);

    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);
    setBilling(null);
    setTemaVis(null);

    try {
      const { res, data } = await callTema({ tier: "free" });

      if (!res.ok) {
        const msg =
          (data && (data.error || data.detail || data.message)) ||
          `${t("tema.errors.generationStatusPrefix")} ${res.status}).`;
        setErrore(
          typeof msg === "string" ? msg : t("tema.errors.generationGeneric")
        );
        return;
      }

      applyTemaResponse(data);
      await refreshCreditsUI();
    } catch (e) {
      setErrore(t("tema.errors.serverUnavailable"));
    } finally {
      setPremiumCtaLoading(false);
      setSlowLoading(false);
      setLoading(false);
    }
  }

  // ======================================================
  // PREMIUM (secondo step via CTA)
  // ======================================================
  async function generaPremium() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    setGateErr("");
    console.log("[TEMA][PREMIUM] start", { userRole, isLoggedIn, loading });
    try {
      const { res, data } = await callTema({ tier: "premium" });

      if (!res.ok) {
        const errorCode = data?.error_code || data?.code || data?.error || data?.detail;
        const isCreditsError =
          res.status === 402 ||
          res.status === 403 ||
          (typeof errorCode === "string" &&
            errorCode.toLowerCase().includes("credit"));

        const msg =
          (data && (data.error || data.detail || data.message)) ||
          `${t("tema.errors.generationStatusPrefix")} ${res.status}).`;

        if (isCreditsError) {
          setNoCredits(true);
          setErrore(t("tema.errors.premiumNeedsCredits"));
          await refreshCreditsUI();
          return;
        }

        setErrore(
          typeof msg === "string" ? msg : t("tema.errors.generationGeneric")
        );
        return;
      }

      applyTemaResponse(data);
      setPremiumLoaded(true);
      enqueueConversionEvent("tema_completed", {
        feature: "tema",
        tier: "premium",
      });
      setEmailGateOpen(false);
      setDiyanaOpen(false);
      await refreshCreditsUI();
    } catch (e) {
      console.error("[TEMA][PREMIUM] failed:", e);
      setErrore(t("tema.errors.serverUnavailable"));
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // Gate open / Approfondisci click
  // ======================================================
  function openEmailGate() {
    if (guestTrialLeft !== 0) return;
    setGateErr("");
    setGateLoading(false);
    setGateMode(guestTrialLeft === 0 ? "magic" : "register");
    setEmailGateOpen(true);

    const trial = guestTrialLeft;

    if (trial === 0) {
      setGateMsg(t("tema.messages.guestContinueWithEmail"));
    } else {
      setGateMsg(t("tema.messages.emailToContinue"));
    }
  }

  async function handleApprofondisciClick() {
    setErrore("");
    setNoCredits(false);

    if (premiumLoaded) return;

    setPremiumCtaLoading(true);
    setSlowLoading(false);
    const slowTimer = setTimeout(() => setSlowLoading(true), 12000);

    try {
      if (isLoggedIn) {
        await generaPremium();
        return;
      }

      if (guestTrialLeft === 1) {
        await generaPremium();
        return;
      }

      openEmailGate();
    } catch (e) {
    } finally {
      clearTimeout(slowTimer);
      setPremiumCtaLoading(false);
      setSlowLoading(false);
    }
  }

  // ======================================================
  // Submit gate
  // ======================================================
  async function submitInlineAuth(e) {
    e.preventDefault();

    setGateErr("");
    setGateLoading(true);

    try {
      const email = (gateEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        setGateErr(t("tema.errors.invalidEmail"));
        return;
      }

      try {
        localStorage.setItem("dyana_pending_email", email);
      } catch {}

      setResumeTarget({ path: "/tema", readingId: "tema_inline" });

      if (guestTrialLeft === 0) {
        if (gateMode === "magic") {
          const redirectUrl =
            typeof window !== "undefined" && window.location?.origin
              ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
              : "https://dyana.app/auth/callback";

          try {
            localStorage.removeItem(POST_LOGIN_ACTION_KEY);
          } catch {}

          await sendAuthMagicLink(email, redirectUrl);

          setGateMsg(t("tema.messages.linkSent"));
          setGateLoading(false);
          return;
        }

        if (gateMode === "login") {
          if (!gatePass) {
            setGateErr(t("tema.errors.passwordRequired"));
            return;
          }
          await loginWithCredentials(email, gatePass);
        } else {
          if (!gatePass || gatePass.length < 6) {
            setGateErr(t("tema.errors.passwordMinLength"));
            return;
          }
          if (gatePass !== gatePass2) {
            setGateErr(t("tema.errors.passwordsMismatch"));
            return;
          }
          await registerWithEmail(email, gatePass);
        }

        try {
          localStorage.removeItem(POST_LOGIN_ACTION_KEY);
        } catch {}

        refreshUserFromToken();
        await refreshCreditsUI();

        setEmailGateOpen(false);
        setGateMsg(t("tema.messages.loginCompletedContinue"));
        setGateLoading(false);
        return;
      }

      setGateMsg(t("tema.messages.generatingTema"));

      const siteBase = (
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      ).replace(/\/+$/, "");
      const redirectUrl = `${siteBase}/auth/callback`;

      try {
        const userToken = getToken();
        if (userToken) {
          const payload = decodeJwtPayload(userToken);
          const role = (payload?.role || "").toLowerCase();
          const sub = payload?.sub || "";
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              sub
            );

          if (role !== "guest" && isUuid) {
            await updateMarketingConsent(userToken, !!gateMarketing);
          }
        }
      } catch (err) {
        console.warn(
          "[TEMA][INLINE-AUTH] updateMarketingConsent fallito (non blocco):",
          err?.message || err
        );
      }

      try {
        await sendAuthMagicLink(email, redirectUrl);
      } catch (err) {
        console.warn(
          "[TEMA][INLINE-AUTH] magic link non inviato (non blocco):",
          err?.message || err
        );
      }

      await generaPremium();
      await refreshCreditsUI();
      return;
    } catch (err) {
      setGateErr(err?.message || t("tema.errors.genericActionFailed"));
    } finally {
      setGateLoading(false);
    }
  }

// ==========================
// URL Typebot
// ==========================
const typebotUrl = useMemo(() => {
  const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
  try {
    const params = new URLSearchParams();

    if (userIdForDyana) params.set("user_id", userIdForDyana);
    if (sessionId) params.set("session_id", sessionId);

    params.set("reading_id", readingId || "tema_inline");
    params.set("reading_type", "tema_natale");
    params.set("reading_label", "Il tuo Tema Natale");

    const safeReadingText = (readingTextForDyana || "").slice(0, 6000);
    if (safeReadingText) params.set("reading_text", safeReadingText);

    // 👇 AGGIUNTA LINGUA
    params.set("lang", locale === "en" ? "en" : "it");

    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  } catch {
    return baseUrl;
  }
}, [
  userIdForDyana,
  sessionId,
  readingId,
  readingTextForDyana,
  locale, // 👈 AGGIUNGI QUESTO
]);

  // ==========================
  // RENDER
  // ==========================
  return (
    <main className="page-root">
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={handleLogout}
      />

      {justLoggedIn && (
        <section className="section" style={{ paddingTop: 12, paddingBottom: 0 }}>
          <div
            className="card"
            style={{
              maxWidth: 850,
              margin: "0 auto",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            <h4 className="card-subtitle" style={{ marginBottom: 6 }}>
              {t("tema.messages.postLoginTitle")}
            </h4>
            <p className="card-text" style={{ opacity: 0.9 }}>
              {postAuthToast}
            </p>

            <div
              style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setJustLoggedIn(false);
                  const el = document.getElementById("dyana-approfondisci");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  if (el && typeof el.focus === "function") el.focus();
                }}
              >
                {t("tema.gate.continue")}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setJustLoggedIn(false)}
              >
                {t("tema.gate.close")}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">{t("tema.hero.title")}</h1>
          <p className="section-subtitle">
            {t("tema.hero.subtitleLine1")}
            <br />
            {t("tema.hero.subtitleLine2Before")}{" "}
            <strong>{t("tema.hero.subtitleLine2Highlight")}</strong>{" "}
            {t("tema.hero.subtitleLine2After")}
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label className="card-text">{t("tema.form.nameLabel")}</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                  placeholder={t("tema.form.namePlaceholder")}
                />
              </div>

              <div className="form-row" style={{ display: "flex", gap: "16px" }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="data_nascita" className="card-text">
                    {t("tema.form.birthDate")}
                  </label>
                  <input
                    id="data_nascita"
                    type="date"
                    className="form-input"
                    value={form.data}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="ora_nascita" className="card-text">
                    {t("tema.form.birthTime")}
                  </label>
                  <input
                    id="ora_nascita"
                    type="time"
                    className="form-input"
                    value={oraIgnota ? "" : form.ora || ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ora: e.target.value }))
                    }
                    disabled={oraIgnota}
                    required={!oraIgnota}
                  />
                </div>

                <div
                  className="form-field"
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "8px",
                    paddingBottom: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    id="ora_ignota"
                    type="checkbox"
                    checked={oraIgnota}
                    onChange={(e) => setOraIgnota(e.target.checked)}
                  />
                  <label htmlFor="ora_ignota" className="card-text">
                    {t("tema.form.unknownTime")}
                  </label>
                </div>
              </div>

<div>
  <label className="card-text">{t("tema.form.birthPlace")}</label>
  <input
    type="text"
    name="citta"
    value={form.citta}
    onChange={(e) => setForm({ ...form, citta: e.target.value })}
    className="form-input"
    placeholder={t("tema.form.birthPlacePlaceholder")}
    autoComplete="off"
  />

  <div style={{ marginTop: 12 }}>
    <label className="card-text">{t("tema.form.country")}</label>
    <select
      name="country"
      value={form.country}
      onChange={(e) => setForm({ ...form, country: e.target.value })}
      className="form-input"
    >
      <option value="">{t("tema.form.countryPlaceholder")}</option>
      {countryOptions.map((item) => (
        <option key={item.code} value={item.code}>
          {item.label}
        </option>
      ))}
    </select>
  </div>
</div>

              <button
                onClick={generaFree}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? t("tema.cta.generating") : t("tema.cta.startReading")}
              </button>

              {errore &&
                (noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {isLoggedIn ? (
                      <>
                        <p>{t("tema.messages.noCreditsTitle")}</p>
                        <p style={{ marginTop: 8 }}>
                          <Link href="/crediti" className="link">
                            {t("tema.cta.openCredits")}
                          </Link>
                        </p>
                        <p style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.8 }}>
                          {t("tema.messages.detailsPrefix")} {errore}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{t("tema.messages.firstReadingDone")}</p>
                        <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                          {t("tema.messages.signupOrLogin")}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="card-text" style={{ color: "#ff9a9a" }}>
                    {errore}
                  </p>
                ))}
            </div>
          </div>
        </section>

        {risultato?.input?.ora_ignota && (
          <section className="section">
            <div
              className="card"
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                border: "1px solid rgba(255,180,180,0.4)",
                backgroundColor: "#2a1818",
              }}
            >
              <p
                className="card-text"
                style={{ color: "#ffb4b4", whiteSpace: "pre-wrap" }}
              >
                {t("tema.unknownTimeWarning.text")}
              </p>
            </div>
          </section>
        )}

        {temaVis && temaVis.chart_png_base64 && (
          <section className="section">
            <div
              className="card"
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <h3 className="card-title">{t("tema.chart.title")}</h3>

              <div
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "560px",
                    paddingTop: "100%",
                  }}
                >
                  <img
                    src={`data:image/png;base64,${temaVis.chart_png_base64}`}
                    alt={t("tema.chart.imageAlt")}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: "12px",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: "260px",
                    backgroundColor: "#15191c",
                    borderRadius: "12px",
                    border: "1px solid #2c3238",
                    padding: "16px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    {t("tema.chart.planetsTitle")}
                  </h3>

                  {temaVis?.pianeti && temaVis.pianeti.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {temaVis.pianeti.map((p) => (
                        <div
                          key={p.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.9rem",
                          }}
                        >
                          <span style={{ fontSize: "1.3rem" }}>{p.glyph}</span>
                          <span>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      {t("tema.chart.planetsUnavailable")}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: "260px",
                    backgroundColor: "#15191c",
                    borderRadius: "12px",
                    border: "1px solid #2c3238",
                    padding: "16px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    {t("tema.chart.aspectsTitle")}
                  </h3>

                  {temaVis?.aspetti && temaVis.aspetti.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {temaVis.aspetti.map((a, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "0.9rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "1.1rem",
                              minWidth: "70px",
                            }}
                          >
                            <span>{a.g1}</span>
                            <span>{a.g_asp}</span>
                            <span>{a.g2}</span>
                          </div>
                          <div style={{ flex: 1 }}>{a.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      {t("tema.chart.aspectsUnavailable")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {interpretazione && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{t("tema.summary.title")}</h3>
              <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {interpretazione}
              </p>

              {!premiumLoaded && (
                <div
                  style={{
                    marginTop: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    id="dyana-approfondisci"
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApprofondisciClick}
                    disabled={loading || premiumCtaLoading}
                  >
                    {premiumCtaLoading
                      ? t("tema.cta.preparingPremium")
                      : t("tema.cta.deepenWithDyana")}
                  </button>

                  {premiumCtaLoading && (
                    <p
                      className="card-text"
                      style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: 10 }}
                    >
                      {t("tema.messages.noClosePage")}
                    </p>
                  )}

                  {slowLoading && (
                    <p
                      className="card-text"
                      style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: 8 }}
                    >
                      {t("tema.messages.slowLoading")}
                    </p>
                  )}

                  {isLoggedIn && (
                    <span
                      className="card-text"
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.85,
                        border: "1px solid rgba(255,255,255,0.12)",
                        padding: "6px 10px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("tema.messages.premiumCost")}
                    </span>
                  )}
                </div>
              )}

              {emailGateOpen && !premiumLoaded && guestTrialLeft === 0 && (
                <div
                  className="card"
                  style={{
                    marginTop: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <h4 className="card-subtitle" style={{ marginBottom: 6 }}>
                    {guestTrialLeft === 0
                      ? t("tema.gate.trialFinished")
                      : t("tema.gate.continueWithEmail")}
                  </h4>

                  <p className="card-text" style={{ opacity: 0.9 }}>
                    {gateMsg}
                  </p>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {guestTrialLeft === 0 && (
                      <>
                        <button
                          type="button"
                          className={gateMode === "magic" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("magic")}
                        >
                          {t("tema.cta.emailLink")}
                        </button>

                        <button
                          type="button"
                          className={gateMode === "register" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("register")}
                        >
                          {t("tema.gate.register")}
                        </button>

                        <button
                          type="button"
                          className={gateMode === "login" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("login")}
                        >
                          {t("tema.gate.login")}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="btn"
                      onClick={() => setEmailGateOpen(false)}
                      style={{ marginLeft: "auto" }}
                    >
                      {t("tema.gate.close")}
                    </button>
                  </div>

                  <form
                    onSubmit={submitInlineAuth}
                    style={{ marginTop: 12, display: "grid", gap: 10 }}
                  >
                    <input
                      className="form-input"
                      type="email"
                      placeholder={t("tema.gate.emailPlaceholder")}
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                    />

                    {guestTrialLeft === 1 && (
                      <div style={{ marginTop: 2 }}>
                        <label
                          className="card-text"
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={gateMarketing}
                            onChange={(e) => setGateMarketing(e.target.checked)}
                            disabled={gateLoading || loading}
                            style={{ width: 14, height: 14, marginTop: 3 }}
                          />
                          <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                            {t("tema.gate.marketingConsent")}
                          </span>
                        </label>

                        <p
                          className="card-text"
                          style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 8 }}
                        >
                          {t("tema.gate.termsPrefix")}{" "}
                          <Link
                            href="/condizioni"
                            className="link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("tema.gate.termsLink")}
                          </Link>{" "}
                          {t("tema.gate.privacyPrefix")}{" "}
                          <Link
                            href="/privacy"
                            className="link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("tema.gate.privacyLink")}
                          </Link>
                          .
                        </p>
                      </div>
                    )}

                    {guestTrialLeft === 0 && gateMode !== "magic" && (
                      <>
                        <input
                          className="form-input"
                          type="password"
                          placeholder={t("tema.gate.password")}
                          value={gatePass}
                          onChange={(e) => setGatePass(e.target.value)}
                          autoComplete="current-password"
                        />
                        {gateMode === "register" && (
                          <input
                            className="form-input"
                            type="password"
                            placeholder={t("tema.gate.repeatPassword")}
                            value={gatePass2}
                            onChange={(e) => setGatePass2(e.target.value)}
                            autoComplete="new-password"
                          />
                        )}
                      </>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={gateLoading || loading}
                    >
                      {gateLoading
                        ? guestTrialLeft === 0 && gateMode === "magic"
                          ? t("tema.cta.sendLink")
                          : t("tema.cta.completing")
                        : guestTrialLeft === 0
                        ? gateMode === "magic"
                          ? t("tema.cta.openEmailAndContinue")
                          : gateMode === "login"
                          ? t("tema.cta.loginAndContinue")
                          : t("tema.cta.registerAndContinue")
                        : t("tema.gate.continue")}
                    </button>

                    {gateErr && (
                      <p className="card-text" style={{ color: "#ff9a9a" }}>
                        {gateErr}
                      </p>
                    )}

                    {guestTrialLeft != null && (
                      <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                        {t("tema.messages.guestTrialLeft")}{" "}
                        <strong>{guestTrialLeft}</strong>
                      </p>
                    )}
                  </form>
                </div>
              )}
            </div>
          </section>
        )}

        {premiumLoaded && contenuto && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{t("tema.premium.title")}</h3>

              {capitoliArray.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {capitoliArray.map((cap, idx) => {
                    const titolo = cap.titolo || `${t("tema.premium.chapter")} ${idx + 1}`;
                    const testo = cap.testo || cap.contenuto || cap.testo_breve || "";
                    if (!testo) return null;
                    return (
                      <div key={`${titolo}-${idx}`}>
                        <h4
                          className="card-text"
                          style={{ fontWeight: 600, marginBottom: 4 }}
                        >
                          {titolo}
                        </h4>
                        <p
                          className="card-text"
                          style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}
                        >
                          {testo}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {Object.entries(sectionLabels).map(([key, label]) => {
                    const text = contenuto?.[key];
                    if (!text) return null;
                    return (
                      <div key={key}>
                        <h4
                          className="card-text"
                          style={{ fontWeight: 600, marginBottom: 4 }}
                        >
                          {label}
                        </h4>
                        <p
                          className="card-text"
                          style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}
                        >
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {premiumLoaded && hasReading && readingTextForDyana && (
          <section className="section">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 32,
              }}
            >
              <div
                className="card"
                style={{
                  width: "100%",
                  maxWidth: "960px",
                  padding: "22px 24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
                }}
              >
                <p
                  className="card-text"
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.8,
                    marginBottom: 4,
                  }}
                >
                  {t("tema.qa.eyebrow")}
                </p>

                {premiumLoaded ? (
                  <>
                    <h3 className="card-title" style={{ marginBottom: 6 }}>
                      {t("tema.qa.title")}
                    </h3>

                    <p
                      className="card-text"
                      style={{ marginBottom: 4, opacity: 0.9 }}
                    >
                      {t("tema.qa.text1")}
                    </p>

                    <p
                      className="card-text"
                      style={{ fontSize: "0.9rem", opacity: 0.8 }}
                    >
                      {t("tema.qa.text2Before")} <strong>{t("tema.qa.text2Highlight1")}</strong>{" "}
                      {t("tema.qa.text2Middle")}{" "}
                      <strong>{t("tema.qa.text2Highlight2")}</strong>{" "}
                      {t("tema.qa.text2After")}
                    </p>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: 16 }}
                      onClick={() => {
                        setDiyanaOpen((prev) => !prev);
                      }}
                    >
                      {diyanaOpen
                        ? t("tema.cta.closeDyana")
                        : t("tema.cta.askDyana")}
                    </button>

                    {diyanaOpen && (
                      <div
                        style={{
                          marginTop: 16,
                          width: "100%",
                          height: "600px",
                          borderRadius: "14px",
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.12)",
                          boxShadow: "0 22px 48px rgba(0,0,0,0.75)",
                        }}
                      >
                        <iframe
                          src={typebotUrl}
                          style={{
                            border: "none",
                            width: "100%",
                            height: "100%",
                          }}
                          allow="clipboard-write; microphone; camera"
                        />
                      </div>
                    )}

                    <p
                      className="card-text"
                      style={{
                        marginTop: 8,
                        fontSize: "0.75rem",
                        opacity: 0.65,
                        textAlign: "right",
                      }}
                    >
                      {t("tema.qa.footer")}
                    </p>
                  </>
                ) : (
                  <p
                    className="card-text"
                    style={{
                      marginTop: 8,
                      fontSize: "0.9rem",
                      opacity: 0.9,
                    }}
                  >
                    {t("tema.qa.lockedTextBefore")}{" "}
                    <strong>{t("tema.qa.lockedTextHighlight")}</strong>{" "}
                    {t("tema.qa.lockedTextAfter")}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
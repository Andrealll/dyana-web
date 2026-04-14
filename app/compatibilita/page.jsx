// app/compatibilita/page.jsx
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

// Costo premium compatibilità (coerente con backend / convenzione)
const PREMIUM_COST = 3;

// ✅ chiavi auth callback sandwich
const AUTH_DONE_KEY = "dyana_auth_done";
const POST_LOGIN_ACTION_KEY = "dyana_post_login_action";

if (typeof window !== "undefined") {
  console.log("[DYANA/COMPAT] API_BASE runtime:", API_BASE);
}

// ==========================
// Helper decode JWT (robusto)
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
// Helper per label aspetti
// ==========================
function formatAspettoLabel(asp) {
  if (!asp || typeof asp !== "object") return "";

  const p1 = asp.pianeta1 || asp.pianetaA || asp.p1 || "?";
  const p2 = asp.pianeta2 || asp.pianetaB || asp.p2 || "?";
  const tipo = asp.tipo || asp.aspetto || asp.nome || "";
  const orbVal =
    typeof asp.orb === "number" && !Number.isNaN(asp.orb) ? asp.orb.toFixed(1) : null;

  const orbTxt = orbVal !== null ? ` (orb ${orbVal}°)` : "";
  const base = `${p1} ${tipo} ${p2}`.trim();
  return base + orbTxt;
}

// Pianeta in legenda: "Sole in Leone 23.4° – Casa 10"
function formatPianetaPosizione(info) {
  if (!info || typeof info !== "object") return "";

  const nome = info.nome || info.planet || info.pianeta || "?";
  const segno =
    info.segno ||
    info.segno_zodiacale ||
    info.sign ||
    info.segno_breve ||
    "";

  let gradiNum = null;
  if (typeof info.gradi_segno === "number") gradiNum = info.gradi_segno;
  else if (typeof info.gradi === "number") gradiNum = info.gradi;
  else if (typeof info.degree === "number") gradiNum = info.degree;

  const gradiTxt = gradiNum !== null ? `${gradiNum.toFixed(1)}°` : "";
  const casa = typeof info.casa === "number" ? info.casa : null;

  let base = nome;
  if (segno && gradiTxt) base = `${nome} in ${segno} ${gradiTxt}`;
  else if (segno) base = `${nome} in ${segno}`;
  else if (gradiTxt) base = `${nome} ${gradiTxt}`;

  if (casa !== null) return `${base} – Casa ${casa}`;
  return base;
}

// Helper error backend
function normalizeErrorMessage(data, status, t) {
  if (!data) {
    return t("compatibility.errors.serverGeneration").replace("{status}", status);
  }

  if (typeof data.error === "string") return data.error;

  const detail = data.detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => d.msg || JSON.stringify(d));
    return msgs.join(" | ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  return t("compatibility.errors.serverGeneration").replace("{status}", status);
}

// Testo Q&A da sinastria_ai
function buildSinastriaReadingText(sinastriaAI) {
  if (!sinastriaAI || typeof sinastriaAI !== "object") return "";

  const parts = [];

  if (sinastriaAI.sintesi_generale) {
    parts.push(`Sintesi generale:\n${sinastriaAI.sintesi_generale}`);
  }

  if (Array.isArray(sinastriaAI.capitoli) && sinastriaAI.capitoli.length > 0) {
    const blocchi = sinastriaAI.capitoli.map((cap, idx) => {
      const titolo = cap.titolo || `Capitolo ${idx + 1}`;
      const testo = cap.testo || "";
      return testo ? `• ${titolo}\n${testo}` : `• ${titolo}`;
    });
    parts.push("Capitoli della relazione:\n" + blocchi.join("\n\n"));
  } else if (
    Array.isArray(sinastriaAI.aree_relazione) &&
    sinastriaAI.aree_relazione.length > 0
  ) {
    const blocchi = sinastriaAI.aree_relazione.map((area) => {
      const titolo = area.titolo || area.id || "Area della relazione";
      const sintesi = area.sintesi || "";
      const header = `• ${titolo}`;
      return sintesi ? `${header}\n${sintesi}` : header;
    });
    parts.push("Aree della relazione:\n" + blocchi.join("\n\n"));
  }

  if (Array.isArray(sinastriaAI.punti_forza) && sinastriaAI.punti_forza.length) {
    parts.push(
      "Punti di forza:\n" + sinastriaAI.punti_forza.map((p) => `- ${p}`).join("\n")
    );
  }

  if (
    Array.isArray(sinastriaAI.punti_criticita) &&
    sinastriaAI.punti_criticita.length
  ) {
    parts.push(
      "Punti di attenzione:\n" +
        sinastriaAI.punti_criticita.map((p) => `- ${p}`).join("\n")
    );
  }

  if (
    Array.isArray(sinastriaAI.consigli_finali) &&
    sinastriaAI.consigli_finali.length
  ) {
    parts.push(
      "Consigli finali:\n" +
        sinastriaAI.consigli_finali.map((c) => `- ${c}`).join("\n")
    );
  }

  return parts.join("\n\n").trim();
}

// ==========================
// PAGINA
// ==========================
export default function CompatibilitaPage() {
  const { t, locale } = useI18n();
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const [form, setForm] = useState({
    nomeA: "",
    dataA: "",
    oraA: "",
    oraAIgnota: false,
    cittaA: "",
	countryA: "IT",

    nomeB: "",
    dataB: "",
    oraB: "",
    oraBIgnota: false,
    cittaB: "",
	countryB: "IT",
  });

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [noCredits, setNoCredits] = useState(false);

  // FREE resta sopra, PREMIUM si aggiunge sotto
  const [freeResult, setFreeResult] = useState(null);
  const [premiumResult, setPremiumResult] = useState(null);

  // Billing (ultimo noto)
  const [billing, setBilling] = useState(null);

  // Navbar state
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_compat");

  // trial guest 1/0 (o null se non disponibile)
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  // Email gate inline
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("login"); // magic | register | login
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  // ✅ UX: sandwich + loading premium chiaro
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [postAuthToast, setPostAuthToast] = useState("");
  const [premiumCtaLoading, setPremiumCtaLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);

  // Consenso marketing prefleggato a sì
  const [gateMarketing, setGateMarketing] = useState(true);

  // DYANA
  const [diyanaOpen, setDiyanaOpen] = useState(false);
  const [sessionId] = useState(() => `sinastria_session_${Date.now()}`);

  const isLoggedIn = !!getToken();

  // ======================================================
  // Refresh user/credits
  // ======================================================
  const refreshUserFromToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_compat");
      return;
    }
    const payload = decodeJwtPayload(token);
    setUserRole(payload?.role || "free");
    setUserIdForDyana(payload?.sub || "guest_compat");
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
      console.warn("[COMPAT] refreshCreditsUI failed:", e?.message || e);
    }
  }, []);

  useEffect(() => {
    refreshUserFromToken();
    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }, [refreshUserFromToken, refreshCreditsUI]);

  // ======================================================
  // AUTH_DONE listener: sandwich post-login (no auto premium)
  // ======================================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function onAuthDone() {
      try {
        localStorage.removeItem(AUTH_DONE_KEY);
      } catch {}

      refreshUserFromToken();
      await refreshCreditsUI();

      setEmailGateOpen(false);
      setGateErr("");
      setGateMsg("");

      setJustLoggedIn(true);
      setPostAuthToast(t("compatibility.postAuth.continueMessage"));
      setTimeout(() => setJustLoggedIn(false), 6000);

      try {
        localStorage.removeItem(POST_LOGIN_ACTION_KEY);
      } catch {}
    }

    const storageHandler = (e) => {
      if (e?.key === AUTH_DONE_KEY) onAuthDone();
    };
    window.addEventListener("storage", storageHandler);

    const localHandler = (e) => {
      if (e?.detail?.type === "AUTH_DONE") onAuthDone();
    };
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
    setUserIdForDyana("guest_compat");
    setGuestTrialLeft(null);

    setPremiumResult(null);
    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");

    setJustLoggedIn(false);
    setPostAuthToast("");
    setPremiumCtaLoading(false);
    setSlowLoading(false);

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }

  // ======================================================
  // Handlers form
  // ======================================================
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }
  // ======================================================
  // API call /sinastria_ai
  // ======================================================
  async function callSinastria({ tier }) {
const fullCityA = buildCityWithCountry(form.cittaA, form.countryA);
const fullCityB= buildCityWithCountry(form.cittaB, form.countryB);
	  
	  
const payload = {
  A: {
    citta: fullCityA,
    data: form.dataA,
    ora: form.oraAIgnota ? "" : form.oraA,
    nome: form.nomeA || null,
    ora_ignota: form.oraAIgnota,
  },
  B: {
    citta: fullCityB,
    data: form.dataB,
    ora: form.oraBIgnota ? "" : form.oraB,
    nome: form.nomeB || null,
    ora_ignota: form.oraBIgnota,
  },
  tier, // free | premium
  lang: locale === "en" ? "en" : "it",
};

    let token = await getAnyAuthTokenAsync();
    if (!token && ASTROBOT_JWT_TEMA) token = ASTROBOT_JWT_TEMA;

    const headers = {
      "Content-Type": "application/json",
      "X-Client-Source": "dyana_web/compatibilita",
      "X-Client-Session": sessionId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/sinastria_ai/`, {
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

  function applyBillingAndCredits(data, feature) {
    if (data?.billing) {
      setBilling(data.billing);

      const remaining = data.billing.remaining_credits;
      if (typeof remaining === "number") {
        setUserCredits(remaining);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dyana-credits-updated", {
              detail: {
                feature,
                remaining_credits: remaining,
                billing_mode: data.billing.mode,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("dyana:refresh-credits", {
              detail: {
                feature,
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
  }

  // ======================================================
  // FREE
  // ======================================================
  async function generaFree() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);

    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setDiyanaOpen(false);

    setPremiumResult(null);
    setBilling(null);

    setPremiumCtaLoading(false);
    setSlowLoading(false);

    try {
      const { res, data } = await callSinastria({ tier: "free" });

      if (!res.ok) {
        const msg = normalizeErrorMessage(data, res.status, t);
        setErrore(msg);
        return;
      }

      setFreeResult(data);
      applyBillingAndCredits(data, "sinastria_ai");
      await refreshCreditsUI();
    } catch (e) {
      setErrore(t("compatibility.errors.connection"));
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // PREMIUM
  // ======================================================
  async function generaPremium() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    setGateErr("");

    try {
      const { res, data } = await callSinastria({ tier: "premium" });

      if (!res.ok) {
        const errorCode = data?.error_code || data?.code || data?.error || data?.detail;

        const isCreditsError =
          res.status === 402 ||
          res.status === 403 ||
          (typeof errorCode === "string" &&
            errorCode.toLowerCase().includes("credit"));

        const msg = normalizeErrorMessage(data, res.status, t);

        if (isCreditsError) {
          setNoCredits(true);
          setErrore(msg);
          await refreshCreditsUI();
          return;
        }

        setErrore(msg);
        return;
      }

      setPremiumResult(data);
      applyBillingAndCredits(data, "sinastria_ai");

      // ✅ TRACKING: premium sinastria completata
      enqueueConversionEvent("sinastria_completed", {
        feature: "compatibilita",
        tier: "premium",
      });

      setEmailGateOpen(false);
      setDiyanaOpen(false);

      await refreshCreditsUI();
    } catch (e) {
      setErrore(t("compatibility.errors.connection"));
    } finally {
      setPremiumCtaLoading(false);
      setSlowLoading(false);
      setLoading(false);
    }
  }

  // ======================================================
  // Gate open / Approfondisci click
  // ======================================================
  function openEmailGate() {
    if (guestTrialLeft !== 0) return; // trial disponibile? non aprire mai gate

    setGateErr("");
    setGateLoading(false);

    // default: magic link preselezionato
    setGateMode("login");
    setEmailGateOpen(true);

    setGateMsg(t("compatibility.gate.continueMessage"));
  }

  async function handleApprofondisciClick() {
    setErrore("");
    setNoCredits(false);

    if (premiumResult) return;

    // feedback immediato sul bottone + messaggio
    setPremiumCtaLoading(true);
    setSlowLoading(false);
    const slowTimer = setTimeout(() => setSlowLoading(true), 12000);

    try {
      // 1) Se loggato → premium diretto
      if (isLoggedIn) {
        await generaPremium();
        return;
      }

      // 2) Guest con trial disponibile → premium diretto (NO email gate)
      if (guestTrialLeft === 1) {
        await generaPremium();
        return;
      }

      // 3) Guest senza trial → gate email/login
      openEmailGate();
    } catch (e) {
      // errori gestiti da generaPremium / catch generale
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
        setGateErr(t("compatibility.errors.invalidEmail"));
        return;
      }

      try {
        localStorage.setItem("dyana_pending_email", email);
      } catch {}

      setResumeTarget({
        path: "/compatibilita",
        readingId: "sinastria_inline",
      });

      const redirectUrl =
        typeof window !== "undefined" && window.location?.origin
          ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
          : "https://dyana.app/auth/callback";

      // --------------------------------------------------
      // TRIAL ESAURITO → MAGIC LINK / LOGIN / REGISTER
      // --------------------------------------------------
      if (guestTrialLeft === 0) {
  // MAGIC LINK
  if (gateMode === "magic") {
    try {
      await sendAuthMagicLink(email, redirectUrl);
      setGateMsg(t("compatibility.gate.magicLinkSent"));
    } catch (err) {
      console.warn(
        "[COMPAT][INLINE-AUTH] magic link FAIL:",
        err?.message || err
      );
      setGateErr(t("compatibility.errors.magicLinkFailed"));
    } finally {
      setGateLoading(false);
    }
    return; // non generare premium
  }

  // LOGIN / REGISTER con password
  if (gateMode === "login") {
    if (!gatePass) {
      setGateErr(t("compatibility.errors.passwordRequired"));
      return;
    }
    await loginWithCredentials(email, gatePass);
  } else {
    if (!gatePass || gatePass.length < 6) {
      setGateErr(t("compatibility.errors.passwordMin"));
      return;
    }
    if (gatePass !== gatePass2) {
      setGateErr(t("compatibility.errors.passwordMismatch"));
      return;
    }
    await registerWithEmail(email, gatePass);
  }

  refreshUserFromToken();
  await refreshCreditsUI();

  // UX: avvia premium con feedback chiaro
  setPremiumCtaLoading(true);
  setSlowLoading(false);
  const slowTimer = setTimeout(() => setSlowLoading(true), 12000);

  try {
    await generaPremium();
  } finally {
    clearTimeout(slowTimer);
    setPremiumCtaLoading(false);
    setSlowLoading(false);
  }

  return;
}
      // --------------------------------------------------
      // TRIAL DISPONIBILE → premium subito + invio link best-effort
      // --------------------------------------------------
      setGateMsg(t("compatibility.gate.premiumGenerating"));

      // marketing consent: SOLO se token utente registrato valido
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
          "[COMPAT][INLINE-AUTH] updateMarketingConsent fallito (non blocco):",
          err?.message || err
        );
      }

      // magic link best-effort (non blocca)
      try {
        await sendAuthMagicLink(email, redirectUrl);
      } catch (err) {
        console.warn(
          "[COMPAT][INLINE-AUTH] magic link non inviato (non blocco):",
          err?.message || err
        );
      }

      // UX: avvia premium con feedback chiaro
      setPremiumCtaLoading(true);
      setSlowLoading(false);
      const slowTimer = setTimeout(() => setSlowLoading(true), 12000);

      try {
        await generaPremium();
        await refreshCreditsUI();
      } finally {
        clearTimeout(slowTimer);
        setPremiumCtaLoading(false);
        setSlowLoading(false);
      }

      return;
    } catch (err) {
      setGateErr(err?.message || t("compatibility.errors.genericActionFailed"));
    } finally {
      setGateLoading(false);
    }
  }

  // ==========================
  // DERIVATE UI: FREE
  // ==========================
  const freeSinastriaAI = freeResult?.sinastria_ai || null;

  const freeChartBase64 = freeResult?.chart_sinastria_base64 || null;
  const freeSinVis = freeResult?.sinastria_vis || null;
  const freeTemaVisA = freeSinVis?.A || null;
  const freeTemaVisB = freeSinVis?.B || null;
  const freeAspettiPrincipali = Array.isArray(freeSinVis?.aspetti_top)
    ? freeSinVis.aspetti_top
    : [];

  const freeNomeA =
    freeTemaVisA?.nome || form.nomeA || t("compatibility.labels.personA");
  const freeNomeB =
    freeTemaVisB?.nome || form.nomeB || t("compatibility.labels.personB");

  const freePayloadMeta = freeResult?.payload_ai?.meta || {};
  const freeOraIgnotaAFromPayload = !!freePayloadMeta.ora_ignota_A;
  const freeOraIgnotaBFromPayload = !!freePayloadMeta.ora_ignota_B;
  const freeOraIgnotaGlobal =
    freeOraIgnotaAFromPayload ||
    freeOraIgnotaBFromPayload ||
    form.oraAIgnota ||
    form.oraBIgnota;

  const hasFree = !!freeResult && (!!freeSinastriaAI?.sintesi_generale || !!freeChartBase64);

  // ==========================
  // DERIVATE UI: PREMIUM
  // ==========================
  const premiumSinastriaAI = premiumResult?.sinastria_ai || null;

  const premiumChartBase64 = premiumResult?.chart_sinastria_base64 || null;
  const premiumSinVis = premiumResult?.sinastria_vis || null;
  const premiumTemaVisA = premiumSinVis?.A || null;
  const premiumTemaVisB = premiumSinVis?.B || null;
  const premiumAspettiPrincipali = Array.isArray(premiumSinVis?.aspetti_top)
    ? premiumSinVis.aspetti_top
    : [];

  const premiumNomeA =
    premiumTemaVisA?.nome || form.nomeA || t("compatibility.labels.personA");
  const premiumNomeB =
    premiumTemaVisB?.nome || form.nomeB || t("compatibility.labels.personB");

  const premiumPayloadMeta = premiumResult?.payload_ai?.meta || {};
  const premiumOraIgnotaAFromPayload = !!premiumPayloadMeta.ora_ignota_A;
  const premiumOraIgnotaBFromPayload = !!premiumPayloadMeta.ora_ignota_B;
  const premiumOraIgnotaGlobal =
    premiumOraIgnotaAFromPayload ||
    premiumOraIgnotaBFromPayload ||
    form.oraAIgnota ||
    form.oraBIgnota;

  const hasPremium =
    !!premiumResult && (!!premiumSinastriaAI?.sintesi_generale || !!premiumChartBase64);

  // ==========================
  // TYPEBOT URL (solo premium)
  // ==========================
  const premiumReadingTextForDyana = useMemo(
    () => buildSinastriaReadingText(premiumSinastriaAI),
    [premiumSinastriaAI]
  );


const typebotUrl = useMemo(() => {
  const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
  try {
    const params = new URLSearchParams();

    if (userIdForDyana) params.set("user_id", userIdForDyana);
    if (sessionId) params.set("session_id", sessionId);

    const meta =
      (premiumResult && premiumResult.payload_ai && premiumResult.payload_ai.meta) ||
      (premiumSinastriaAI && premiumSinastriaAI.meta) ||
      {};

    const readingId = meta.reading_id || meta.id || "sinastria_inline";
    params.set("reading_id", readingId);

    params.set("reading_type", "sinastria");

    params.set(
      "reading_label",
      t("compatibility.labels.coupleCompatibility")
    );

    const safeReadingText = (premiumReadingTextForDyana || "").slice(0, 6000);
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
  premiumResult,
  premiumSinastriaAI,
  premiumReadingTextForDyana,
  t,
  locale, // 👈 AGGIUNGI QUESTO
]);

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={handleLogout} />

      {/* ✅ Sandwich post-login */}
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
              {t("compatibility.postAuth.title")}
            </h4>

            <p className="card-text" style={{ opacity: 0.9 }}>
              {postAuthToast}
            </p>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setJustLoggedIn(false);
                  const el = document.getElementById("dyana-approfondisci-compat");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  if (el && typeof el.focus === "function") el.focus();
                }}
              >
                {t("compatibility.postAuth.continue")}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setJustLoggedIn(false)}
              >
                {t("compatibility.postAuth.close")}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="landing-wrapper">
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">{t("compatibility.page.title")}</h1>
          <p className="section-subtitle" style={{ whiteSpace: "pre-line" }}>
            {t("compatibility.page.subtitle")}
          </p>
        </header>

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                {/* PERSONA A */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>
                    {t("compatibility.form.personA")}
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label className="card-text">{t("compatibility.form.name")}</label>
                      <input
                        type="text"
                        name="nomeA"
                        value={form.nomeA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>


<div>
  <label className="card-text">{t("compatibility.form.birthPlace")}</label>
  <input
    type="text"
    name="cittaA"
    value={form.cittaA}
    onChange={handleChange}
    className="form-input"
    placeholder={t("compatibility.form.birthPlacePlaceholderA")}
    autoComplete="off"
  />

  <div style={{ marginTop: 12 }}>
    <label className="card-text">{t("compatibility.form.country1")}</label>
    <select
      name="countryA"
      value={form.countryA}
      onChange={handleChange}
      className="form-input"
    >
      {countryOptions.map((item) => (
        <option key={item.code} value={item.code}>
          {item.label}
        </option>
      ))}
    </select>
  </div>
</div>

                    <div>
                      <label className="card-text">{t("compatibility.form.birthDate")}</label>
                      <input
                        type="date"
                        name="dataA"
                        value={form.dataA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="card-text">{t("compatibility.form.birthTime")}</label>
                      <input
                        type="time"
                        name="oraA"
                        value={form.oraA}
                        onChange={handleChange}
                        className="form-input"
                        disabled={form.oraAIgnota}
                        style={
                          form.oraAIgnota
                            ? { opacity: 0.4, pointerEvents: "none" }
                            : undefined
                        }
                      />

                      <label
                        className="card-text"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 4,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.oraAIgnota}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              oraAIgnota: e.target.checked,
                              oraA: e.target.checked ? "" : prev.oraA,
                            }))
                          }
                          style={{ width: 14, height: 14 }}
                        />
                        <span>{t("compatibility.form.unknownTime")}</span>
                      </label>
                    </div>
                  </div>
  </div>

                {/* PERSONA B */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>
                    {t("compatibility.form.personB")}
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label className="card-text">{t("compatibility.form.name")}</label>
                      <input
                        type="text"
                        name="nomeB"
                        value={form.nomeB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
<div>
  <label className="card-text">{t("compatibility.form.birthPlace")}</label>
  <input
    type="text"
    name="cittaB"
    value={form.cittaB}
    onChange={handleChange}
    className="form-input"
    placeholder={t("compatibility.form.birthPlacePlaceholderB")}
	autoComplete="off"
  />

  <div style={{ marginTop: 12 }}>
    <label className="card-text">{t("compatibility.form.country2")}</label>
    <select
      name="countryB"
      value={form.countryB}
      onChange={handleChange}
      className="form-input"
    >
      {countryOptions.map((item) => (
        <option key={item.code} value={item.code}>
          {item.label}
        </option>
      ))}
    </select>
  </div>
</div>

                    <div>
                      <label className="card-text">{t("compatibility.form.birthDate")}</label>
                      <input
                        type="date"
                        name="dataB"
                        value={form.dataB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="card-text">{t("compatibility.form.birthTime")}</label>
                      <input
                        type="time"
                        name="oraB"
                        value={form.oraB}
                        onChange={handleChange}
                        className="form-input"
                        disabled={form.oraBIgnota}
                        style={
                          form.oraBIgnota
                            ? { opacity: 0.4, pointerEvents: "none" }
                            : undefined
                        }
                      />

                      <label
                        className="card-text"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 4,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.oraBIgnota}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              oraBIgnota: e.target.checked,
                              oraB: e.target.checked ? "" : prev.oraB,
                            }))
                          }
                          style={{ width: 14, height: 14 }}
                        />
                        <span>{t("compatibility.form.unknownTime")}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA primaria: genera FREE */}
              <button
                onClick={generaFree}
                className="btn btn-primary"
                disabled={loading || gateLoading}
                style={{ marginTop: "14px" }}
              >
                {loading || gateLoading
                  ? t("compatibility.form.generating")
                  : t("compatibility.form.generate")}
              </button>

              {/* Errori */}
              {errore &&
                (noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {isLoggedIn ? (
                      <>
                        <p>{t("compatibility.noCredits.loggedTitle")}</p>
                        <p style={{ marginTop: 8 }}>
                          <Link href="/crediti" className="link">
                            {t("compatibility.noCredits.loggedCta")}
                          </Link>
                        </p>
                        <p style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.8 }}>
                          {t("compatibility.noCredits.loggedDetails")} {errore}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{t("compatibility.noCredits.guestTitle")}</p>
                        <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                          {t("compatibility.noCredits.guestSubtitle")}
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

        {/* ==========================
            BLOCCO FREE (resta sempre)
           ========================== */}
        {hasFree && (
          <>
            {/* GRAFICO + DATI (FREE) */}
            {!hasPremium && freeChartBase64 && (
              <section className="section">
                <div
                  className="card"
                  style={{
                    maxWidth: "850px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <h3 className="card-title">{t("compatibility.free.chartTitle")}</h3>

                  <p className="card-text" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    {t("compatibility.free.chartDescription")
                      .replace("{nameA}", freeNomeA)
                      .replace("{nameB}", freeNomeB)}
                  </p>

                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "560px",
                        paddingTop: "100%",
                      }}
                    >
                      <img
                        src={`data:image/png;base64,${freeChartBase64}`}
                        alt={t("compatibility.free.chartTitle")}
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

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
                    {freeTemaVisA && Array.isArray(freeTemaVisA.pianeti) && (
                      <div
                        style={{
                          flex: "0 0 22%",
                          minWidth: "200px",
                          backgroundColor: "#15191c",
                          borderRadius: "12px",
                          border: "1px solid #2c3238",
                          padding: "16px",
                        }}
                      >
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {freeNomeA}
                        </h4>

                        <ul
                          className="card-text"
                          style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}
                        >
                          {freeTemaVisA.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {freeTemaVisB && Array.isArray(freeTemaVisB.pianeti) && (
                      <div
                        style={{
                          flex: "0 0 22%",
                          minWidth: "200px",
                          backgroundColor: "#15191c",
                          borderRadius: "12px",
                          border: "1px solid #2c3238",
                          padding: "16px",
                        }}
                      >
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {freeNomeB}
                        </h4>

                        <ul
                          className="card-text"
                          style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}
                        >
                          {freeTemaVisB.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {freeAspettiPrincipali.length > 0 && (
                      <div
                        style={{
                          flex: "1 1 0%",
                          minWidth: "260px",
                          backgroundColor: "#15191c",
                          borderRadius: "12px",
                          border: "1px solid #2c3238",
                          padding: "16px",
                        }}
                      >
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {t("compatibility.free.aspectsTitle")}
                        </h4>

                        <ul
                          className="card-text"
                          style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}
                        >
                          {freeAspettiPrincipali.slice(0, 10).map((asp, idx) => {
                            const label =
                              asp.descrizione ||
                              asp.label ||
                              formatAspettoLabel(asp) ||
                              "";
                            return <li key={idx}>{label}</li>;
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SINTESI FREE + CTA UPGRADE */}
            {!hasPremium && freeSinastriaAI?.sintesi_generale && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">{t("compatibility.free.summaryTitle")}</h3>

                  {freeOraIgnotaGlobal && (
                    <p
                      className="card-text"
                      style={{
                        marginTop: "6px",
                        fontSize: "0.85rem",
                        color: "#ffdf9a",
                      }}
                    >
                      {t("compatibility.free.unknownTimeWarning")}
                    </p>
                  )}

                  <p className="card-text" style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}>
                    {freeSinastriaAI.sintesi_generale}
                  </p>

                  {/* CAPITOLI (FREE): mostra almeno i titoli */}
                  {Array.isArray(freeSinastriaAI?.capitoli) &&
                    freeSinastriaAI.capitoli.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <h4 className="card-subtitle">
                          {t("compatibility.free.previewChapters")}
                        </h4>
                        <ul className="card-text" style={{ paddingLeft: "1.2rem", marginTop: 6 }}>
                          {freeSinastriaAI.capitoli.map((cap, idx) => (
                            <li key={idx}>
                              {cap?.titolo ||
                                t("compatibility.free.chapterFallback").replace(
                                  "{n}",
                                  idx + 1
                                )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* CTA testuale dal backend (FREE) */}
                  {freeSinastriaAI?.cta && (
                    <p
                      className="card-text"
                      style={{
                        marginTop: 12,
                        color: "#ffdf9a",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {freeSinastriaAI.cta}
                    </p>
                  )}

                  {/* CTA Approfondisci */}
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
                      id="dyana-approfondisci-compat"
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApprofondisciClick}
                      disabled={loading || gateLoading || premiumCtaLoading}
                    >
                      {premiumCtaLoading
                        ? t("compatibility.free.upgradeLoading")
                        : t("compatibility.free.upgradeButton")}
                    </button>

                    {premiumCtaLoading && (
                      <p
                        className="card-text"
                        style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: 10 }}
                      >
                        {t("compatibility.free.upgradeKeepPage")}
                      </p>
                    )}

                    {slowLoading && (
                      <p
                        className="card-text"
                        style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: 8 }}
                      >
                        {t("compatibility.free.upgradeSlow")}
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
                        {t("compatibility.free.cost").replace("{n}", PREMIUM_COST)}
                      </span>
                    )}
                  </div>

                  {/* EMAIL GATE INLINE */}
                  {emailGateOpen && !hasPremium && guestTrialLeft === 0 && (
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
                          ? t("compatibility.gate.exhaustedTitle")
                          : t("compatibility.gate.continueTitle")}
                      </h4>

                      <p className="card-text" style={{ opacity: 0.9 }}>
                        {gateMsg}
                      </p>

<div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
  {guestTrialLeft === 0 && (
    <>
      <button
        type="button"
        className={gateMode === "login" ? "btn btn-primary" : "btn"}
        onClick={() => setGateMode("login")}
      >
        {t("compatibility.gate.login")}
      </button>

      <button
        type="button"
        className={gateMode === "register" ? "btn btn-primary" : "btn"}
        onClick={() => setGateMode("register")}
      >
        {t("compatibility.gate.register")}
      </button>

      <button
        type="button"
        className={gateMode === "magic" ? "btn btn-primary" : "btn"}
        onClick={() => setGateMode("magic")}
      >
        {t("compatibility.gate.emailLink")}
      </button>
    </>
  )}

                        <button
                          type="button"
                          className="btn"
                          onClick={() => setEmailGateOpen(false)}
                          style={{ marginLeft: "auto" }}
                        >
                          {t("compatibility.gate.close")}
                        </button>
                      </div>

                      <form
                        onSubmit={submitInlineAuth}
                        style={{ marginTop: 12, display: "grid", gap: 10 }}
                      >
                        <input
                          className="form-input"
                          type="email"
                          placeholder={t("compatibility.gate.emailPlaceholder")}
                          value={gateEmail}
                          onChange={(e) => setGateEmail(e.target.value)}
                          disabled={gateLoading || loading}
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
                                {t("compatibility.gate.marketingConsent")}
                              </span>
                            </label>

                            <p
                              className="card-text"
                              style={{
                                fontSize: "0.8rem",
                                opacity: 0.75,
                                marginTop: 8,
                              }}
                            >
                              {t("compatibility.gate.legalPrefix")}{" "}
                              <Link
                                href="/condizioni"
                                className="link"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t("compatibility.gate.legalTerms")}
                              </Link>{" "}
                              {t("compatibility.gate.legalAndPrivacy")}{" "}
                              <Link
                                href="/privacy"
                                className="link"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t("compatibility.gate.legalPrivacy")}
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
                              placeholder={t("compatibility.gate.passwordPlaceholder")}
                              value={gatePass}
                              onChange={(e) => setGatePass(e.target.value)}
                              autoComplete="current-password"
                              disabled={gateLoading || loading}
                            />
                            {gateMode === "register" && (
                              <input
                                className="form-input"
                                type="password"
                                placeholder={t(
                                  "compatibility.gate.passwordRepeatPlaceholder"
                                )}
                                value={gatePass2}
                                onChange={(e) => setGatePass2(e.target.value)}
                                autoComplete="new-password"
                                disabled={gateLoading || loading}
                              />
                            )}
                          </>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={gateLoading || loading}
                        >
                          {gateLoading || loading
                            ? t("compatibility.gate.submitWait")
                            : guestTrialLeft === 0
                            ? gateMode === "magic"
                              ? t("compatibility.gate.submitMagic")
                              : gateMode === "login"
                              ? t("compatibility.gate.submitLogin")
                              : t("compatibility.gate.submitRegister")
                            : t("compatibility.gate.submitContinue")}
                        </button>

                        {gateErr && (
                          <p className="card-text" style={{ color: "#ff9a9a" }}>
                            {gateErr}
                          </p>
                        )}

                        {guestTrialLeft != null && (
                          <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                            {t("compatibility.gate.trialRemaining")}{" "}
                            <strong>{guestTrialLeft}</strong>
                          </p>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* ==========================
            BLOCCO PREMIUM (si apre sotto)
           ========================== */}
        {hasPremium && (
          <>
            {/* GRAFICO + DATI PREMIUM */}
            {premiumChartBase64 && (
              <section className="section">
                <div
                  className="card"
                  style={{
                    maxWidth: "850px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <h3 className="card-title">
                    {t("compatibility.premium.fullReadingTitle")}
                  </h3>

                  <p className="card-text" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    {t("compatibility.premium.fullReadingSubtitle")}
                  </p>

                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "560px",
                        paddingTop: "100%",
                      }}
                    >
                      <img
                        src={`data:image/png;base64,${premiumChartBase64}`}
                        alt={t("compatibility.premium.fullReadingTitle")}
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

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
                    {premiumTemaVisA && Array.isArray(premiumTemaVisA.pianeti) && (
                      <div
                        style={{
                          flex: "0 0 22%",
                          minWidth: "200px",
                          backgroundColor: "#15191c",
                          borderRadius: "12px",
                          border: "1px solid #2c3238",
                          padding: "16px",
                        }}
                      >
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {premiumNomeA}
                        </h4>

                        <ul
                          className="card-text"
                          style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}
                        >
                          {premiumTemaVisA.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {premiumTemaVisB && Array.isArray(premiumTemaVisB.pianeti) && (
                      <div
                        style={{
                          flex: "0 0 22%",
                          minWidth: "200px",
                          backgroundColor: "#15191c",
                          borderRadius: "12px",
                          border: "1px solid #2c3238",
                          padding: "16px",
                        }}
                      >
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {premiumNomeB}
                        </h4>

                        <ul
                          className="card-text"
                          style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}
                        >
                          {premiumTemaVisB.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {premiumAspettiPrincipali.length > 0 && (
                      <div
                        style={{
                          flex: "1 1 0%",
                          minWidth: "260px",
                          backgroundColor: "#15191c",
                          borderRadius: "12px",
                          border: "1px solid #2c3238",
                          padding: "16px",
                        }}
                      >
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {t("compatibility.free.aspectsTitle")}
                        </h4>

                        <ul
                          className="card-text"
                          style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}
                        >
                          {premiumAspettiPrincipali.slice(0, 10).map((asp, idx) => {
                            const label =
                              asp.descrizione ||
                              asp.label ||
                              formatAspettoLabel(asp) ||
                              "";
                            return <li key={idx}>{label}</li>;
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* TESTO PREMIUM: sintesi */}
            {premiumSinastriaAI?.sintesi_generale && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">
                    {t("compatibility.premium.relationshipSummary")}
                  </h3>

                  {premiumOraIgnotaGlobal && (
                    <p
                      className="card-text"
                      style={{
                        marginTop: "6px",
                        fontSize: "0.85rem",
                        color: "#ffdf9a",
                      }}
                    >
                      {t("compatibility.premium.unknownTimeWarning")}
                    </p>
                  )}

                  <p className="card-text" style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}>
                    {premiumSinastriaAI.sintesi_generale}
                  </p>
                </div>
              </section>
            )}

            {/* CAPITOLI PREMIUM */}
            {Array.isArray(premiumSinastriaAI?.capitoli) &&
              premiumSinastriaAI.capitoli.length > 0 && (
                <section className="section">
                  <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                    <h3 className="card-title">
                      {t("compatibility.premium.deepDiveChapters")}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        marginTop: 8,
                      }}
                    >
                      {premiumSinastriaAI.capitoli.map((cap, idx) => (
                        <div key={idx}>
                          <h4
                            className="card-text"
                            style={{ fontWeight: 600, marginBottom: 4 }}
                          >
                            {cap.titolo ||
                              t("compatibility.premium.chapterFallback").replace(
                                "{n}",
                                idx + 1
                              )}
                          </h4>
                          {cap.testo && (
                            <p
                              className="card-text"
                              style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}
                            >
                              {cap.testo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

            {/* AREE RELAZIONE (fallback se niente capitoli) */}
            {!(
              Array.isArray(premiumSinastriaAI?.capitoli) &&
              premiumSinastriaAI.capitoli.length > 0
            ) &&
              Array.isArray(premiumSinastriaAI?.aree_relazione) &&
              premiumSinastriaAI.aree_relazione.length > 0 && (
                <section className="section">
                  <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                    <h3 className="card-title">
                      {t("compatibility.premium.relationshipAreas")}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        marginTop: 8,
                      }}
                    >
                      {premiumSinastriaAI.aree_relazione.map((area) => (
                        <div key={area.id}>
                          <h4
                            className="card-text"
                            style={{ fontWeight: 600, marginBottom: 4 }}
                          >
                            {area.titolo || area.id}
                          </h4>

                          {area.sintesi && (
                            <p
                              className="card-text"
                              style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}
                            >
                              {area.sintesi}
                            </p>
                          )}

                          {Array.isArray(area.aspetti_principali) &&
                            area.aspetti_principali.length > 0 && (
                              <div style={{ marginBottom: 6 }}>
                                <p
                                  className="card-text"
                                  style={{ fontWeight: 500, marginBottom: 2 }}
                                >
                                  {t("compatibility.premium.mainAspects")}
                                </p>
                                <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                                  {area.aspetti_principali.map((asp, idx) => (
                                    <li key={idx}>
                                      {asp.descrizione || formatAspettoLabel(asp) || ""}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {Array.isArray(area.consigli_pratici) &&
                            area.consigli_pratici.length > 0 && (
                              <div>
                                <p
                                  className="card-text"
                                  style={{ fontWeight: 500, marginBottom: 2 }}
                                >
                                  {t("compatibility.premium.practicalTips")}
                                </p>
                                <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                                  {area.consigli_pratici.map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

            {/* FOCUS */}
            {(premiumSinastriaAI?.punti_forza ||
              premiumSinastriaAI?.punti_criticita ||
              premiumSinastriaAI?.consigli_finali) && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">
                    {t("compatibility.premium.mainFocus")}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      marginTop: 8,
                    }}
                  >
                    {Array.isArray(premiumSinastriaAI?.punti_forza) &&
                      premiumSinastriaAI.punti_forza.length > 0 && (
                        <div>
                          <h4
                            className="card-text"
                            style={{ fontWeight: 600, marginBottom: 4 }}
                          >
                            {t("compatibility.premium.strengths")}
                          </h4>
                          <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                            {premiumSinastriaAI.punti_forza.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {Array.isArray(premiumSinastriaAI?.punti_criticita) &&
                      premiumSinastriaAI.punti_criticita.length > 0 && (
                        <div>
                          <h4
                            className="card-text"
                            style={{ fontWeight: 600, marginBottom: 4 }}
                          >
                            {t("compatibility.premium.attentionPoints")}
                          </h4>
                          <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                            {premiumSinastriaAI.punti_criticita.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {Array.isArray(premiumSinastriaAI?.consigli_finali) &&
                      premiumSinastriaAI.consigli_finali.length > 0 && (
                        <div>
                          <h4
                            className="card-text"
                            style={{ fontWeight: 600, marginBottom: 4 }}
                          >
                            {t("compatibility.premium.finalAdvice")}
                          </h4>
                          <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                            {premiumSinastriaAI.consigli_finali.map((c, idx) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </section>
            )}

            {/* DYANA Q&A: solo premium */}
            {premiumReadingTextForDyana && (
              <section className="section">
                <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
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
                      style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 4 }}
                    >
                      {t("compatibility.dyana.badge")}
                    </p>

                    <h3 className="card-title" style={{ marginBottom: 6 }}>
                      {t("compatibility.dyana.title")}
                    </h3>

                    <p className="card-text" style={{ marginBottom: 4, opacity: 0.9 }}>
                      {t("compatibility.dyana.subtitle")}
                    </p>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: 16 }}
                      onClick={() => setDiyanaOpen((prev) => !prev)}
                    >
                      {diyanaOpen
                        ? t("compatibility.dyana.close")
                        : t("compatibility.dyana.ask")}
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
                          style={{ border: "none", width: "100%", height: "100%" }}
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
                      {t("compatibility.dyana.note")}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
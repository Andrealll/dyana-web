"use client";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { enqueueConversionEvent } from "../../components/ConversionTracker";
import {
  loginWithCredentials,
  registerWithEmail,
  getToken,
  clearToken,
  getAnyAuthTokenAsync,
  ensureGuestToken,
  fetchCreditsState,
  setResumeTarget,
  setResumeState,
  getResumeState,
  sendAuthMagicLink,
  updateMarketingConsent,
} from "../../lib/authClient";
import { getCountryOptions } from "../../lib/constantsCountry";

const TYPEBOT_DYANA_ID = "dyana-ai";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8001"
    : "https://chatbot-test-0h4o.onrender.com");
	
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE;
const TEMA_SINGLE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEMA_SINGLE;

const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

const AUTH_DONE_KEY = "dyana_auth_done";
const POST_LOGIN_ACTION_KEY = "dyana_post_login_action";
const TEMA_SYNC_KEY = "dyana_tema_sync";
const TEMA_SYNC_CHANNEL = "dyana_tema_sync_channel";
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

function truncateText(text, maxChars = 1100) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim() + "…";
}

function getPreviewChapters(capitoli) {
  if (!Array.isArray(capitoli)) return [];
  return capitoli.slice(0, 2);
}

function normalizeOraValue(value) {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v) return "";
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v.slice(0, 5);
  return "";
}

export default function TemaPageBase({ copy, pagePath }) {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
    country: "",
  });

  const [oraIgnota, setOraIgnota] = useState(false);
  const [loading, setLoading] = useState(false);
  const premiumAutostartRef = useRef(false);
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

  const [premiumLoaded, setPremiumLoaded] = useState(false);

  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_tema");
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("login");
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateMarketing, setGateMarketing] = useState(true);

  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [postAuthToast, setPostAuthToast] = useState("");
  const [slowLoading, setSlowLoading] = useState(false);

  const [flowMode, setFlowMode] = useState(null);
  const [renderMode, setRenderMode] = useState("none");
  const [selectedReport, setSelectedReport] = useState("");
  const [showReportChooser, setShowReportChooser] = useState(false);
  const [showLockedChapters, setShowLockedChapters] = useState(false);
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [choiceLoadingReport, setChoiceLoadingReport] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [autoOpenGateAfterPreview, setAutoOpenGateAfterPreview] = useState(false);
const [showPremiumResumeLoading, setShowPremiumResumeLoading] = useState(false);
  const countryOptions = useMemo(() => getCountryOptions(copy.lang), [copy.lang]);

  const isLoggedIn = !!getToken() && userRole !== "guest";
  const isPremium = premiumLoaded;

  const sectionLabels = {
    psicologia_profonda: copy.sections.psicologia_profonda,
    amore_relazioni: copy.sections.amore_relazioni,
    lavoro_carriera: copy.sections.lavoro_carriera,
    fortuna_crescita: copy.sections.fortuna_crescita,
    talenti: copy.sections.talenti,
    sfide: copy.sections.sfide,
    consigli: copy.sections.consigli,
  };

  const capitoliArray = normalizeCapitoli(contenuto?.capitoli);
  const hasReading = !!interpretazione;

  let readingTextForDyana = interpretazione || "";

  if (contenuto) {
    if (isPremium && capitoliArray.length > 0) {
      const extraParts = [];
      capitoliArray.forEach((cap, idx) => {
        const titolo = cap.titolo || `${copy.premium.chapter} ${idx + 1}`;
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

  const restoreFromResume = useCallback((resume) => {
    if (!resume || resume.type !== "tema") return;

    if (resume.form) {
      setForm({
        nome: resume.form.nome || "",
        data: resume.form.data || "",
        ora: normalizeOraValue(resume.form.ora),
        citta: resume.form.citta || "",
        country: resume.form.country || "",
      });
    }

    if (typeof resume.oraIgnota === "boolean") {
      setOraIgnota(resume.oraIgnota);
    }

    setInterpretazione(resume.interpretazione || "");
    setContenuto(resume.contenuto || null);
    setRisultato(resume.risultato || null);
    setTemaVis(resume.temaVis || null);
    setBilling(resume.billing || null);
    setReadingId(resume.readingId || "");
    setReadingPayload(resume.readingPayload || null);
    setKbTags(Array.isArray(resume.kbTags) ? resume.kbTags : []);
    setFlowMode(resume.flowMode || null);
    setRenderMode(resume.renderMode || "none");
    setShowReportChooser(!!resume.showReportChooser);
    setShowLockedChapters(!!resume.showLockedChapters);
    setSelectedReport(resume.selectedReport || "");
    setPremiumLoaded(resume.step === "premium_ready");
  }, []);

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

      const rawTrialAvailable =
        state?.trial_available ?? state?.cs_trial_available ?? null;

      const trialAvailable =
        rawTrialAvailable == null ? null : Number(rawTrialAvailable);

      if (role) setUserRole(role);
      if (remaining != null) setUserCredits(remaining);
      if (trialAvailable != null && !Number.isNaN(trialAvailable)) {
        setGuestTrialLeft(trialAvailable);
      }
    } catch (e) {
      console.warn("[TEMA] refreshCreditsUI failed:", e?.message || e);
    }
  }, []);
  
  const broadcastTemaSync = useCallback((type) => {
  const payload = {
    type,
    ts: Date.now(),
    path: pagePath,
  };

  try {
    localStorage.setItem(TEMA_SYNC_KEY, JSON.stringify(payload));
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent("dyana:tema-sync", { detail: payload })
    );
  } catch {}

  try {
    const bc = new BroadcastChannel(TEMA_SYNC_CHANNEL);
    bc.postMessage(payload);
    bc.close();
  } catch {}
}, [pagePath]);
useEffect(() => {
  if (typeof window === "undefined") return;

  const syncFromResume = () => {
    const resume = getResumeState();
    if (!resume || resume.type !== "tema") return;

    restoreFromResume(resume);

    if (resume.step === "premium_autostart_in_progress") {
      setLoading(true);
      setEmailGateOpen(false);
      setShowReportChooser(false);
      setShowLockedChapters(false);
    }

    if (resume.step === "premium_ready") {
      restoreFromResume(resume);
      setLoading(false);
      setPremiumLoaded(true);
      setRenderMode("premium_full");
      setEmailGateOpen(false);
      setShowReportChooser(false);
      setShowLockedChapters(false);
    }

    if (resume.step === "premium_autostart_failed") {
      setLoading(false);
    }
  };

  const storageHandler = (e) => {
    if (e?.key === TEMA_SYNC_KEY) syncFromResume();
  };

  const localHandler = () => {
    syncFromResume();
  };

  const focusHandler = () => {
    syncFromResume();
  };

  const visibilityHandler = () => {
    if (document.visibilityState === "visible") syncFromResume();
  };

  window.addEventListener("storage", storageHandler);
  window.addEventListener("dyana:tema-sync", localHandler);
  window.addEventListener("focus", focusHandler);
  document.addEventListener("visibilitychange", visibilityHandler);

  let bc = null;
  try {
    bc = new BroadcastChannel(TEMA_SYNC_CHANNEL);
    bc.onmessage = () => syncFromResume();
  } catch {}

  syncFromResume();

  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener("dyana:tema-sync", localHandler);
    window.removeEventListener("focus", focusHandler);
    document.removeEventListener("visibilitychange", visibilityHandler);
    try {
      if (bc) bc.close();
    } catch {}
  };
}, [restoreFromResume]);

  useEffect(() => {
    refreshUserFromToken();

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }, [refreshUserFromToken, refreshCreditsUI]);

  useEffect(() => {
    const resume = getResumeState();
    if (!resume || resume.type !== "tema") return;
    restoreFromResume(resume);
  }, [restoreFromResume]);
useEffect(() => {
  try {
    const resume = getResumeState();
    setShowPremiumResumeLoading(
      !!(
        !premiumLoaded &&
        resume?.type === "tema" &&
        resume?.step === "premium_autostart_in_progress"
      )
    );
  } catch {
    setShowPremiumResumeLoading(false);
  }
}, [premiumLoaded, loading, renderMode, flowMode, readingPayload, contenuto]);
useEffect(() => {
  let cancelled = false;

  async function resumeAfterTemaSinglePayment() {
    if (premiumLoaded) return;

    let marker = null;
    try {
      marker = JSON.parse(localStorage.getItem("dyana_tema_post_payment") || "null");
    } catch {
      marker = null;
    }

    if (!marker || marker.source !== "tema_single") return;

    console.log("[TEMA][POST-PAYMENT] marker trovato", marker);

    await refreshCreditsUI();

    if (cancelled) return;

    const token = getToken();
    const payload = decodeJwtPayload(token);
    const isLoggedUser = !!token && (payload?.role || "guest") !== "guest";

    if (!isLoggedUser) {
      console.warn("[TEMA][POST-PAYMENT] utente non loggato, skip");
      return;
    }

    const resume = getResumeState();
    if (!resume || resume.type !== "tema") {
      console.warn("[TEMA][POST-PAYMENT] resume tema assente, skip");
      return;
    }

    const reportToOpen = resume.selectedReport || "base";

    try {
      localStorage.removeItem("dyana_tema_post_payment");
    } catch {}

    restoreFromResume(resume);
    setFlowMode("logged_with_credits");
    setShowReportChooser(false);
    setShowLockedChapters(false);
    setEmailGateOpen(false);
    setNoCredits(false);
    setErrore("");

    console.log("[TEMA][POST-PAYMENT] lancio premium", {
      reportToOpen,
      resume,
    });

    await generaPremiumFull(reportToOpen, {
      formOverride: {
        ...(resume.form || {}),
        ora: normalizeOraValue((resume.form || {}).ora),
      },
      oraIgnotaOverride:
        typeof resume.oraIgnota === "boolean" ? resume.oraIgnota : false,
    });
  }

  resumeAfterTemaSinglePayment();

  return () => {
    cancelled = true;
  };
}, [
  premiumLoaded,
  refreshCreditsUI,
  restoreFromResume,
]);

  function handleLogout() {
    clearToken();
    setUserRole("guest");
    setUserCredits(0);
    setUserIdForDyana("guest_tema");
    setGuestTrialLeft(null);
    resetReadingState();

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
      setLoading(false);
      setGateLoading(false);
    })();
  }
async function callTema({
  tier,
  reportType = null,
  formOverride = null,
  oraIgnotaOverride = null,
}) {
  const effectiveForm = formOverride || form;
  const effectiveOraIgnota =
    typeof oraIgnotaOverride === "boolean" ? oraIgnotaOverride : oraIgnota;

  const oraEffettiva = effectiveOraIgnota
    ? null
    : normalizeOraValue(effectiveForm?.ora || "");

  const effectiveReportType = (reportType || "base").toLowerCase();

  const payload = {
    citta: effectiveForm?.citta || "",
    data: effectiveForm?.data || "",
    ora: oraEffettiva,
    country_code: effectiveForm?.country || null,
    nome: effectiveForm?.nome || null,
    tier,
    lang: copy.lang,
    ora_ignota: effectiveOraIgnota,
    report_type: effectiveReportType,
  };

  console.log("[TEMA][PAYLOAD FINAL]", payload);


    let token = await getAnyAuthTokenAsync();
    if (!token && ASTROBOT_JWT_TEMA) token = ASTROBOT_JWT_TEMA;

    const headers = {
      "Content-Type": "application/json",
      "X-Client-Source": `dyana_web/tema_${copy.lang}`,
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

  function persistResume({
    nextFlowMode,
    nextRenderMode,
    nextShowReportChooser,
    nextShowLockedChapters,
    nextSelectedReport,
    data,
    content,
    profiloGenerale,
  }) {
    const chartBase64 =
      data?.chart_png_base64 || data?.tema_vis?.chart_png_base64 || null;
    const graficoJson = data?.tema_vis?.grafico || null;
    const metaVis =
      (data?.tema_vis && data.tema_vis.meta) || data?.tema_meta || null;
    const pianetiVis = data?.tema_vis?.pianeti || [];
    const aspettiVis = data?.tema_vis?.aspetti || [];

    const temaVisSnapshot =
      chartBase64 ||
      graficoJson ||
      metaVis ||
      pianetiVis.length > 0 ||
      aspettiVis.length > 0
        ? {
            chart_png_base64: chartBase64,
            grafico: graficoJson,
            meta: metaVis,
            pianeti: pianetiVis,
            aspetti: aspettiVis,
          }
        : null;

    const billingSnapshot = data?.billing || null;
    const meta = data?.payload_ai?.meta ?? content?.meta ?? {};
    const readingIdFromBackend =
      meta.reading_id || meta.id || `tema_${Date.now()}`;
    const kbTagsSnapshot = meta.kb_tags || meta.kb || ["tema_natale"];

    setResumeTarget({ path: pagePath });
    setResumeState({
      type: "tema",
      step: "free_ready",
      form: {
        ...form,
        ora: normalizeOraValue(form?.ora),
      },
      oraIgnota,
      interpretazione:
        profiloGenerale || copy.messages.interpretationUnavailable,
      contenuto: content,
      risultato: data?.result || null,
      temaVis: temaVisSnapshot,
      billing: billingSnapshot,
      readingId: readingIdFromBackend,
      readingPayload: data,
      kbTags: kbTagsSnapshot,
      flowMode: nextFlowMode,
      renderMode: nextRenderMode,
      showReportChooser: nextShowReportChooser,
      showLockedChapters: nextShowLockedChapters,
      selectedReport: nextSelectedReport,
    });
  }

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
        `${copy.errors.aiPrefix}: ${resultWrapper.error}` +
          (resultWrapper.parse_error ? ` — ${resultWrapper.parse_error}` : "")
      );
      setReadingPayload(data);
      return;
    }

    const profiloGenerale = (content?.profilo_generale || "").trim();
    setInterpretazione(
      profiloGenerale || copy.messages.interpretationUnavailable
    );

    const meta = data?.payload_ai?.meta ?? content?.meta ?? {};
    const readingIdFromBackend =
      meta.reading_id || meta.id || `tema_${Date.now()}`;

    setReadingId(readingIdFromBackend);
    setReadingPayload(data);
    setKbTags(meta.kb_tags || meta.kb || ["tema_natale"]);
  }

  async function generaPremiumPreview() {
    await generaFreeStrong("guest_first");
  }

  function resetReadingState() {
    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);
    setBilling(null);
    setTemaVis(null);
    setReadingId("");
    setReadingPayload(null);
    setKbTags([]);
    setPremiumLoaded(false);
    setRenderMode("none");
    setShowReportChooser(false);
    setShowLockedChapters(false);
    setSelectedReport("");
    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setMagicLinkSent(false);
    setAutoOpenGateAfterPreview(false);
    premiumAutostartRef.current = false;
  }

  function resolveFlowMode() {
    const isLogged = !!getToken() && userRole !== "guest";

    if (isLogged && userCredits > 0) return "logged_with_credits";
    if (isLogged && userCredits <= 0) return "logged_no_credits";

    const trialLeftNum =
      typeof guestTrialLeft === "number"
        ? guestTrialLeft
        : Number(guestTrialLeft);

    if (!Number.isNaN(trialLeftNum) && trialLeftNum > 0) {
      return "guest_first";
    }

    return "guest_return";
  }

  async function generaFreeStrong(nextFlowMode) {
    console.log("[TEMA] generaFreeStrong", { nextFlowMode });
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    resetReadingState();

    if (nextFlowMode === "guest_first") {
      setSelectedReport("base");
    }

    try {
      const { res, data } = await callTema({
        tier: "free",
        reportType: "base",
      });

      if (!res.ok) {
        const msg =
          (data && (data.error || data.detail || data.message)) ||
          copy.errors.generationGeneric;
        setErrore(typeof msg === "string" ? msg : copy.errors.generationGeneric);
        return;
      }

      applyTemaResponse(data);

      const content =
        data?.result?.content ??
        data?.tema_ai?.content ??
        data?.tema_ai ??
        data?.content ??
        null;

      const profiloGenerale = (content?.profilo_generale || "").trim();

      if (nextFlowMode === "guest_first") {
        setFlowMode("guest_first");
        setRenderMode("free");
        setShowReportChooser(false);
        setShowLockedChapters(false);
        setEmailGateOpen(true);
        setGateMode("magic");
        setGateMsg(copy.messages.previewReady);
        setMagicLinkSent(false);

        persistResume({
          nextFlowMode: "guest_first",
          nextRenderMode: "free",
          nextShowReportChooser: false,
          nextShowLockedChapters: false,
          nextSelectedReport: "base",
          data,
          content,
          profiloGenerale,
        });
      }

      if (nextFlowMode === "guest_return") {
        setFlowMode("guest_return");
        setRenderMode("free");
        setShowReportChooser(true);
        setShowLockedChapters(false);

        persistResume({
          nextFlowMode: "guest_return",
          nextRenderMode: "free",
          nextShowReportChooser: true,
          nextShowLockedChapters: false,
          nextSelectedReport: "",
          data,
          content,
          profiloGenerale,
        });
      }

      if (nextFlowMode === "logged_no_credits") {
        setFlowMode("logged_no_credits");
        setRenderMode("free");
        setShowReportChooser(true);
        setShowLockedChapters(false);

        persistResume({
          nextFlowMode: "logged_no_credits",
          nextRenderMode: "free",
          nextShowReportChooser: true,
          nextShowLockedChapters: false,
          nextSelectedReport: "",
          data,
          content,
          profiloGenerale,
        });
      }

      await refreshCreditsUI();
    } catch (e) {
      console.error("[TEMA][FREE] errore reale:", e);
      setErrore(copy.errors.serverUnavailable);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartReading() {
    const mode = resolveFlowMode();
    console.log("[TEMA] handleStartReading", {
      mode,
      guestTrialLeft,
      userRole,
      userCredits,
      hasToken: !!getToken(),
    });

    setFlowMode(mode);
    setErrore("");
    setNoCredits(false);
    setSelectedReport("");
    setShowReportChooser(false);
    setShowLockedChapters(false);

    if (mode === "guest_first") {
      await generaFreeStrong("guest_first");
      return;
    }

    if (mode === "guest_return") {
      await generaFreeStrong("guest_return");
      return;
    }

    if (mode === "logged_no_credits") {
      await generaFreeStrong("logged_no_credits");
      return;
    }

    if (mode === "logged_with_credits") {
      resetReadingState();
      setFlowMode("logged_with_credits");
      setRenderMode("none");
      setShowReportChooser(true);
      return;
    }
  }

async function generaPremiumFull(reportType, options = {}) {

    console.log("[TEMA][PREMIUM FULL] start", { reportType });

    setLoading(true);
    setChoiceLoading(true);
    setChoiceLoadingReport(reportType || "");
    setErrore("");
    setNoCredits(false);

    try {
const { res, data } = await callTema({
  tier: "premium",
  reportType,
  formOverride: options.formOverride || null,
  oraIgnotaOverride:
    typeof options.oraIgnotaOverride === "boolean"
      ? options.oraIgnotaOverride
      : null,
});

      console.log("[TEMA][PREMIUM FULL] response", {
        ok: res.ok,
        status: res.status,
        data,
      });

      if (!res.ok) {
        const errorCode =
          data?.error_code || data?.code || data?.error || data?.detail;
        const isCreditsError =
          res.status === 402 ||
          res.status === 403 ||
          (typeof errorCode === "string" &&
            errorCode.toLowerCase().includes("credit"));

        const msg =
          (data && (data.error || data.detail || data.message)) ||
          copy.errors.generationGeneric;

        if (isCreditsError) {
          setNoCredits(true);
          setErrore(copy.errors.premiumNeedsCredits);
          await refreshCreditsUI();
          return;
        }

        setErrore(typeof msg === "string" ? msg : copy.errors.generationGeneric);
        return;
      }

applyTemaResponse(data);
setPremiumLoaded(true);
setRenderMode("premium_full");
setShowReportChooser(false);
setShowLockedChapters(false);
premiumAutostartRef.current = false;
broadcastTemaSync("premium_ready");

      try {
        const currentResume = getResumeState();

        const premiumContent =
          data?.result?.content ??
          data?.tema_ai?.content ??
          data?.tema_ai ??
          data?.content ??
          null;

        const premiumProfiloGenerale = (premiumContent?.profilo_generale || "").trim();

        const chartBase64 =
          data?.chart_png_base64 || data?.tema_vis?.chart_png_base64 || null;
        const graficoJson = data?.tema_vis?.grafico || null;
        const metaVis =
          (data?.tema_vis && data.tema_vis.meta) || data?.tema_meta || null;
        const pianetiVis = data?.tema_vis?.pianeti || [];
        const aspettiVis = data?.tema_vis?.aspetti || [];

        const temaVisSnapshot =
          chartBase64 ||
          graficoJson ||
          metaVis ||
          pianetiVis.length > 0 ||
          aspettiVis.length > 0
            ? {
                chart_png_base64: chartBase64,
                grafico: graficoJson,
                meta: metaVis,
                pianeti: pianetiVis,
                aspetti: aspettiVis,
              }
            : null;

        const billingSnapshot = data?.billing || null;
        const meta = data?.payload_ai?.meta ?? premiumContent?.meta ?? {};
        const readingIdFromBackend =
          meta.reading_id || meta.id || `tema_${Date.now()}`;
        const kbTagsSnapshot = meta.kb_tags || meta.kb || ["tema_natale"];

        setResumeTarget({ path: pagePath });
        setResumeState({
          ...(currentResume || {}),
          type: "tema",
          step: "premium_ready",
          form: {
            ...(options.formOverride || form),
            ora: normalizeOraValue((options.formOverride || form)?.ora),
          },
          oraIgnota:
            typeof options.oraIgnotaOverride === "boolean"
              ? options.oraIgnotaOverride
              : oraIgnota,
          interpretazione:
            premiumProfiloGenerale || copy.messages.interpretationUnavailable,
          contenuto: premiumContent,
          risultato: data?.result || null,
          temaVis: temaVisSnapshot,
          billing: billingSnapshot,
          readingId: readingIdFromBackend,
          readingPayload: data,
          kbTags: kbTagsSnapshot,
          flowMode: "logged_with_credits",
          renderMode: "premium_full",
          showReportChooser: false,
          showLockedChapters: false,
          selectedReport: reportType || "base",
        });
      } catch {}

      enqueueConversionEvent("tema_completed", {
        feature: "tema",
        tier: "premium",
        report_type: reportType,
        lang: copy.lang,
      });

      await refreshCreditsUI();
    } catch (e) {
      console.error("[TEMA][PREMIUM] errore reale:", e);

      premiumAutostartRef.current = false;

      try {
        const currentResume = getResumeState();
        if (currentResume?.type === "tema") {
          setResumeTarget({ path: pagePath });
          setResumeState({
            ...currentResume,
            step: "premium_autostart_failed",
          });
        }
      } catch {}
broadcastTemaSync("premium_failed");
      setErrore(copy.errors.serverUnavailable);
    } finally {
      setChoiceLoading(false);
      setChoiceLoadingReport("");
      setLoading(false);
    }
  }

  const startPremiumBaseFromResume = useCallback(async (resume) => {
    if (!resume || resume.type !== "tema") return;
    if (premiumAutostartRef.current) return;

    console.log("[TEMA][AUTOSTART] resume", resume);

    premiumAutostartRef.current = true;

    try {
      restoreFromResume(resume);

      setFlowMode("logged_with_credits");
      setRenderMode("free");
      setPremiumLoaded(false);
      setShowReportChooser(false);
      setShowLockedChapters(false);
      setSelectedReport("base");
      setEmailGateOpen(false);
      setGateErr("");
      setGateMsg("");
      setMagicLinkSent(false);
      setLoading(true);

      setResumeTarget({ path: pagePath });
      setResumeState({
        ...resume,
        step: "premium_autostart_in_progress",
        flowMode: "logged_with_credits",
        renderMode: "free",
        showReportChooser: false,
        showLockedChapters: false,
        selectedReport: "base",
        form: {
          ...(resume.form || {}),
          ora: normalizeOraValue((resume.form || {}).ora),
        },
      });

const normalizedResumeForm = {
  ...(resume.form || {}),
  ora: normalizeOraValue((resume.form || {}).ora),
};

if (!normalizedResumeForm.data || !normalizedResumeForm.citta) {
  console.error("[TEMA][AUTOSTART] missing resume form fields", normalizedResumeForm);
  premiumAutostartRef.current = false;
  setErrore(
    copy.lang === "it"
      ? "Impossibile riprendere il premium: dati nascita mancanti nel resume."
      : "Unable to resume premium: missing birth data in resume."
  );
  return;
}

console.log("[TEMA][AUTOSTART] launching premium base", normalizedResumeForm);

broadcastTemaSync("premium_autostart_started");

await generaPremiumFull("base", {

  formOverride: normalizedResumeForm,
  oraIgnotaOverride:
    typeof resume.oraIgnota === "boolean" ? resume.oraIgnota : false,
});
    } catch (e) {
      console.error("[TEMA][AUTOSTART] failed:", e);

      premiumAutostartRef.current = false;

      try {
        setResumeTarget({ path: pagePath });
        setResumeState({
          ...resume,
          step: "premium_autostart_failed",
        });
      } catch {}
    }
  }, [pagePath, restoreFromResume]);

  useEffect(() => {
    const resume = getResumeState();
    if (!resume) return;

    const token = getToken();
    const payload = decodeJwtPayload(token);
    const isLoggedUser = !!token && (payload?.role || "guest") !== "guest";

    if (!isLoggedUser) return;
    if (premiumLoaded) return;

    const shouldResumeGuestFirstPremium =
      resume.type === "tema" &&
      resume.flowMode === "guest_first" &&
      resume.renderMode === "free" &&
      (resume.step === "free_ready" || resume.step === "premium_autostart_failed");

    if (!shouldResumeGuestFirstPremium) return;

    startPremiumBaseFromResume(resume);
  }, [pagePath, premiumLoaded, startPremiumBaseFromResume]);

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
      setMagicLinkSent(false);

      try {
        const currentResume = getResumeState();

        if (
          currentResume?.type === "tema" &&
          currentResume?.flowMode === "guest_first"
        ) {
          await startPremiumBaseFromResume(currentResume);
          return;
        }
      } catch {}

      setJustLoggedIn(true);
      setPostAuthToast(copy.messages.postLoginToast);
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
        if (bc) bc.close();
      } catch {}
    };
  }, [
    refreshUserFromToken,
    refreshCreditsUI,
    copy.messages.postLoginToast,
    startPremiumBaseFromResume,
  ]);
async function handleBuyTemaSingle() {
  try {
    const currentToken = getToken();

    if (!currentToken) {
      throw new Error("Login richiesto");
    }

    const payload = decodeJwtPayload(currentToken);
    const userId = payload?.sub;

    if (!userId) {
      throw new Error("Token non valido");
    }

    if (!TEMA_SINGLE_PRICE_ID) {
      throw new Error("Prezzo Tema non configurato");
    }

    const successUrl = `${window.location.origin}${pagePath}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}${pagePath}`;

    const res = await fetch(`${AUTH_BASE}/billing/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        price_id: TEMA_SINGLE_PRICE_ID,
        success_url: successUrl,
        cancel_url: cancelUrl,
        user_id: userId,
        pack_id: "tema_single",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.detail || "Errore creazione checkout");
    }

    if (!data.checkout_url) {
      throw new Error("Checkout URL mancante");
    }

    const url = data.checkout_url;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }

    window.location.href = url;
  } catch (err) {
    console.error("[TEMA] Errore acquisto tema single:", err);
    alert(err.message || "Errore acquisto");
  }
}

  function openEmailGate(mode = "magic", message = "") {
    setGateErr("");
    setGateLoading(false);
    setMagicLinkSent(false);
    setGateMode(mode);
    setGateMsg(message || copy.messages.emailToContinue);
    setEmailGateOpen(true);
  }

  async function submitInlineAuth(e) {
    e.preventDefault();

    setGateErr("");
    setGateLoading(true);

    try {
      const email = (gateEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        setGateErr(copy.errors.invalidEmail);
        return;
      }

      try {
        localStorage.setItem("dyana_pending_email", email);
      } catch {}

      setResumeTarget({ path: pagePath });

      const redirectUrl =
        typeof window !== "undefined" && window.location?.origin
          ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
          : "https://dyana.app/auth/callback";

      if (gateMode === "magic") {
        await sendAuthMagicLink(email, redirectUrl);
        setMagicLinkSent(true);
        setGateMsg(copy.messages.linkSent);
        return;
      }
      if (gateMode === "login") {
        if (!gatePass) {
          setGateErr(copy.errors.passwordRequired);
          return;
        }

        await loginWithCredentials(email, gatePass);

        try {
          localStorage.removeItem(POST_LOGIN_ACTION_KEY);
        } catch {}

        refreshUserFromToken();
        await refreshCreditsUI();

        setEmailGateOpen(false);
        setGateErr("");
        setGateMsg("");

        try {
          const currentResume = getResumeState();

          if (
            currentResume?.type === "tema" &&
            currentResume?.flowMode === "guest_first"
          ) {
            await startPremiumBaseFromResume(currentResume);
            return;
          }

          if (currentResume?.type === "tema") {
            restoreFromResume(currentResume);
            setFlowMode("logged_no_credits");
            setRenderMode("free");
            setShowReportChooser(true);
            setShowLockedChapters(false);

            setResumeTarget({ path: pagePath });
            setResumeState({
              ...currentResume,
              flowMode: "logged_no_credits",
              renderMode: "free",
              showReportChooser: true,
              showLockedChapters: false,
            });
          }
        } catch {}

        return;
      }

      if (gateMode === "register") {
        if (!gatePass || gatePass.length < 6) {
          setGateErr(copy.errors.passwordMinLength);
          return;
        }

        if (gatePass !== gatePass2) {
          setGateErr(copy.errors.passwordsMismatch);
          return;
        }

        await registerWithEmail(email, gatePass);
        await loginWithCredentials(email, gatePass);

        try {
          localStorage.removeItem(POST_LOGIN_ACTION_KEY);
        } catch {}

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
            "[TEMA][INLINE-AUTH] updateMarketingConsent failed:",
            err?.message || err
          );
        }

        refreshUserFromToken();
        await refreshCreditsUI();

        setEmailGateOpen(false);
        setGateErr("");
        setGateMsg("");

        try {
          const currentResume = getResumeState();

          if (
            currentResume?.type === "tema" &&
            currentResume?.flowMode === "guest_first"
          ) {
            await startPremiumBaseFromResume(currentResume);
            return;
          }

          if (currentResume?.type === "tema") {
            restoreFromResume(currentResume);
            setFlowMode("logged_no_credits");
            setRenderMode("free");
            setShowReportChooser(true);
            setShowLockedChapters(false);

            setResumeTarget({ path: pagePath });
            setResumeState({
              ...currentResume,
              flowMode: "logged_no_credits",
              renderMode: "free",
              showReportChooser: true,
              showLockedChapters: false,
            });
          }
        } catch {}

        return;
      }

      setGateErr(copy.errors.genericActionFailed);
    } catch (err) {
      setGateErr(err?.message || copy.errors.genericActionFailed);
    } finally {
      setGateLoading(false);
    }
  }
function reopenTemaChooser(reportKey) {
  const resume = getResumeState();

  if (resume?.type === "tema") {
    restoreFromResume(resume);
  }

  setFlowMode("logged_with_credits");
  setPremiumLoaded(false);
  setRenderMode("premium_full");
  setShowLockedChapters(false);
  setShowReportChooser(true);
  setSelectedReport(reportKey);

  try {
    setResumeTarget({ path: pagePath });
    setResumeState({
      ...(resume || {}),
      type: "tema",
      step: "premium_ready",
      flowMode: "logged_with_credits",
      renderMode: "premium_full",
      showReportChooser: true,
      showLockedChapters: false,
      selectedReport: reportKey,
    });
  } catch {}
}
const hasSavedResume =
  !!readingPayload ||
  !!interpretazione ||
  !!contenuto ||
  !!temaVis; 

function handleResumeCta() {
  if (userRole === "guest") return;

  if (userCredits > 0) {
    setFlowMode("logged_with_credits");
    setShowLockedChapters(false);
    setShowReportChooser(true);
    return;
  }

  setFlowMode("logged_no_credits");
  setShowLockedChapters(true);
  setShowReportChooser(false);
}

function handleStartNewFromSaved() {
  setErrore("");
  setNoCredits(false);
  setInterpretazione("");
  setContenuto(null);
  setRisultato(null);
  setTemaVis(null);
  setBilling(null);
  setReadingId("");
  setReadingPayload(null);
  setKbTags([]);
  setPremiumLoaded(false);
  setRenderMode("none");
  setShowReportChooser(false);
  setShowLockedChapters(false);
  setSelectedReport("");
  setDiyanaOpen(false);
  setEmailGateOpen(false);
  setGateErr("");
  setGateMsg("");
  setMagicLinkSent(false);
  premiumAutostartRef.current = false;

  try {
    const resume = getResumeState();
    if (resume?.type === "tema") {
      setResumeTarget({ path: pagePath });
      setResumeState({
        ...resume,
        step: "idle",
        interpretazione: "",
        contenuto: null,
        risultato: null,
        temaVis: null,
        billing: null,
        readingId: "",
        readingPayload: null,
        kbTags: [],
        renderMode: "none",
        showReportChooser: false,
        showLockedChapters: false,
        selectedReport: "",
      });
    }
  } catch {}
}

  
  
  const typebotUrl = useMemo(() => {
    const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
    try {
      const params = new URLSearchParams();

      if (userIdForDyana) params.set("user_id", userIdForDyana);
      if (sessionId) params.set("session_id", sessionId);

      params.set("reading_id", readingId || "tema_inline");
      params.set("reading_type", "tema_natale");
      params.set(
        "reading_label",
        copy.lang === "it" ? "Il tuo Tema Natale" : "Your Birth Chart Reading"
      );

      const safeReadingText = (readingTextForDyana || "").slice(0, 6000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      params.set("lang", copy.lang);

      const qs = params.toString();
      return qs ? `${baseUrl}?${qs}` : baseUrl;
    } catch {
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, readingId, readingTextForDyana, copy.lang]);

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
              {copy.messages.postLoginTitle}
            </h4>
            <p className="card-text" style={{ opacity: 0.9 }}>
              {postAuthToast}
            </p>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setJustLoggedIn(false)}
              >
                {copy.gate.continue}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setJustLoggedIn(false)}
              >
                {copy.gate.close}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">{copy.hero.title}</h1>
          <p className="section-subtitle">
            {copy.hero.subtitleLine1}
            <br />
            {copy.hero.subtitleLine2Before}{" "}
            <strong>{copy.hero.subtitleLine2Highlight}</strong>{" "}
            {copy.hero.subtitleLine2After}
          </p>
        </header>

        {showPremiumResumeLoading && (
          <section className="section">
            <div
              className="card"
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                border: "1px solid rgba(187,154,99,0.45)",
                background: "rgba(187,154,99,0.08)",
              }}
            >
              <h4 className="card-subtitle" style={{ marginBottom: 6 }}>
                {copy.messages.premiumResumeLoadingTopTitle}
              </h4>
              <p className="card-text" style={{ opacity: 0.92 }}>
                {copy.messages.premiumResumeLoadingTopText}
              </p>
            </div>
          </section>
        )}

        <section className="section">
          <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label className="card-text">{copy.form.nameLabel}</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                  placeholder={copy.form.namePlaceholder}
                />
              </div>

              <div className="form-row" style={{ display: "flex", gap: "16px" }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="data_nascita" className="card-text">
                    {copy.form.birthDate}
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
                    {copy.form.birthTime}
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
                    {copy.form.unknownTime}
                  </label>
                </div>
              </div>

              <div>
                <label className="card-text">{copy.form.birthPlace}</label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={(e) => setForm({ ...form, citta: e.target.value })}
                  className="form-input"
                  placeholder={copy.form.birthPlacePlaceholder}
                  autoComplete="off"
                />

                <div style={{ marginTop: 12 }}>
                  <label className="card-text">{copy.form.country}</label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="">{copy.form.countryPlaceholder}</option>
                    {countryOptions.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartReading}
                className="btn btn-primary"
                disabled={loading || choiceLoading}
                style={{ marginTop: "14px" }}
              >
                {loading && !choiceLoading ? copy.cta.generating : copy.cta.startReading}
              </button>

              {errore &&
                (noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {isLoggedIn ? (
                      <>
                        <p>{copy.messages.noCreditsTitle}</p>
                        <p style={{ marginTop: 8 }}>
                          <Link href="/crediti" className="link">
                            {copy.cta.openCredits}
                          </Link>
                        </p>
                        <p style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.8 }}>
                          {copy.messages.detailsPrefix} {errore}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{copy.messages.firstReadingDone}</p>
                        <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                          {copy.messages.signupOrLogin}
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
{isLoggedIn && hasSavedResume && !premiumLoaded && (
			<section className="section">
            <div
              className="card"
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <h4 className="card-subtitle" style={{ marginBottom: 6 }}>
                {copy.messages.savedReadingTitle}
              </h4>

              <p className="card-text" style={{ opacity: 0.9 }}>
                {copy.messages.savedReadingText}
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleResumeCta}
                >
                  {copy.messages.savedReadingContinue}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={handleStartNewFromSaved}
                >
                  {copy.messages.savedReadingNew}
                </button>
              </div>
            </div>
          </section>
        )}
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
                {copy.unknownTimeWarning.text}
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
              <h3 className="card-title">{copy.chart.title}</h3>

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
                    src={`data:image/png;base64,${temaVis.chart_png_base64}`}
                    alt={copy.chart.imageAlt}
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
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginTop: "12px",
                }}
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
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "12px" }}>
                    {copy.chart.planetsTitle}
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
                      {copy.chart.planetsUnavailable}
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
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "12px" }}>
                    {copy.chart.aspectsTitle}
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
                      {copy.chart.aspectsUnavailable}
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
              <h3 className="card-title">{copy.summary.title}</h3>
              <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {interpretazione}
              </p>

              {renderMode === "free" && capitoliArray.length > 0 && (
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                  {capitoliArray.map((cap, idx) => (
                    <div
                      key={`${cap.titolo}-${idx}`}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p
                        className="card-text"
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {cap.titolo}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {renderMode === "free" &&
                !premiumLoaded &&
                flowMode === "guest_first" &&
                !isLoggedIn && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <p
                      className="card-text"
                      style={{
                        fontSize: "0.92rem",
                        opacity: 0.92,
                        margin: 0,
                      }}
                    >
                      {copy.messages.previewReady}
                    </p>
                  </div>
                )}

              {renderMode === "free" &&
                !premiumLoaded &&
                isLoggedIn &&
                flowMode === "logged_no_credits" && (
                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
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
                      {copy.messages.premiumCost}
                    </span>
                  </div>
                )}
            </div>
          </section>
        )}

        {showPremiumResumeLoading && (
          <section className="section">
            <div
              className="card"
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                border: "1px solid rgba(187,154,99,0.45)",
                background: "rgba(187,154,99,0.08)",
              }}
            >
              <p className="card-text" style={{ opacity: 0.92 }}>
                {copy.messages.premiumResumeLoadingBottomText}
              </p>
            </div>
          </section>
        )}

        {showReportChooser && !premiumLoaded && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{copy.reports.title}</h3>

              <p className="card-text" style={{ opacity: 0.9, marginBottom: 16 }}>
                {flowMode === "logged_with_credits"
                  ? copy.reports.loggedWithCreditsSubtitle
                  : copy.reports.subtitle}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                }}
              >
                {Object.entries(copy.reports.options).map(([key, label]) => {
                  const active = selectedReport === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedReport(key)}
                      style={{
                        textAlign: "left",
                        padding: "18px 16px",
                        borderRadius: "16px",
                        border: active
                          ? "1px solid rgba(187,154,99,0.9)"
                          : "1px solid rgba(255,255,255,0.10)",
                        background: active
                          ? "rgba(187,154,99,0.10)"
                          : "rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.02rem",
                          fontWeight: 700,
                          marginBottom: 8,
                          color: "#fff",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          lineHeight: 1.5,
                          opacity: 0.82,
                          color: "#d7dbe7",
                        }}
                      >
                        {copy.reports.descriptions[key]}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedReport && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 18 }}
                  disabled={choiceLoading}
                  onClick={async () => {
                    if (flowMode === "logged_with_credits") {
                      await generaPremiumFull(selectedReport);
                      return;
                    }

                    setShowReportChooser(false);
                    setShowLockedChapters(true);

                    if (typeof contenuto !== "undefined") {
                      const content = contenuto;
                      const profiloGenerale = (content?.profilo_generale || "").trim();

                      persistResume({
                        nextFlowMode: flowMode,
                        nextRenderMode: renderMode,
                        nextShowReportChooser: false,
                        nextShowLockedChapters: true,
                        nextSelectedReport: selectedReport,
                        data: readingPayload || {},
                        content,
                        profiloGenerale,
                      });
                    }
                  }}
                >
                  {choiceLoading && choiceLoadingReport === selectedReport
                    ? (copy.cta.preparingPremium || copy.cta.generating)
                    : copy.cta.continue}
                </button>
              )}
            </div>
          </section>
        )}

        {showLockedChapters && !premiumLoaded && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{copy.locked.title}</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {capitoliArray.length > 0
                  ? capitoliArray.map((cap, idx) => (
                      <div
                        key={`${cap.titolo}-${idx}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: 8,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <span className="card-text">
                          {cap.titolo || `${copy.premium.chapter} ${idx + 1}`}
                        </span>
                        <span className="card-text">🔒</span>
                      </div>
                    ))
                  : Object.entries(sectionLabels).map(([key, label]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: 8,
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <span className="card-text">{label}</span>
                        <span className="card-text">🔒</span>
                      </div>
                    ))}
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.28)",
                }}
              >
                {flowMode === "guest_return" ? (
                  <>
                    <h4 style={{ marginBottom: 8 }}>{copy.locked.guestTitle}</h4>
                    <p className="card-text" style={{ opacity: 0.9 }}>
                      {copy.messages.lockedGuestReturn}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: 14 }}
                      onClick={() =>
                        openEmailGate("magic", copy.messages.guestContinueWithEmail)
                      }
                    >
                      {copy.gate.continueWithEmail}
                    </button>
                  </>
                ) : (
<>
  <h4 style={{ marginBottom: 8 }}>{copy.locked.noCreditsTitle}</h4>
  <p className="card-text" style={{ opacity: 0.9 }}>
    {copy.messages.lockedNoCredits}
  </p>

  <div
    style={{
      marginTop: 14,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      className="btn btn-primary"
      onClick={handleBuyTemaSingle}
    >
      Sblocca il tuo Tema – 2.99€
    </button>

    <button
      type="button"
      className="btn"
      onClick={() => {
        window.location.href = "/crediti";
      }}
    >
      {copy.cta.openCredits}
    </button>
  </div>
</>
                )}
              </div>
            </div>
          </section>
        )}

        {emailGateOpen && !premiumLoaded && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h4 className="card-subtitle" style={{ marginBottom: 6 }}>
                {copy.gate.continueWithEmail}
              </h4>

              <p className="card-text" style={{ opacity: 0.9 }}>
                {gateMsg}
              </p>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className={gateMode === "login" ? "btn btn-primary" : "btn"}
                  onClick={() => setGateMode("login")}
                >
                  {copy.gate.login}
                </button>

                <button
                  type="button"
                  className={gateMode === "register" ? "btn btn-primary" : "btn"}
                  onClick={() => setGateMode("register")}
                >
                  {copy.gate.register}
                </button>

                <button
                  type="button"
                  className={gateMode === "magic" ? "btn btn-primary" : "btn"}
                  onClick={() => setGateMode("magic")}
                >
                  {copy.gate.magicLink}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setEmailGateOpen(false)}
                  style={{ marginLeft: "auto" }}
                >
                  {copy.gate.close}
                </button>
              </div>

              <form
                onSubmit={submitInlineAuth}
                style={{ marginTop: 12, display: "grid", gap: 10 }}
              >
                <input
                  className="form-input"
                  type="email"
                  placeholder={copy.gate.emailPlaceholder}
                  value={gateEmail}
                  onChange={(e) => setGateEmail(e.target.value)}
                />

                {gateMode === "register" && (
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
                        {copy.gate.marketingConsent}
                      </span>
                    </label>

                    <p
                      className="card-text"
                      style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 8 }}
                    >
                      {copy.gate.termsPrefix}{" "}
                      <Link
                        href="/condizioni"
                        className="link"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.gate.termsLink}
                      </Link>{" "}
                      {copy.gate.privacyPrefix}{" "}
                      <Link
                        href="/privacy"
                        className="link"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.gate.privacyLink}
                      </Link>
                      .
                    </p>
                  </div>
                )}

                {gateMode !== "magic" && (
                  <>
                    <input
                      className="form-input"
                      type="password"
                      placeholder={copy.gate.password}
                      value={gatePass}
                      onChange={(e) => setGatePass(e.target.value)}
                      autoComplete="current-password"
                    />
                    {gateMode === "register" && (
                      <input
                        className="form-input"
                        type="password"
                        placeholder={copy.gate.repeatPassword}
                        value={gatePass2}
                        onChange={(e) => setGatePass2(e.target.value)}
                        autoComplete="new-password"
                      />
                    )}
                  </>
                )}
				
                {gateErr && (
                  <p className="card-text" style={{ color: "#ff9a9a", margin: 0 }}>
                    {gateErr}
                  </p>
                )}
				
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={gateLoading || loading}
                >
                  {gateLoading
                    ? gateMode === "magic"
                      ? copy.cta.sendLink
                      : copy.cta.completing
                    : gateMode === "magic"
                    ? magicLinkSent
                      ? copy.cta.sendLinkAgain
                      : copy.cta.sendLink
                    : gateMode === "login"
                    ? copy.cta.loginAndContinue
                    : copy.cta.registerAndContinue}
                </button>

                {magicLinkSent && gateMode === "magic" && (
                  <p className="card-text" style={{ color: "#bb9a63" }}>
                    {copy.messages.linkSent}
                    {copy.lang === "it"
                      ? " Se non la vedi, controlla anche Spam e Promozioni."
                      : " If you do not see it, check Spam and Promotions too."}
                  </p>
                )}

                {guestTrialLeft != null && (
                  <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                    {copy.messages.guestTrialLeft} <strong>{guestTrialLeft}</strong>
                  </p>
                )}
              </form>
            </div>
          </section>
        )}

        {!premiumLoaded && noCredits && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <div
                style={{
                  marginTop: 16,
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <h4 style={{ marginBottom: 6 }}>{copy.paywall.title}</h4>

                <p className="card-text" style={{ opacity: 0.9 }}>
                  {copy.paywall.text}
                </p>

<div
  style={{
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  }}
>
  <button
    className="btn btn-primary"
    onClick={handleBuyTemaSingle}
  >
    Sblocca il tuo Tema – 2.99€
  </button>

  <button
    className="btn"
    onClick={() => {
      window.location.href = "/crediti";
    }}
  >
    {copy.cta.openCredits}
  </button>
</div>
              </div>
            </div>
          </section>
        )}

        {premiumLoaded && contenuto && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{copy.premium.title}</h3>

              {capitoliArray.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {capitoliArray.map((cap, idx) => {
                    const titolo = cap.titolo || `${copy.premium.chapter} ${idx + 1}`;
                    const testo = cap.testo || cap.contenuto || cap.testo_breve || "";
                    if (!testo) return null;
                    return (
                      <div key={`${titolo}-${idx}`}>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
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
                  {copy.qa.eyebrow}
                </p>

                <h3 className="card-title" style={{ marginBottom: 6 }}>
                  {copy.qa.title}
                </h3>

                <p className="card-text" style={{ marginBottom: 4, opacity: 0.9 }}>
                  {copy.qa.text1}
                </p>

                <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  {copy.qa.text2Before} <strong>{copy.qa.text2Highlight1}</strong>{" "}
                  {copy.qa.text2Middle} <strong>{copy.qa.text2Highlight2}</strong>{" "}
                  {copy.qa.text2After}
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setDiyanaOpen((prev) => !prev)}
                >
                  {diyanaOpen ? copy.cta.closeDyana : copy.cta.askDyana}
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
                  {copy.qa.footer}
                </p>
              </div>
            </div>
          </section>
        )}

        {premiumLoaded && copy.postPremium && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{copy.postPremium.title}</h3>
              <p className="card-text" style={{ opacity: 0.9 }}>
                {copy.postPremium.text}
              </p>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => reopenTemaChooser("amore")}
                >
                  {copy.postPremium.buttons.love}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => reopenTemaChooser("carriera")}
                >
                  {copy.postPremium.buttons.career}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => reopenTemaChooser("psicologia")}
                >
                  {copy.postPremium.buttons.psychology}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => reopenTemaChooser("karma")}
                >
                  {copy.postPremium.buttons.karma}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    window.location.href = copy.lang === "it" ? "/oroscopo" : "/en/oroscopo";
                  }}
                >
                  {copy.postPremium.buttons.horoscope}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    window.location.href =
                      copy.lang === "it" ? "/compatibilita" : "/en/compatibilita";
                  }}
                >
                  {copy.postPremium.buttons.compatibility}
                </button>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
"use client";

import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useState, useEffect, useMemo, useCallback } from "react";
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
const TEMA_SYNC_KEY = "dyana_tema_sync";
const TEMA_SYNC_CHANNEL = "dyana_tema_sync_channel";

const UI = {
  IDLE: "IDLE",
  BASE_LOADING: "BASE_LOADING",
  FREE_READY: "FREE_READY",
  GATE_OPEN: "GATE_OPEN",
  CHOOSER_OPEN: "CHOOSER_OPEN",
  PAYWALL_OPEN: "PAYWALL_OPEN",
  PREMIUM_LOADING: "PREMIUM_LOADING",
  PREMIUM_READY: "PREMIUM_READY",
};

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
  const [uiState, setUiState] = useState(UI.IDLE);
  const [errore, setErrore] = useState("");

  const [interpretazione, setInterpretazione] = useState("");
  const [contenuto, setContenuto] = useState(null);
  const [risultato, setRisultato] = useState(null);
  const [temaVis, setTemaVis] = useState(null);
  const [billing, setBilling] = useState(null);

  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  const [selectedReport, setSelectedReport] = useState("");

  const [sessionId] = useState(() => `tema_session_${Date.now()}`);
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_tema");
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("magic");
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateMarketing, setGateMarketing] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [postAuthToast, setPostAuthToast] = useState("");

  const countryOptions = useMemo(() => getCountryOptions(copy.lang), [copy.lang]);

  const isLoggedIn = !!getToken() && userRole !== "guest";
  const hasCredits = isLoggedIn && userCredits > 0;
  const hasTrial =
    typeof guestTrialLeft === "number"
      ? guestTrialLeft > 0
      : Number(guestTrialLeft || 0) > 0;

  const premiumLoaded = uiState === UI.PREMIUM_READY;
  const loading = uiState === UI.BASE_LOADING || uiState === UI.PREMIUM_LOADING;
  const showReportChooser = uiState === UI.CHOOSER_OPEN;
  const showLockedChapters = uiState === UI.PAYWALL_OPEN;
  const hasReading = !!interpretazione;

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

  let readingTextForDyana = interpretazione || "";

  if (contenuto) {
    if (premiumLoaded && capitoliArray.length > 0) {
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
    } else if (premiumLoaded) {
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

  const refreshUserFromToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_tema");
      return { role: "guest", sub: "guest_tema" };
    }
    const payload = decodeJwtPayload(token);
    const role = payload?.role || "free";
    const sub = payload?.sub || "guest_tema";
    setUserRole(role);
    setUserIdForDyana(sub);
    return { role, sub };
  }, []);

  const refreshCreditsUI = useCallback(async () => {
    try {
      const token = await getAnyAuthTokenAsync();
      if (!token) {
        return { role: "guest", remaining: 0, trialAvailable: guestTrialLeft };
      }

      const state = await fetchCreditsState(token);

      const role = state?.role || state?.cs_role || null;
      const remaining =
        typeof state?.remaining_credits === "number"
          ? state.remaining_credits
          : typeof state?.cs_remaining_credits === "number"
          ? state.cs_remaining_credits
          : 0;

      const rawTrialAvailable =
        state?.trial_available ?? state?.cs_trial_available ?? null;

      const trialAvailable =
        rawTrialAvailable == null ? null : Number(rawTrialAvailable);

      if (role) setUserRole(role);
      setUserCredits(typeof remaining === "number" ? remaining : 0);

      if (trialAvailable != null && !Number.isNaN(trialAvailable)) {
        setGuestTrialLeft(trialAvailable);
      }

      return {
        role: role || "guest",
        remaining: typeof remaining === "number" ? remaining : 0,
        trialAvailable,
      };
    } catch (e) {
      console.warn("[TEMA] refreshCreditsUI failed:", e?.message || e);
      return null;
    }
  }, [guestTrialLeft]);

  const broadcastTemaSync = useCallback(
    (type) => {
      const payload = {
        type,
        ts: Date.now(),
        path: pagePath,
      };

      try {
        localStorage.setItem(TEMA_SYNC_KEY, JSON.stringify(payload));
      } catch {}

      try {
        window.dispatchEvent(new CustomEvent("dyana:tema-sync", { detail: payload }));
      } catch {}

      try {
        const bc = new BroadcastChannel(TEMA_SYNC_CHANNEL);
        bc.postMessage(payload);
        bc.close();
      } catch {}
    },
    [pagePath]
  );

  const persistResume = useCallback(
    ({
      nextUiState,
      nextSelectedReport,
      nextInterpretazione,
      nextContenuto,
      nextRisultato,
      nextTemaVis,
      nextBilling,
      nextReadingId,
      nextReadingPayload,
      nextKbTags,
      restartIntent = null,
      nextDiyanaOpen = false,
    }) => {
      setResumeTarget({ path: pagePath });
      setResumeState({
        type: "tema",
        form: {
          ...form,
          ora: normalizeOraValue(form?.ora),
        },
        oraIgnota,
        interpretazione: nextInterpretazione || "",
        contenuto: nextContenuto || null,
        risultato: nextRisultato || null,
        temaVis: nextTemaVis || null,
        billing: nextBilling || null,
        readingId: nextReadingId || "",
        readingPayload: nextReadingPayload || null,
        kbTags: Array.isArray(nextKbTags) ? nextKbTags : [],
        selectedReport: nextSelectedReport || "",
        uiState: nextUiState || UI.IDLE,
        restartIntent: restartIntent || null,
        diyanaOpen: !!nextDiyanaOpen,
      });
    },
    [form, oraIgnota, pagePath]
  );

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
    setSelectedReport(resume.selectedReport || "");
setDiyanaOpen(false);
    const restoredState = resume.uiState || UI.IDLE;
    setUiState(restoredState);
setEmailGateOpen((resume.uiState || UI.IDLE) === UI.GATE_OPEN);(false);  
}, []);

  const resetReadingState = useCallback(() => {
    setErrore("");
    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);
    setBilling(null);
    setTemaVis(null);
    setReadingId("");
    setReadingPayload(null);
    setKbTags([]);
    setSelectedReport("");
    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setMagicLinkSent(false);
    setUiState(UI.IDLE);
  }, []);

  const extractTemaSnapshot = useCallback((data) => {
    const content =
      data?.result?.content ??
      data?.tema_ai?.content ??
      data?.tema_ai ??
      data?.content ??
      null;

    const resultWrapper = data?.result || null;
    const billingSnapshot = data?.billing || null;

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

    const profiloGenerale = (content?.profilo_generale || "").trim();

    const meta = data?.payload_ai?.meta ?? content?.meta ?? {};
    const readingIdFromBackend =
      meta.reading_id || meta.id || `tema_${Date.now()}`;
    const kbTagsSnapshot = meta.kb_tags || meta.kb || ["tema_natale"];

    return {
      content,
      resultWrapper,
      billingSnapshot,
      temaVisSnapshot,
      profiloGenerale,
      readingIdFromBackend,
      kbTagsSnapshot,
    };
  }, []);

  const applyTemaResponse = useCallback(
    (data) => {
      const {
        content,
        resultWrapper,
        billingSnapshot,
        temaVisSnapshot,
        profiloGenerale,
        readingIdFromBackend,
        kbTagsSnapshot,
      } = extractTemaSnapshot(data);

      setRisultato(resultWrapper);
      setBilling(billingSnapshot);
      setTemaVis(temaVisSnapshot);
      setContenuto(content);
      setReadingId(readingIdFromBackend);
      setReadingPayload(data);
      setKbTags(kbTagsSnapshot);

      if (billingSnapshot) {
        const remaining = billingSnapshot.remaining_credits;
        if (typeof remaining === "number") {
          setUserCredits(remaining);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("dyana-credits-updated", {
                detail: {
                  feature: "tema_ai",
                  remaining_credits: remaining,
                  billing_mode: billingSnapshot.mode,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent("dyana:refresh-credits", {
                detail: {
                  feature: "tema_ai",
                  remaining_credits: remaining,
                  billing_mode: billingSnapshot.mode,
                },
              })
            );
          }
        }
      }

      if (resultWrapper?.error) {
        setInterpretazione("");
        setErrore(
          `${copy.errors.aiPrefix}: ${resultWrapper.error}` +
            (resultWrapper.parse_error ? ` — ${resultWrapper.parse_error}` : "")
        );
        return {
          ok: false,
          content,
          resultWrapper,
          billingSnapshot,
          temaVisSnapshot,
          readingIdFromBackend,
          kbTagsSnapshot,
          profiloGenerale: "",
        };
      }

      setInterpretazione(profiloGenerale || copy.messages.interpretationUnavailable);

      return {
        ok: true,
        content,
        resultWrapper,
        billingSnapshot,
        temaVisSnapshot,
        readingIdFromBackend,
        kbTagsSnapshot,
        profiloGenerale:
          profiloGenerale || copy.messages.interpretationUnavailable,
      };
    },
    [copy.errors.aiPrefix, copy.messages.interpretationUnavailable, extractTemaSnapshot]
  );

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

  const openPaywall = useCallback(
    ({ reportKey, resumeOverride = null, restartIntent = "after_payment" }) => {
      const nextReport = reportKey || selectedReport || "base";

      setSelectedReport(nextReport);
      setUiState(UI.PAYWALL_OPEN);
      setEmailGateOpen(false);

      const resumeBase = resumeOverride || {
        interpretazione,
        contenuto,
        risultato,
        temaVis,
        billing,
        readingId,
        readingPayload,
        kbTags,
      };

      persistResume({
        nextUiState: UI.PAYWALL_OPEN,
        nextSelectedReport: nextReport,
        nextInterpretazione: resumeBase.interpretazione,
        nextContenuto: resumeBase.contenuto,
        nextRisultato: resumeBase.risultato,
        nextTemaVis: resumeBase.temaVis,
        nextBilling: resumeBase.billing,
        nextReadingId: resumeBase.readingId,
        nextReadingPayload: resumeBase.readingPayload,
        nextKbTags: resumeBase.kbTags,
        restartIntent,
        nextDiyanaOpen: false,
      });
    },
    [
      billing,
      contenuto,
      interpretazione,
      kbTags,
      persistResume,
      readingId,
      readingPayload,
      risultato,
      selectedReport,
      temaVis,
    ]
  );

  const generaFreeStrong = useCallback(
    async ({ chosenReport = "base" }) => {
      setErrore("");
      setDiyanaOpen(false);
      setEmailGateOpen(false);
      setUiState(UI.BASE_LOADING);

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
          setUiState(UI.IDLE);
          return;
        }

        const applied = applyTemaResponse(data);
        if (!applied.ok) {
          setUiState(UI.IDLE);
          return;
        }

        setSelectedReport(chosenReport || "base");
        setGateMode("magic");
        setGateMsg(copy.messages.previewReady);
        setMagicLinkSent(false);
        setEmailGateOpen(true);
        setUiState(UI.GATE_OPEN);

        persistResume({
          nextUiState: UI.GATE_OPEN,
          nextSelectedReport: chosenReport || "base",
          nextInterpretazione: applied.profiloGenerale,
          nextContenuto: applied.content,
          nextRisultato: applied.resultWrapper,
          nextTemaVis: applied.temaVisSnapshot,
          nextBilling: applied.billingSnapshot,
          nextReadingId: applied.readingIdFromBackend,
          nextReadingPayload: data,
          nextKbTags: applied.kbTagsSnapshot,
          restartIntent: "after_auth",
          nextDiyanaOpen: false,
        });

        await refreshCreditsUI();
        broadcastTemaSync("free_ready");
      } catch (e) {
        console.error("[TEMA][FREE] errore reale:", e);
        setErrore(copy.errors.serverUnavailable);
        setUiState(UI.IDLE);
      }
    },
    [
      applyTemaResponse,
      broadcastTemaSync,
      copy.errors.generationGeneric,
      copy.errors.serverUnavailable,
      copy.messages.previewReady,
      persistResume,
      refreshCreditsUI,
    ]
  );

  const generaPremiumFull = useCallback(
    async (
      reportType,
      {
        formOverride = null,
        oraIgnotaOverride = null,
        fromResume = false,
      } = {}
    ) => {
      setErrore("");
      setEmailGateOpen(false);
      setUiState(UI.PREMIUM_LOADING);

      try {
        const { res, data } = await callTema({
          tier: "premium",
          reportType: reportType || "base",
          formOverride,
          oraIgnotaOverride,
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
            await refreshCreditsUI();
            openPaywall({
              reportKey: reportType || selectedReport || "base",
              restartIntent: "after_payment",
            });
            return;
          }

          setErrore(typeof msg === "string" ? msg : copy.errors.generationGeneric);
          setUiState(fromResume && interpretazione ? UI.FREE_READY : UI.IDLE);
          return;
        }

        const applied = applyTemaResponse(data);
        if (!applied.ok) {
          setUiState(fromResume && interpretazione ? UI.FREE_READY : UI.IDLE);
          return;
        }

        setSelectedReport(reportType || "base");
        setDiyanaOpen(true);
        setUiState(UI.PREMIUM_READY);

        persistResume({
          nextUiState: UI.PREMIUM_READY,
          nextSelectedReport: reportType || "base",
          nextInterpretazione: applied.profiloGenerale,
          nextContenuto: applied.content,
          nextRisultato: applied.resultWrapper,
          nextTemaVis: applied.temaVisSnapshot,
          nextBilling: applied.billingSnapshot,
          nextReadingId: applied.readingIdFromBackend,
          nextReadingPayload: data,
          nextKbTags: applied.kbTagsSnapshot,
          restartIntent: null,
          nextDiyanaOpen: true,
        });

        enqueueConversionEvent("tema_completed", {
          feature: "tema",
          tier: "premium",
          report_type: reportType || "base",
          lang: copy.lang,
        });

        await refreshCreditsUI();
        broadcastTemaSync("premium_ready");
      } catch (e) {
        console.error("[TEMA][PREMIUM] errore reale:", e);
        setErrore(copy.errors.serverUnavailable);
        setUiState(fromResume && interpretazione ? UI.FREE_READY : UI.IDLE);
      }
    },
    [
      applyTemaResponse,
      broadcastTemaSync,
      copy.errors.generationGeneric,
      copy.errors.serverUnavailable,
      copy.lang,
      interpretazione,
      openPaywall,
      persistResume,
      refreshCreditsUI,
      selectedReport,
    ]
  );

  const runPostAuthFlow = useCallback(
    async ({ showToast = true } = {}) => {
      refreshUserFromToken();
      const credits = await refreshCreditsUI();

      setEmailGateOpen(false);
      setGateErr("");
      setGateMsg("");
      setMagicLinkSent(false);
      setDiyanaOpen(false);

      const resume = getResumeState();
      if (!resume || resume.type !== "tema") return;

      const effectiveCredits =
        typeof credits?.remaining === "number" ? credits.remaining : userCredits;
      const reportToOpen = resume.selectedReport || "base";

    restoreFromResume({
      ...resume,
      uiState: effectiveCredits > 0 ? UI.PREMIUM_LOADING : UI.PAYWALL_OPEN,
      diyanaOpen: false,
    });

    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setMagicLinkSent(false);
    setDiyanaOpen(false);
    setUiState(effectiveCredits > 0 ? UI.PREMIUM_LOADING : UI.PAYWALL_OPEN);

      if (resume.restartIntent === "after_auth") {
        if (effectiveCredits > 0) {
                 setEmailGateOpen(false);
        setGateErr("");
        setGateMsg("");
        setMagicLinkSent(false);
        setDiyanaOpen(false);
        setUiState(UI.PREMIUM_LOADING);

        persistResume({
          nextUiState: UI.PREMIUM_LOADING,
          nextSelectedReport: reportToOpen,
          nextInterpretazione: resume.interpretazione || "",
          nextContenuto: resume.contenuto || null,
          nextRisultato: resume.risultato || null,
          nextTemaVis: resume.temaVis || null,
          nextBilling: resume.billing || null,
          nextReadingId: resume.readingId || "",
          nextReadingPayload: resume.readingPayload || null,
          nextKbTags: Array.isArray(resume.kbTags) ? resume.kbTags : [],
          restartIntent: "after_auth",
          nextDiyanaOpen: false,
        });

        await generaPremiumFull(reportToOpen, {
          formOverride: {
            ...(resume.form || form),
            ora: normalizeOraValue((resume.form || form)?.ora),
          },
          oraIgnotaOverride:
            typeof resume.oraIgnota === "boolean" ? resume.oraIgnota : oraIgnota,
          fromResume: true,
        });
        return;
        }

        setUiState(UI.PAYWALL_OPEN);
        openPaywall({
          reportKey: reportToOpen,
          resumeOverride: {
            interpretazione: resume.interpretazione || "",
            contenuto: resume.contenuto || null,
            risultato: resume.risultato || null,
            temaVis: resume.temaVis || null,
            billing: resume.billing || null,
            readingId: resume.readingId || "",
            readingPayload: resume.readingPayload || null,
            kbTags: Array.isArray(resume.kbTags) ? resume.kbTags : [],
          },
          restartIntent: "after_payment",
        });
        return;
      }

      if (showToast) {
        setJustLoggedIn(true);
        setPostAuthToast(copy.messages.postLoginToast);
        setTimeout(() => setJustLoggedIn(false), 6000);
      }
    },
    [
      copy.messages.postLoginToast,
      form,
      generaPremiumFull,
      openPaywall,
      oraIgnota,
      refreshCreditsUI,
      refreshUserFromToken,
      restoreFromResume,
      userCredits,
    ]
  );

  const runPostPaymentFlow = useCallback(async () => {
      const resume = getResumeState();
    if (!resume || resume.type !== "tema") return;

    const credits = await refreshCreditsUI();
    const effectiveCredits =
      typeof credits?.remaining === "number" ? credits.remaining : userCredits;

    restoreFromResume({
      ...resume,
      uiState: effectiveCredits > 0 ? UI.PREMIUM_LOADING : UI.PAYWALL_OPEN,
      diyanaOpen: false,
    });

    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setMagicLinkSent(false);
    setDiyanaOpen(false);
    setUiState(effectiveCredits > 0 ? UI.PREMIUM_LOADING : UI.PAYWALL_OPEN);
    if (resume.restartIntent !== "after_payment") return;

    if (effectiveCredits <= 0) {
      setUiState(UI.PAYWALL_OPEN);
      openPaywall({
        reportKey: resume.selectedReport || "base",
        resumeOverride: {
          interpretazione: resume.interpretazione || "",
          contenuto: resume.contenuto || null,
          risultato: resume.risultato || null,
          temaVis: resume.temaVis || null,
          billing: resume.billing || null,
          readingId: resume.readingId || "",
          readingPayload: resume.readingPayload || null,
          kbTags: Array.isArray(resume.kbTags) ? resume.kbTags : [],
        },
        restartIntent: "after_payment",
      });
      return;
    }
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setMagicLinkSent(false);
    setDiyanaOpen(false);
    setUiState(UI.PREMIUM_LOADING);

    persistResume({
      nextUiState: UI.PREMIUM_LOADING,
      nextSelectedReport: resume.selectedReport || "base",
      nextInterpretazione: resume.interpretazione || "",
      nextContenuto: resume.contenuto || null,
      nextRisultato: resume.risultato || null,
      nextTemaVis: resume.temaVis || null,
      nextBilling: resume.billing || null,
      nextReadingId: resume.readingId || "",
      nextReadingPayload: resume.readingPayload || null,
      nextKbTags: Array.isArray(resume.kbTags) ? resume.kbTags : [],
      restartIntent: "after_payment",
      nextDiyanaOpen: false,
    });

    await generaPremiumFull(resume.selectedReport || "base", {
      formOverride: {
        ...(resume.form || form),
        ora: normalizeOraValue((resume.form || form)?.ora),
      },
      oraIgnotaOverride:
        typeof resume.oraIgnota === "boolean" ? resume.oraIgnota : oraIgnota,
      fromResume: true,
    });
    await generaPremiumFull(resume.selectedReport || "base", {
      formOverride: {
        ...(resume.form || form),
        ora: normalizeOraValue((resume.form || form)?.ora),
      },
      oraIgnotaOverride:
        typeof resume.oraIgnota === "boolean" ? resume.oraIgnota : oraIgnota,
      fromResume: true,
    });
  }, [
    form,
    generaPremiumFull,
    openPaywall,
    oraIgnota,
    refreshCreditsUI,
    restoreFromResume,
    userCredits,
  ]);

  useEffect(() => {
    refreshUserFromToken();

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }, [refreshCreditsUI, refreshUserFromToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromResume = () => {
      const resume = getResumeState();
      if (!resume || resume.type !== "tema") return;
      restoreFromResume(resume);
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
    if (typeof window === "undefined") return;

    const onAuthDone = async () => {
      try {
        localStorage.removeItem(AUTH_DONE_KEY);
      } catch {}

      await runPostAuthFlow({ showToast: true });
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
  }, [runPostAuthFlow]);

  useEffect(() => {
    let cancelled = false;

    async function resumeAfterTemaSinglePayment() {
      let marker = null;
      try {
        marker = JSON.parse(localStorage.getItem("dyana_tema_post_payment") || "null");
      } catch {
        marker = null;
      }

      if (!marker || marker.source !== "tema_single") return;
      if (cancelled) return;

      try {
        localStorage.removeItem("dyana_tema_post_payment");
      } catch {}

      await runPostPaymentFlow();
    }

    resumeAfterTemaSinglePayment();

    return () => {
      cancelled = true;
    };
  }, [runPostPaymentFlow]);
function handleLogout() {
  clearToken();

  setUserRole("guest");
  setUserCredits(0);
  setUserIdForDyana("guest_tema");
  setGuestTrialLeft(null);

  setErrore("");
  setInterpretazione("");
  setContenuto(null);
  setRisultato(null);
  setBilling(null);
  setTemaVis(null);
  setReadingId("");
  setReadingPayload(null);
  setKbTags([]);
  setSelectedReport("");
  setDiyanaOpen(false);
  setEmailGateOpen(false);
  setGateErr("");
  setGateMsg("");
  setMagicLinkSent(false);
  setUiState(UI.IDLE);

  try {
    const resume = getResumeState();
    if (resume?.type === "tema") {
      setResumeTarget({ path: pagePath });
      setResumeState({
        ...resume,
        uiState: UI.IDLE,
        interpretazione: "",
        contenuto: null,
        risultato: null,
        temaVis: null,
        billing: null,
        readingId: "",
        readingPayload: null,
        kbTags: [],
        selectedReport: "",
        restartIntent: null,
        diyanaOpen: false,
      });
    }
  } catch {}

  broadcastTemaSync("reset");

  (async () => {
    await ensureGuestToken();
    await refreshCreditsUI();
  })();
}
  async function handleStartReading() {
    setErrore("");
    setGateErr("");
    setGateMsg("");
    setMagicLinkSent(false);
    setEmailGateOpen(false);
    setDiyanaOpen(false);
	setUiState(UI.BASE_LOADING);
    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);
    setTemaVis(null);
    setBilling(null);
    setReadingId("");
    setReadingPayload(null);
    setKbTags([]);
    setSelectedReport("");

    try {
      const resume = getResumeState();
      if (resume?.type === "tema") {
        setResumeTarget({ path: pagePath });
        setResumeState({
          ...resume,
          uiState: UI.IDLE,
          interpretazione: "",
          contenuto: null,
          risultato: null,
          temaVis: null,
          billing: null,
          readingId: "",
          readingPayload: null,
          kbTags: [],
          selectedReport: "",
          restartIntent: null,
          diyanaOpen: false,
        });
      }
    } catch {}

    broadcastTemaSync("reset");
    const token = getToken();
    const payload = decodeJwtPayload(token);
    const logged = !!token && (payload?.role || "guest") !== "guest";

    if (!logged && hasTrial) {
      await generaFreeStrong({ chosenReport: "base" });
      return;
    }

    setSelectedReport("");
    setUiState(UI.CHOOSER_OPEN);

    persistResume({
      nextUiState: UI.CHOOSER_OPEN,
      nextSelectedReport: "",
      nextInterpretazione: interpretazione,
      nextContenuto: contenuto,
      nextRisultato: risultato,
      nextTemaVis: temaVis,
      nextBilling: billing,
      nextReadingId: readingId,
      nextReadingPayload: readingPayload,
      nextKbTags: kbTags,
      restartIntent: null,
      nextDiyanaOpen: false,
    });
  }

  async function handleChooserContinue() {
    const reportKey = selectedReport || "base";

    if (!isLoggedIn) {
      await generaFreeStrong({ chosenReport: reportKey });
      return;
    }

    if (hasCredits) {
      await generaPremiumFull(reportKey);
      return;
    }

    openPaywall({ reportKey, restartIntent: "after_payment" });
  }

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

      persistResume({
        nextUiState: UI.PAYWALL_OPEN,
        nextSelectedReport: selectedReport || "base",
        nextInterpretazione: interpretazione,
        nextContenuto: contenuto,
        nextRisultato: risultato,
        nextTemaVis: temaVis,
        nextBilling: billing,
        nextReadingId: readingId,
        nextReadingPayload: readingPayload,
        nextKbTags: kbTags,
        restartIntent: "after_payment",
        nextDiyanaOpen: false,
      });

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
    setUiState(UI.GATE_OPEN);

    persistResume({
      nextUiState: UI.GATE_OPEN,
      nextSelectedReport: selectedReport || "base",
      nextInterpretazione: interpretazione,
      nextContenuto: contenuto,
      nextRisultato: risultato,
      nextTemaVis: temaVis,
      nextBilling: billing,
      nextReadingId: readingId,
      nextReadingPayload: readingPayload,
      nextKbTags: kbTags,
      restartIntent: "after_auth",
      nextDiyanaOpen: false,
    });
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
        persistResume({
          nextUiState: UI.GATE_OPEN,
          nextSelectedReport: selectedReport || "base",
          nextInterpretazione: interpretazione,
          nextContenuto: contenuto,
          nextRisultato: risultato,
          nextTemaVis: temaVis,
          nextBilling: billing,
          nextReadingId: readingId,
          nextReadingPayload: readingPayload,
          nextKbTags: kbTags,
          restartIntent: "after_auth",
          nextDiyanaOpen: false,
        });

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
        await runPostAuthFlow({ showToast: false });
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

        await runPostAuthFlow({ showToast: false });
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
    setSelectedReport(reportKey || "");
    setDiyanaOpen(false);
    setUiState(UI.CHOOSER_OPEN);

    persistResume({
      nextUiState: UI.CHOOSER_OPEN,
      nextSelectedReport: reportKey || "",
      nextInterpretazione: interpretazione,
      nextContenuto: contenuto,
      nextRisultato: risultato,
      nextTemaVis: temaVis,
      nextBilling: billing,
      nextReadingId: readingId,
      nextReadingPayload: readingPayload,
      nextKbTags: kbTags,
      restartIntent: null,
      nextDiyanaOpen: false,
    });
  }

  function handleStartNewFromSaved() {
    resetReadingState();

    try {
      const resume = getResumeState();
      if (resume?.type === "tema") {
        setResumeTarget({ path: pagePath });
        setResumeState({
          ...resume,
          uiState: UI.IDLE,
          interpretazione: "",
          contenuto: null,
          risultato: null,
          temaVis: null,
          billing: null,
          readingId: "",
          readingPayload: null,
          kbTags: [],
          selectedReport: "",
          restartIntent: null,
          diyanaOpen: false,
        });
      }
    } catch {}

    broadcastTemaSync("reset");
  }

 const resumeSnapshot =
    typeof window !== "undefined" ? getResumeState() : null;

  const isRestartingAfterAuthOrPayment =
    resumeSnapshot?.type === "tema" &&
    (resumeSnapshot?.restartIntent === "after_auth" ||
      resumeSnapshot?.restartIntent === "after_payment");
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

        {uiState === UI.PREMIUM_LOADING && (
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
  {copy.messages.premiumResumeLoadingTopText}
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
                disabled={loading || gateLoading}
                style={{ marginTop: "14px" }}
              >
                {loading ? copy.cta.generating : copy.cta.startReading}
              </button>

              {errore && (
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {errore}
                </p>
              )}
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

              {!premiumLoaded && capitoliArray.length > 0 && (
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

              {!premiumLoaded && !isLoggedIn && emailGateOpen && uiState === UI.GATE_OPEN && (
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

              {!premiumLoaded && isLoggedIn && !hasCredits && uiState === UI.PAYWALL_OPEN && (
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
        {uiState === UI.PREMIUM_LOADING && (
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
  {copy.messages.premiumResumeLoadingBottomText}
</h4>
<p className="card-text" style={{ opacity: 0.92 }}>
  {copy.messages.premiumResumeLoadingBottomText}
</p>
            </div>
          </section>
        )}
        {showReportChooser && uiState === UI.CHOOSER_OPEN && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{copy.reports.title}</h3>

              <p className="card-text" style={{ opacity: 0.9, marginBottom: 16 }}>
                {hasCredits
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
                  disabled={loading}
                  onClick={handleChooserContinue}
                >
                  {loading
                    ? copy.cta.preparingPremium || copy.cta.generating
                    : copy.cta.continue}
                </button>
              )}
            </div>
          </section>
        )}

        {showLockedChapters && !premiumLoaded && uiState === UI.PAYWALL_OPEN && (
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
                    Unlock complete report at only 2.99€
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
              </div>
            </div>
          </section>
        )}

        {emailGateOpen && !premiumLoaded && uiState === UI.GATE_OPEN && (
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
                  onClick={() => {
                    setEmailGateOpen(false);
                    setUiState(UI.FREE_READY);
                    persistResume({
                      nextUiState: UI.FREE_READY,
                      nextSelectedReport: selectedReport || "base",
                      nextInterpretazione: interpretazione,
                      nextContenuto: contenuto,
                      nextRisultato: risultato,
                      nextTemaVis: temaVis,
                      nextBilling: billing,
                      nextReadingId: readingId,
                      nextReadingPayload: readingPayload,
                      nextKbTags: kbTags,
                      restartIntent: "after_auth",
                      nextDiyanaOpen: false,
                    });
                  }}
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
"use client";

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
  sendAuthMagicLink,
  updateMarketingConsent,
} from "../../lib/authClient";

// ==========================
// COSTANTI
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

// Costi (coerenti con backend)
const PERIOD_COSTS = {
  giornaliero: 1,
  settimanale: 2,
  mensile: 3,
  annuale: 5,
};
const ENABLE_EMAIL_GATE = false;
const ENABLE_EMAIL_GATE_WHEN_TRIAL_OVER = true;
const OROSCOPO_DRAFT_KEY = "dyana_oroscopo_draft_v1";
const OROSCOPO_FREE_SNAPSHOT_KEY = "dyana_oroscopo_free_snapshot_v1";
const AUTH_DONE_KEY = "dyana_auth_done";
const POST_LOGIN_ACTION_KEY = "dyana_post_login_action";
const SHOW_TABLES_IN_FREE = false;
const ADS_ID = "AW-17796576310";
const ADS_CONV_LABEL = "INCOLLA_QUI_LA_TUA_LABEL"; // quella di Google Ads > Conversioni
// ==========================
// HELPERS
// ==========================
function mapPeriodoToSlug(periodo) {
  const p = (periodo || "").toLowerCase();
  if (p === "giornaliero") return "giornaliero";
  if (p === "settimanale") return "settimanale";
  if (p === "mensile") return "mensile";
  if (p === "annuale") return "annuale";
  return "giornaliero";
}

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

function loadOroscopoDraft() {
  try {
    const raw = localStorage.getItem(OROSCOPO_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOroscopoDraft(draft) {
  try {
    localStorage.setItem(OROSCOPO_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function clearOroscopoDraft() {
  try {
    localStorage.removeItem(OROSCOPO_DRAFT_KEY);
  } catch {}
}
function loadFreeSnapshot() {
  try {
    const raw = localStorage.getItem(OROSCOPO_FREE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFreeSnapshot(snapshot) {
  try {
    localStorage.setItem(OROSCOPO_FREE_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {}
}

function clearFreeSnapshot() {
  try {
    localStorage.removeItem(OROSCOPO_FREE_SNAPSHOT_KEY);
  } catch {}
}
function fireAdsConversion(sendTo) {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") {
      console.warn("[ADS] gtag non disponibile");
      return;
    }
    window.gtag("event", "conversion", { send_to: sendTo });
    console.log("[ADS] conversion fired:", sendTo);
  } catch (e) {
    console.warn("[ADS] conversion fire failed:", e?.message || e);
  }
}

// ==========================
// TESTO INTERPRETAZIONE
// ==========================
function buildInterpretazioneTesto(oroscopoAi, tierRaw) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  const tier = (tierRaw || "free").toLowerCase();
  const isPremium = tier === "premium";
  const pieces = [];

  const intro = (
    oroscopoAi.intro ||
    oroscopoAi.sintesi_periodo ||
    oroscopoAi.sintesi ||
    ""
  ).trim();
  if (intro) pieces.push(intro);

  const macro =
    Array.isArray(oroscopoAi.macro_periods) && oroscopoAi.macro_periods.length > 0
      ? oroscopoAi.macro_periods
      : Array.isArray(oroscopoAi.sottoperiodi) && oroscopoAi.sottoperiodi.length > 0
      ? oroscopoAi.sottoperiodi
      : [];

  if (macro.length) {
    if (isPremium) {
      macro.forEach((mp, idx) => {
        if (!mp || typeof mp !== "object") return;
        const label = mp.label || mp.titolo || mp.title || `Sottoperiodo ${idx + 1}`;
        const range = mp.date_range || mp.range || {};
        const start = range.start || range.inizio || range.from || null;
        const end = range.end || range.fine || range.to || null;
        const rangeText = start && end ? `${start} – ${end}` : "";
        const text = (mp.text || mp.descrizione || mp.content || "").trim();
        const header = rangeText ? `${label} (${rangeText})` : label;
        if (text) pieces.push(`${header}\n${text}`);
      });
    } else {
      const labels = macro
        .map((mp) => mp && (mp.label || mp.titolo || mp.title))
        .filter(Boolean);
      if (labels.length) {
        pieces.push("Sottoperiodi principali:\n" + labels.map((l) => `• ${l}`).join("\n"));
      }
    }
  }

  const sections = oroscopoAi.sections || {};
  const SECTION_LABELS = {
    panorama: "Panoramica generale",
    emozioni: "Emozioni",
    relazioni: "Relazioni",
    energia: "Energia",
    lavoro: "Lavoro",
    focus: "Focus",
    consigli: "Consigli",
  };

  const orderedKeys = Object.keys(SECTION_LABELS);

  if (sections && typeof sections === "object") {
    const secPieces = [];
    orderedKeys.forEach((key) => {
      const rawVal = sections[key];
      if (!rawVal || typeof rawVal !== "string") return;
      const val = rawVal.trim();
      if (!val) return;
      const label = SECTION_LABELS[key] || key;
      secPieces.push(isPremium ? `${label}\n${val}` : `${label}: ${val}`);
    });
    if (secPieces.length) pieces.push(secPieces.join("\n\n"));
  }

  if (isPremium) {
    const summary = (oroscopoAi.summary || "").trim();
    if (summary) pieces.push(summary);
  } else {
    const cta = (oroscopoAi.cta || "").trim();
    const premiumMsg = (oroscopoAi.premium_message || "").trim();
    if (cta) pieces.push(cta);
    if (premiumMsg) pieces.push(premiumMsg);
  }

  if (!pieces.length) return "Interpretazione non disponibile.";
  return pieces.join("\n\n");
}

// ==========================
// UI: Banner (sandwich)
// ==========================
function InlineBanner({ variant = "info", title, text, actionLabel, onAction, onClose }) {
  const palette =
    variant === "success"
      ? { border: "rgba(130,255,160,0.22)", bg: "rgba(40,80,52,0.18)", color: "#d6ffe3" }
      : variant === "warn"
      ? { border: "rgba(255,223,154,0.22)", bg: "rgba(90,70,20,0.16)", color: "#ffdf9a" }
      : { border: "rgba(255,255,255,0.14)", bg: "rgba(0,0,0,0.22)", color: "rgba(245,245,255,0.92)" };

  return (
    <div
      className="card"
      style={{
        maxWidth: "850px",
        margin: "0 auto 16px",
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          {title && (
            <div className="card-text" style={{ fontWeight: 700, marginBottom: 4, color: palette.color }}>
              {title}
            </div>
          )}
          {text && (
            <div className="card-text" style={{ fontSize: "0.92rem", opacity: 0.92, whiteSpace: "pre-wrap" }}>
              {text}
            </div>
          )}
          {actionLabel && onAction && (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-primary" onClick={onAction}>
                {actionLabel}
              </button>
            </div>
          )}
        </div>

        {onClose && (
          <button type="button" className="btn" onClick={onClose} style={{ whiteSpace: "nowrap" }}>
            Chiudi
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================
// COMPONENTI SUPPORTO
// ==========================
function MetricheGrafico({ metriche }) {
  if (
    !metriche ||
    typeof metriche !== "object" ||
    !Array.isArray(metriche.samples) ||
    metriche.samples.length === 0
  ) {
    return null;
  }

  const first = metriche.samples[0] || {};
  const firstMetrics = first.metrics || {};
  const ambiti =
    (firstMetrics.intensities && Object.keys(firstMetrics.intensities)) ||
    (firstMetrics.raw_scores && Object.keys(firstMetrics.raw_scores)) ||
    [];

  if (!ambiti.length) return null;

  const LABELS = {
    emozioni: "Emozioni",
    relazioni: "Relazioni",
    energia: "Energia",
  };

  const normalize = (val) => {
    if (typeof val !== "number" || !isFinite(val)) return 0;
    const clamped = Math.max(-1, Math.min(1, val));
    return Math.round(((clamped + 1) / 2) * 100);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h4 className="card-subtitle">Andamento del periodo</h4>
      <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}>
        Ogni riga rappresenta un sottoperiodo; i rettangoli mostrano l&apos;intensità media.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                Sottoperiodo
              </th>
              {ambiti.map((a) => (
                <th
                  key={a}
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {LABELS[a] || a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metriche.samples.map((s, idx) => {
              const label = s.label || `Fase ${idx + 1}`;
              const metrics = s.metrics || {};
              const intensities = metrics.intensities || metrics.raw_scores || {};
              return (
                <tr key={idx}>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </td>
                  {ambiti.map((a) => {
                    const perc = normalize(intensities[a]);
                    return (
                      <td key={a} style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div
                          style={{
                            position: "relative",
                            height: 12,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              bottom: 0,
                              width: `${perc}%`,
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.75)",
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AspettiTable({ aspetti }) {
  if (!Array.isArray(aspetti) || aspetti.length === 0) return null;

  const ASP_LABEL = {
    congiunzione: "congiunzione",
    opposizione: "opposizione",
    quadratura: "quadratura",
    trigono: "trigono",
    sestile: "sestile",
  };

  function parseFromKey(chiave) {
    if (!chiave || typeof chiave !== "string") return { tr: "?", asp: "?", nat: "?" };
    const parts = chiave.split("_").filter(Boolean);
    if (parts.length >= 3) {
      const tr = parts[0];
      const asp = parts[1];
      const nat = parts.slice(2).join("_");
      return { tr, asp, nat };
    }
    return { tr: "?", asp: "?", nat: "?" };
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h4 className="card-subtitle">Aspetti chiave del periodo</h4>
      <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}>
        Una selezione compatta degli aspetti più rilevanti che colorano questo periodo.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                Aspetto
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                Intensità
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                Durata
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                Prima attivazione
              </th>
            </tr>
          </thead>
          <tbody>
            {aspetti.map((a, idx) => {
              const chiave = a?.chiave || a?.key || a?.id || "";
              const parsed = parseFromKey(chiave);

              const tr = a?.pianeta_transito || a?.transit_planet || a?.transito || parsed.tr || "?";
              const nat = a?.pianeta_natale || a?.natal_planet || a?.natale || parsed.nat || "?";

              const aspRaw = a?.aspetto || a?.tipo || a?.aspect || parsed.asp || "?";
              const asp = ASP_LABEL[aspRaw] || aspRaw;

              const intensita = a?.intensita_discreta || a?.intensita || a?.intensity || "-";

              const pers = a?.persistenza || {};
              const durataGiorni = pers.durata_giorni ?? pers.durata ?? pers.days ?? null;
              const first = a?.prima_occorrenza || pers.data_inizio || pers.start || "-";

              return (
                <tr key={idx}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {tr} {asp} {nat}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {intensita}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {durataGiorni != null ? `${durataGiorni} giorno${durataGiorni === 1 ? "" : "i"}` : "-"}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {first}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================
// PAGINA
// ==========================

function buildFreeTeaser(oroscopoAi) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  // prova a prendere un intro o sintesi breve
  const intro = (
    oroscopoAi.intro ||
    oroscopoAi.sintesi_periodo ||
    oroscopoAi.sintesi ||
    ""
  ).trim();

  // fallback: pesca una sezione (emozioni/relazioni/lavoro) ma corta
  const sections = oroscopoAi.sections && typeof oroscopoAi.sections === "object" ? oroscopoAi.sections : {};
  const pick =
    (sections.emozioni || sections.relazioni || sections.panorama || sections.lavoro || "").trim();

  const base = intro || pick || "";

  // teaser: max ~450-600 caratteri, senza chiudere "il cerchio"
  const cut = base.length > 520 ? base.slice(0, 520).replace(/\s+\S*$/, "") + "…" : base;

  // se è vuoto, fallback
  return cut || "In questo periodo emerge un tema centrale che influenza il tuo modo di reagire e prendere decisioni. La parte più importante è capire perché si attiva proprio ora.";
}


export default function OroscopoPage() {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
    periodo: "giornaliero",
  });

  const [oraIgnota, setOraIgnota] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [noCredits, setNoCredits] = useState(false);

  // Risultati separati
  const [freeResult, setFreeResult] = useState(null);
  const [premiumResult, setPremiumResult] = useState(null);

  // Navbar state
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_oroscopo");

  // trial guest 1/0 (o null)
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  // Email gate inline
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("magic"); // magic | register | login
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateMarketing, setGateMarketing] = useState(true);
  const [showPeriodo, setShowPeriodo] = useState(false);

  // DYANA
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  // Banner post-login (sandwich)
  const [authBanner, setAuthBanner] = useState(null);

  const [sessionId] = useState(() => `oroscopo_session_${Date.now()}`);
  const isLoggedIn = !!getToken();

  const refreshUserFromToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_oroscopo");
      return;
    }
    const payload = decodeJwtPayload(token);
    setUserRole(payload?.role || "free");
    setUserIdForDyana(payload?.sub || "guest_oroscopo");
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
      console.warn("[OROSCOPO] refreshCreditsUI failed:", e?.message || e);
    }
  }, []);

 // 1) restore draft + init tokens/credits
useEffect(() => {
  try {
    // ---- restore FORM draft ----
    const draft = loadOroscopoDraft();
    if (draft && typeof draft === "object") {
      if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
      if (typeof draft.oraIgnota === "boolean") setOraIgnota(draft.oraIgnota);
    }

    // ---- restore FREE snapshot (PEZZO B) ----
    const snap = loadFreeSnapshot();
    if (snap?.freeResult) {
      if (snap.form) setForm((prev) => ({ ...prev, ...snap.form }));
      if (typeof snap.oraIgnota === "boolean") setOraIgnota(snap.oraIgnota);
      setFreeResult(snap.freeResult);
    }
  } catch {}

  refreshUserFromToken();
  (async () => {
    await ensureGuestToken();
    await refreshCreditsUI();
  })();
}, [refreshUserFromToken, refreshCreditsUI]);


  // 2) autosave draft
  useEffect(() => {
    saveOroscopoDraft({ form, oraIgnota, ts: Date.now() });
  }, [form, oraIgnota]);

  // 3) AUTH_DONE listeners + banner + eventuale azione post-login
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function onAuthDone() {
      try {
        // pulizia chiave (se presente)
        try { localStorage.removeItem(AUTH_DONE_KEY); } catch {}

        refreshUserFromToken();
        await refreshCreditsUI();

        // chiudi gate ed errori
        setEmailGateOpen(false);
        setGateErr("");
        setGateMsg("");

        // banner per “cliente di ritorno”
        setAuthBanner({
          variant: "success",
          title: "Accesso completato",
          text:
            "Perfetto. Ora puoi continuare da qui.\nQuando sei pronto, genera la lettura premium con un click.",
          actionLabel: "Continua e genera Premium",
          action: "RUN_PREMIUM",
        });

        // se avevamo una azione in sospeso (es. magic link)
        let pending = null;
        try { pending = localStorage.getItem(POST_LOGIN_ACTION_KEY); } catch {}

        if (pending === "oroscopo_premium") {
          try { localStorage.removeItem(POST_LOGIN_ACTION_KEY); } catch {}
          await generaPremium();
        }
      } catch (e) {
        console.warn("[OROSCOPO][AUTH_DONE] errore:", e?.message || e);
      }
    }

    function onStorage(e) {
      if (e?.key === AUTH_DONE_KEY) onAuthDone();
    }

    function onLocalAuthEvent(e) {
      if (e?.detail?.type === "AUTH_DONE") onAuthDone();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("dyana:auth", onLocalAuthEvent);

    let bc = null;
    try {
      bc = new BroadcastChannel("dyana_auth");
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "AUTH_DONE") onAuthDone();
      };
    } catch {}

    // bootstrap: se la callback ha già scritto AUTH_DONE_KEY e noi siamo già qui
    try {
      const pending = localStorage.getItem(AUTH_DONE_KEY);
      if (pending) onAuthDone();
    } catch {}

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("dyana:auth", onLocalAuthEvent);
      try { bc && bc.close(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUserFromToken, refreshCreditsUI]);

  function handleLogout() {
    clearToken();
    setUserRole("guest");
    setUserCredits(0);
    setUserIdForDyana("guest_oroscopo");
    setGuestTrialLeft(null);

    setPremiumResult(null);
    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setAuthBanner(null);

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleOraIgnotaChange(e) {
    const checked = e.target.checked;
    setOraIgnota(checked);
    setForm((prev) => ({ ...prev, ora: checked ? "" : prev.ora }));
  }

  async function callOroscopo({ tier }) {
    const slug = mapPeriodoToSlug(form.periodo);

    const payload = {
      nome: form.nome || null,
      citta: form.citta,
      data: form.data,
      ora: oraIgnota ? null : form.ora,
      email: null,
      domanda: null,
      tier, // free | premium
    };

    let token = await getAnyAuthTokenAsync();
    if (!token && ASTROBOT_JWT_TEMA) token = ASTROBOT_JWT_TEMA;

    const headers = {
      "Content-Type": "application/json",
      "X-Client-Source": "dyana_web/oroscopo",
      "X-Client-Session": sessionId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/oroscopo_ai/${slug}`, {
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

    return { res, data, slug };
  }

  async function generaFree() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);

    setAuthBanner(null);
    setEmailGateOpen(false);
    setGateErr("");
    setDiyanaOpen(false);
    setPremiumResult(null);

    try {
      const { res, data } = await callOroscopo({ tier: "free" });

      if (!res.ok) {
        const msg =
          (data && (data.error || data.detail || data.message)) ||
          `Errore nella generazione (status ${res.status}).`;
        setErrore(typeof msg === "string" ? msg : "Errore nella generazione.");
        return;
      }

      setFreeResult(data);
	  try {
  saveFreeSnapshot({
    ts: Date.now(),
    form,
    oraIgnota,
    freeResult: data,
  });
} catch {}

      await refreshCreditsUI();
    } catch (e) {
      setErrore("Impossibile comunicare con il server. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  async function generaPremium() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    setGateErr("");

    // banner: durante la generazione
    setAuthBanner({
      variant: "info",
      title: "Sto generando la lettura premium…",
      text: "Attendi qualche istante. Se il periodo è lungo, può volerci un po’ di più.",
      actionLabel: null,
      action: null,
    });

    try {
      const { res, data } = await callOroscopo({ tier: "premium" });

      if (!res.ok) {
        const errorCode = data?.error_code || data?.code || data?.error || data?.detail;
        const isCreditsError =
          res.status === 402 ||
          res.status === 403 ||
          (typeof errorCode === "string" && errorCode.toLowerCase().includes("credit"));

        const msg =
          (data && (data.error || data.detail || data.message)) ||
          `Errore nella generazione (status ${res.status}).`;

        if (isCreditsError) {
          setNoCredits(true);
          setErrore(typeof msg === "string" ? msg : "Crediti insufficienti.");
          setAuthBanner(null);
          await refreshCreditsUI();
		  if (!isLoggedIn && ENABLE_EMAIL_GATE_WHEN_TRIAL_OVER) {
			// se siamo guest e i crediti non bastano, proponi subito il gate
			if (guestTrialLeft === 0) {
			openEmailGate();
  }
}
          return;
        }

        setErrore(typeof msg === "string" ? msg : "Errore nella generazione.");
        setAuthBanner(null);
        return;
      }
setPremiumResult(data);

// ✅ TRACKING: oroscopo premium completato (GA4 + Ads via tracker centralizzato)
enqueueConversionEvent("oroscopo_completed", {
  feature: "oroscopo",
  tier: "premium",
});




      try { clearOroscopoDraft(); } catch {}

      setEmailGateOpen(false);
      setDiyanaOpen(false);

      // banner success
      setAuthBanner({
        variant: "success",
        title: "Lettura premium pronta",
        text: "Scorri per leggere l’interpretazione completa e, se vuoi, chiedi a DYANA.",
        actionLabel: null,
        action: null,
      });

      await refreshCreditsUI();
    } catch (e) {
      setAuthBanner(null);
      setErrore("Impossibile comunicare con il server. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  function openEmailGate() {
    setGateErr("");
    setGateLoading(false);
    setGateMode("magic");
    setEmailGateOpen(true);

    const trial = guestTrialLeft;
    if (trial === 0) {
      setGateMsg("Puoi continuare ad utilizzare Dyana, inserendo la tua email.");
    } else {
      setGateMsg("Inserisci la tua email per continuare. Riceverai un messaggio con un link che ti permetterà di accedere.");
    }
  }
async function handleApprofondisciClick() {
  setErrore("");
  setNoCredits(false);

  if (premiumResult) return;

  if (isLoggedIn) {
    await generaPremium();
    return;
  }

  // IMPORTANT: rileggo lo stato crediti/Trial prima di decidere
  await refreshCreditsUI();

  // Dopo refresh, se trial finito => apro gate
  if (guestTrialLeft === 0) {
    openEmailGate();
    return;
  }

  // Altrimenti provo premium diretto (trial disponibile)
  await generaPremium();
}


  async function submitInlineAuth(e) {
    e.preventDefault();

    setGateErr("");
    setGateLoading(true);

    try {
      const email = (gateEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        setGateErr("Inserisci un’email valida.");
        return;
      }

      try { localStorage.setItem("dyana_pending_email", email); } catch {}

      setResumeTarget({ path: "/oroscopo", readingId: "oroscopo_inline" });

      const redirectUrl =
        (typeof window !== "undefined" && window.location?.origin)
          ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
          : "https://dyana.app/auth/callback";

      // --------------------------------------------------
      // TRIAL ESAURITO → MAGIC LINK / LOGIN / REGISTER
      // --------------------------------------------------
      if (guestTrialLeft === 0) {
        if (gateMode === "magic") {
          setGateMsg("Ti ho inviato un link di accesso via email. Aprilo per entrare (controlla anche spam).");
          try { localStorage.setItem(POST_LOGIN_ACTION_KEY, "oroscopo_premium"); } catch {}
          await sendAuthMagicLink(email, redirectUrl);

          // banner “azione pendente”
          setAuthBanner({
            variant: "info",
            title: "Controlla la tua email",
            text: "Apri il link per entrare. Al ritorno su questa pagina potrai continuare subito.",
            actionLabel: null,
            action: null,
          });

          return;
        }

        // LOGIN / REGISTER con password
        if (gateMode === "login") {
          if (!gatePass) {
            setGateErr("Inserisci la password per accedere.");
            return;
          }
          await loginWithCredentials(email, gatePass);
        } else {
          if (!gatePass || gatePass.length < 6) {
            setGateErr("La password deve essere lunga almeno 6 caratteri.");
            return;
          }
          if (gatePass !== gatePass2) {
            setGateErr("Le password non coincidono.");
            return;
          }
          await registerWithEmail(email, gatePass);
        }

        refreshUserFromToken();
        await refreshCreditsUI();

        setAuthBanner({
          variant: "success",
          title: "Accesso completato",
          text: "Perfetto. Ora continuo con la lettura premium.",
          actionLabel: null,
          action: null,
        });

        await generaPremium();
        return;
      }

      // --------------------------------------------------
      // TRIAL DISPONIBILE → premium subito + invio link best-effort
      // --------------------------------------------------
      setGateMsg("Attendi, sto generando…");

      // marketing consent: solo se token utente valido (non guest)
      try {
        const userToken = getToken();
        if (userToken) {
          const payload = decodeJwtPayload(userToken);
          const role = (payload?.role || "").toLowerCase();
          const sub = payload?.sub || "";
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub);

          if (role !== "guest" && isUuid) {
            await updateMarketingConsent(userToken, !!gateMarketing);
          }
        }
      } catch (err) {
        console.warn("[OROSCOPO][INLINE-AUTH] updateMarketingConsent fallito (non blocco):", err?.message || err);
      }

      // magic link best-effort
      try {
        await sendAuthMagicLink(email, redirectUrl);
      } catch (err) {
        console.warn("[OROSCOPO][INLINE-AUTH] magic link non inviato (non blocco):", err?.message || err);
      }

      await generaPremium();
      await refreshCreditsUI();
      return;
    } catch (err) {
      setGateErr(err?.message || "Operazione non riuscita. Riprova.");
    } finally {
      setGateLoading(false);
    }
  }

  // ==========================
  // DERIVATE UI
  // ==========================
  const currentCost = PERIOD_COSTS[form.periodo] != null ? PERIOD_COSTS[form.periodo] : 0;

  const freeTier = freeResult?.oroscopo_ai?.meta?.tier || "free";
  const freeAi =
    freeResult?.oroscopo_ai?.content ||
    freeResult?.oroscopo_ai ||
    freeResult?.content ||
    freeResult ||
    null;
  const freeText = freeAi ? buildInterpretazioneTesto(freeAi, freeTier) : "";
  const freeTeaser = freeAi ? buildFreeTeaser(freeAi) : "";
  
  const hasFree = !!freeResult;

  const freePeriodoKey = freeResult?.engine_result?.periodo_ita || form.periodo || "giornaliero";
  const freePeriodBlock =
    freeResult?.payload_ai?.periodi && freeResult.payload_ai.periodi[freePeriodoKey]
      ? freeResult.payload_ai.periodi[freePeriodoKey]
      : null;
  const freeMetriche = freePeriodBlock?.metriche_grafico || null;
  const freeAspetti = Array.isArray(freePeriodBlock?.aspetti_rilevanti) ? freePeriodBlock.aspetti_rilevanti : [];

  const premiumTier = premiumResult?.oroscopo_ai?.meta?.tier || "premium";
  const premiumAi =
    premiumResult?.oroscopo_ai?.content ||
    premiumResult?.oroscopo_ai ||
    premiumResult?.content ||
    premiumResult ||
    null;
  const hasPremium = !!premiumResult;
  const premiumText = premiumAi ? buildInterpretazioneTesto(premiumAi, premiumTier) : "";

  const premiumPeriodoKey = premiumResult?.engine_result?.periodo_ita || form.periodo || "giornaliero";
  const premiumPeriodBlock =
    premiumResult?.payload_ai?.periodi && premiumResult.payload_ai.periodi[premiumPeriodoKey]
      ? premiumResult.payload_ai.periodi[premiumPeriodoKey]
      : null;
  const premiumMetriche = premiumPeriodBlock?.metriche_grafico || null;
  const premiumAspetti = Array.isArray(premiumPeriodBlock?.aspetti_rilevanti) ? premiumPeriodBlock.aspetti_rilevanti : [];

  const typebotUrl = useMemo(() => {
    const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
    try {
      const params = new URLSearchParams();
      if (userIdForDyana) params.set("user_id", userIdForDyana);
      if (sessionId) params.set("session_id", sessionId);
      params.set("reading_id", premiumResult?.oroscopo_ai?.meta?.reading_id || "oroscopo_inline");
      params.set("reading_type", "oroscopo_ai");
      params.set("reading_label", `Il tuo oroscopo (${premiumPeriodoKey || "giorno"})`);

      const safeReadingText = (premiumText || "").slice(0, 6000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      const qs = params.toString();
      return qs ? `${baseUrl}?${qs}` : baseUrl;
    } catch {
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, premiumResult, premiumText, premiumPeriodoKey]);

  // banner action
  const handleBannerAction = async () => {
    if (!authBanner?.action) return;
    if (authBanner.action === "RUN_PREMIUM") {
      await handleApprofondisciClick();
    }
  };

  const primaryBusy = loading || gateLoading;
  const primaryLabel = primaryBusy ? "Attendi, sto generando…" : "🔮 Inizia la lettura";
  const premiumBusyLabel = primaryBusy ? "Attendi, sto generando…" : "🔒 Sblocca la lettura completa";

  // ==========================
  // RENDER
  // ==========================
  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={handleLogout} />

      <section className="landing-wrapper">
<header className="section">
  <h1 className="section-title">Il tuo schema astrologico in questo periodo</h1>
  <p className="section-subtitle">
    Non è un oroscopo generico. È una lettura basata su come reagisci davvero quando le cose contano.
  </p>
  <p className="card-text" style={{ maxWidth: 850, margin: "10px auto 0", opacity: 0.9 }}>
    Vediamo se questo schema emerge davvero nel tuo profilo. Inserisci i dati per confermare.
  </p>
</header>


        {/* Banner post-login / stato */}
        {authBanner && (
          <InlineBanner
            variant={authBanner.variant}
            title={authBanner.title}
            text={authBanner.text}
            actionLabel={authBanner.actionLabel}
            onAction={authBanner.action ? handleBannerAction : null}
            onClose={() => setAuthBanner(null)}
          />
        )}

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Nome nascosto in questa fase */}
{false && (
  <div>
    <label className="card-text">Nome (opzionale)</label>
    <input
      name="nome"
      value={form.nome}
      onChange={handleChange}
      className="form-input"
      placeholder="Come vuoi essere chiamato"
    />
  </div>
)}



              <div>
                <label className="card-text">Data di nascita</label>
                <input type="date" name="data" value={form.data} onChange={handleChange} className="form-input" />
              </div>

              <div>
                <label className="card-text">Ora di nascita</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <input
                    type="time"
                    name="ora"
                    value={form.ora}
                    onChange={handleChange}
                    className="form-input"
                    disabled={oraIgnota}
                    style={oraIgnota ? { opacity: 0.4, pointerEvents: "none" } : undefined}
                  />
                  <label
                    className="card-text"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    <input type="checkbox" checked={oraIgnota} onChange={handleOraIgnotaChange} style={{ width: 14, height: 14 }} />
                    <span>Non conosco l&apos;ora esatta (uso un oroscopo con ora neutra)</span>
                  </label>
                </div>
				              <div>
                <label className="card-text">Città di nascita</label>
                <input
                  name="citta"
                  value={form.citta}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Es. Milano, Roma, Napoli…"
                />
              </div>
				
              </div>
<div style={{ marginTop: 10 }}>
  <p className="card-text" style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: 8 }}>
    Vuoi una visione più ampia?
  </p>

  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {[
      ["giornaliero", "Giorno"],
      ["settimanale", "Settimana"],
      ["mensile", "Mese"],
      ["annuale", "Anno"],
    ].map(([val, label]) => (
      <button
        key={val}
        type="button"
        className={form.periodo === val ? "btn btn-primary" : "btn"}
        onClick={() => setForm((p) => ({ ...p, periodo: val }))}
        disabled={primaryBusy}
        style={{ padding: "8px 12px", borderRadius: 999 }}
      >
        {label}
      </button>
    ))}
  </div>

  <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 8 }}>

  </p>
</div>


              <button onClick={generaFree} className="btn btn-primary" disabled={primaryBusy} style={{ marginTop: "14px" }}>
                {primaryLabel}
              </button>

              {/* Errori */}
              {errore && (
                noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {isLoggedIn ? (
                      <>
                        <p>Crediti insufficienti.</p>
                        <p style={{ marginTop: 8 }}>
                          <Link href="/crediti" className="link">Vai ai crediti</Link>
                        </p>
                        <p style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.8 }}>
                          Dettagli: {errore}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Hai completato il tuo primo oroscopo.</p>
                        <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                          Usa Email+Link, oppure accedi/iscriviti per continuare.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="card-text" style={{ color: "#ff9a9a" }}>{errore}</p>
                )
              )}
            </div>
          </div>
        </section>

        {/* BLOCCO FREE: visibile solo finché NON c'è premium */}
        {hasFree && !hasPremium && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">La tua sintesi</h3>

{SHOW_TABLES_IN_FREE && freeMetriche && <MetricheGrafico metriche={freeMetriche} />}
{SHOW_TABLES_IN_FREE && freeAspetti.length > 0 && <AspettiTable aspetti={freeAspetti} />}


<h4 className="card-subtitle" style={{ marginTop: 24 }}>Quello che emerge ora</h4>
<p className="card-text" style={{ whiteSpace: "pre-wrap" }}>{freeTeaser}</p>

<div style={{ marginTop: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}>
  <div className="card-text" style={{ fontWeight: 700, marginBottom: 6 }}>
    Nel report completo DYANA analizza:
  </div>
  <div className="card-text" style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>
    • perché questo schema si attiva proprio ora{"\n"}
    • in quali momenti è più forte{"\n"}
    • quanto durerà davvero{"\n"}
    • come lavorarci in modo consapevole
  </div>
</div>


              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" onClick={handleApprofondisciClick} disabled={primaryBusy}>
                  {premiumBusyLabel}
                </button>

                {isLoggedIn && currentCost > 0 && (
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
                    Costo: {currentCost} credito{currentCost === 1 ? "" : "i"}
                  </span>
                )}
              </div>

              {/* EMAIL GATE INLINE */}
              {emailGateOpen && !hasPremium && (
                <div
                  className="card"
                  style={{
                    marginTop: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <h4 className="card-subtitle" style={{ marginBottom: 6 }}>
                    {guestTrialLeft === 0 ? "Hai finito la tua prova gratuita." : "Continua con la tua email"}
                  </h4>

                  <p className="card-text" style={{ opacity: 0.9 }}>{gateMsg}</p>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {guestTrialLeft === 0 && (
                      <>
                        <button
                          type="button"
                          className={gateMode === "magic" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("magic")}
                          disabled={primaryBusy}
                        >
                          Email+Link
                        </button>

                        <button
                          type="button"
                          className={gateMode === "register" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("register")}
                          disabled={primaryBusy}
                        >
                          Iscriviti
                        </button>

                        <button
                          type="button"
                          className={gateMode === "login" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("login")}
                          disabled={primaryBusy}
                        >
                          Accedi
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="btn"
                      onClick={() => setEmailGateOpen(false)}
                      style={{ marginLeft: "auto" }}
                      disabled={primaryBusy}
                    >
                      Chiudi
                    </button>
                  </div>

                  <form onSubmit={submitInlineAuth} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="La tua email"
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                      disabled={primaryBusy}
                    />

                    {/* CONSENSO MARKETING + LINK CONDIZIONI SOLO PER TRIAL DISPONIBILE */}
                    {guestTrialLeft === 1 && (
                      <div style={{ marginTop: 2 }}>
                        <label className="card-text" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <input
                            type="checkbox"
                            checked={gateMarketing}
                            onChange={(e) => setGateMarketing(e.target.checked)}
                            disabled={primaryBusy}
                            style={{ width: 14, height: 14, marginTop: 3 }}
                          />
                          <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                            Acconsento a ricevere comunicazioni e contenuti su DYANA.
                          </span>
                        </label>

                        <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 8 }}>
                          Continuando accetti le{" "}
                          <Link href="/condizioni" className="link" target="_blank" rel="noreferrer">
                            Condizioni del servizio
                          </Link>{" "}
                          e l’{" "}
                          <Link href="/privacy" className="link" target="_blank" rel="noreferrer">
                            Informativa Privacy
                          </Link>
                          .
                        </p>
                      </div>
                    )}

                    {/* PASSWORD SOLO SE TRIAL=0 E NON MAGIC */}
                    {guestTrialLeft === 0 && gateMode !== "magic" && (
                      <>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Password"
                          value={gatePass}
                          onChange={(e) => setGatePass(e.target.value)}
                          autoComplete="current-password"
                          disabled={primaryBusy}
                        />
                        {gateMode === "register" && (
                          <input
                            className="form-input"
                            type="password"
                            placeholder="Ripeti password"
                            value={gatePass2}
                            onChange={(e) => setGatePass2(e.target.value)}
                            autoComplete="new-password"
                            disabled={primaryBusy}
                          />
                        )}
                      </>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={primaryBusy}>
                      {(gateLoading || loading)
                        ? "Attendi, sto generando…"
                        : guestTrialLeft === 0
                        ? (gateMode === "magic"
                            ? "Apri l'e-mail e clicca il link per procedere al calcolo"
                            : (gateMode === "login" ? "Accedi e continua" : "Iscriviti e continua"))
                        : "Continua"}
                    </button>

                    {gateErr && <p className="card-text" style={{ color: "#ff9a9a" }}>{gateErr}</p>}

                    {guestTrialLeft != null && (
                      <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                        Prova residua sul dispositivo: <strong>{guestTrialLeft}</strong>
                      </p>
                    )}
                  </form>
                </div>
              )}
            </div>
          </section>
        )}

        {/* BLOCCO PREMIUM */}
        {hasPremium && (
          <>
            <section className="section">
              <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                <h3 className="card-title">La tua lettura completa</h3>

                {premiumMetriche && <MetricheGrafico metriche={premiumMetriche} />}
                {premiumAspetti.length > 0 && <AspettiTable aspetti={premiumAspetti} />}

                <h4 className="card-subtitle" style={{ marginTop: 24 }}>Interpretazione</h4>
                <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                  {premiumText || "Lettura completata. (Testo non disponibile in questo formato risposta.)"}
                </p>
              </div>
            </section>

            {/* BLOCCO DYANA Q&A */}
            <section className="section">
              <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                <div
                  className="card"
                  style={{
                    maxWidth: 950,
                    width: "100%",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
                  }}
                >
                  <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 4 }}>
                    DYANA • Q&amp;A sul tuo Oroscopo
                  </p>

                  <h3 className="card-title" style={{ marginBottom: 6 }}>
                    Hai domande su questa lettura?
                  </h3>

                  <p className="card-text" style={{ marginBottom: 4, opacity: 0.9 }}>
                    DYANA conosce già l&apos;oroscopo che hai appena generato e può aiutarti a interpretarlo meglio.
                  </p>
<button
  type="button"
  className="btn btn-primary"
  style={{
    marginTop: 16,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 18,
  }}
  onClick={() => setDiyanaOpen((prev) => !prev)}
>
  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
    <span style={{ fontWeight: 800 }}>
      {diyanaOpen ? "Chiudi DYANA" : "Chiedi a DYANA"}
    </span>
    <span style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: 500 }}>
      Fai una domanda su questa lettura.
    </span>
  </span>

  <span
    style={{
      width: 46,
      height: 46,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      background: "rgba(0,0,0,0.22)",
      border: "1px solid rgba(255,255,255,0.14)",
      flex: "0 0 auto",
    }}
  >
    <img
      src="/dyana-logo-NAV.PNG"
      alt="DYANA"
      style={{ width: 28, height: 28, objectFit: "contain" }}
    />
  </span>
</button>



                  {diyanaOpen && (
                    <div style={{ marginTop: 16, width: "100%", height: 560, borderRadius: 18, overflow: "hidden" }}>
                      <iframe
                        src={typebotUrl}
                        style={{ border: "none", width: "100%", height: "100%" }}
                        allow="clipboard-write; microphone; camera"
                      />
                    </div>
                  )}

                  <p className="card-text" style={{ marginTop: 8, fontSize: "0.75rem", opacity: 0.65, textAlign: "right" }}>
                    DYANA risponde solo su questo oroscopo, non su argomenti generici.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

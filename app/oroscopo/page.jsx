"use client";
import DyanaCTA from "../../components/DyanaCTA";
import DyanaAskCTA from "../../components/DyanaAskCTA";
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
// NUOVO SUPPORTO SCHEMA COMPACT DAILY
// ==========================
function isDailyCompactSchema(oroscopoAi) {
  return !!(
    oroscopoAi &&
    typeof oroscopoAi === "object" &&
    (oroscopoAi.schema_type === "daily_compact" ||
      (typeof oroscopoAi.headline === "string" && Array.isArray(oroscopoAi.highlights)))
  );
}

function renderDailyCompactText(oroscopoAi, tierRaw, labels) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  const tier = (tierRaw || "free").toLowerCase();
  const isPremium = tier === "premium";
  const parts = [];

  if (oroscopoAi.headline) parts.push(oroscopoAi.headline);
  if (oroscopoAi.mood) parts.push(`${labels.mood}: ${oroscopoAi.mood}`);

  if (Array.isArray(oroscopoAi.highlights) && oroscopoAi.highlights.length) {
    parts.push(oroscopoAi.highlights.map((x) => `• ${x}`).join("\n"));
  }

  if (oroscopoAi.focus) {
    parts.push(`${labels.focus}\n${oroscopoAi.focus}`);
  }

  if (isPremium) {
    if (oroscopoAi.timing?.favorevole) {
      parts.push(`${labels.favorableMoment}\n${oroscopoAi.timing.favorevole}`);
    }
    if (oroscopoAi.timing?.delicato) {
      parts.push(`${labels.delicateMoment}\n${oroscopoAi.timing.delicato}`);
    }
    if (oroscopoAi.actions?.do) {
      parts.push(`${labels.doLabel}\n${oroscopoAi.actions.do}`);
    }
    if (oroscopoAi.actions?.avoid) {
      parts.push(`${labels.avoid}\n${oroscopoAi.actions.avoid}`);
    }
    if (oroscopoAi.love) {
      parts.push(`${labels.relationships}\n${oroscopoAi.love}`);
    }
    if (oroscopoAi.work) {
      parts.push(`${labels.work}\n${oroscopoAi.work}`);
    }
    if (oroscopoAi.summary) {
      parts.push(oroscopoAi.summary);
    }
  } else {
    if (oroscopoAi.cta_premium) {
      parts.push(oroscopoAi.cta_premium);
    }
  }

  return parts.filter(Boolean).join("\n\n");
}

function DailyCompactCard({ data, tier = "free", labels }) {
  if (!data || typeof data !== "object") return null;

  const isPremium = (tier || "free").toLowerCase() === "premium";
  const highlights = Array.isArray(data.highlights) ? data.highlights.filter(Boolean) : [];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {data.headline && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div className="card-text" style={{ fontWeight: 800, fontSize: "1.02rem" }}>
            {data.headline}
          </div>
          {data.mood && (
            <div className="card-text" style={{ marginTop: 6, opacity: 0.82 }}>
              {labels.mood}: {data.mood}
            </div>
          )}
        </div>
      )}

      {highlights.length > 0 && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
            {labels.keyPoints}
          </div>
          <div className="card-text" style={{ display: "grid", gap: 8 }}>
            {highlights.map((item, idx) => (
              <div key={idx}>• {item}</div>
            ))}
          </div>
        </div>
      )}

      {data.focus && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
            {labels.focus}
          </div>
          <div className="card-text">{data.focus}</div>
        </div>
      )}

      {isPremium && (
        <>
          {(data.timing?.favorevole || data.timing?.delicato) && (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {data.timing?.favorevole && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                    {labels.favorableMoment}
                  </div>
                  <div className="card-text">{data.timing.favorevole}</div>
                </div>
              )}

              {data.timing?.delicato && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                    {labels.delicateMoment}
                  </div>
                  <div className="card-text">{data.timing.delicato}</div>
                </div>
              )}
            </div>
          )}

          {(data.actions?.do || data.actions?.avoid) && (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {data.actions?.do && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                    {labels.doLabel}
                  </div>
                  <div className="card-text">{data.actions.do}</div>
                </div>
              )}

              {data.actions?.avoid && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                    {labels.avoid}
                  </div>
                  <div className="card-text">{data.actions.avoid}</div>
                </div>
              )}
            </div>
          )}

          {(data.love || data.work) && (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              {data.love && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                    {labels.relationships}
                  </div>
                  <div className="card-text">{data.love}</div>
                </div>
              )}

              {data.work && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                    {labels.work}
                  </div>
                  <div className="card-text">{data.work}</div>
                </div>
              )}
            </div>
          )}

          {data.summary && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div className="card-text" style={{ fontWeight: 700, marginBottom: 8 }}>
                {labels.finalSummary}
              </div>
              <div className="card-text">{data.summary}</div>
            </div>
          )}
        </>
      )}

      {!isPremium && data.cta_premium && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div className="card-text">{data.cta_premium}</div>
        </div>
      )}
    </div>
  );
}

// ==========================
// TESTO INTERPRETAZIONE
// ==========================
function buildInterpretazioneTesto(oroscopoAi, tierRaw, labels) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  if (isDailyCompactSchema(oroscopoAi)) {
    return renderDailyCompactText(oroscopoAi, tierRaw, labels.compact);
  }

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
        const label =
          mp.label || mp.titolo || mp.title || labels.text.subperiod.replace("{n}", idx + 1);
        const range = mp.date_range || mp.range || {};
        const start = range.start || range.inizio || range.from || null;
        const end = range.end || range.fine || range.to || null;
        const rangeText = start && end ? `${start} – ${end}` : "";
        const text = (mp.text || mp.descrizione || mp.content || "").trim();
        const header = rangeText ? `${label} (${rangeText})` : label;
        if (text) pieces.push(`${header}\n${text}`);
      });
    } else {
      const labelsList = macro
        .map((mp) => mp && (mp.label || mp.titolo || mp.title))
        .filter(Boolean);
      if (labelsList.length) {
        pieces.push(
          `${labels.text.mainSubperiods}\n` + labelsList.map((l) => `• ${l}`).join("\n")
        );
      }
    }
  }

  const sections = oroscopoAi.sections || {};
  const SECTION_LABELS = {
    panorama: labels.text.generalOverview,
    emozioni: labels.text.emotions,
    relazioni: labels.text.relationships,
    energia: labels.text.energy,
    lavoro: labels.text.work,
    focus: labels.text.focus,
    consigli: labels.text.advice,
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

  if (!pieces.length) return labels.text.interpretationUnavailable;
  return pieces.join("\n\n");
}

// ==========================
// UI: Banner (sandwich)
// ==========================
function InlineBanner({
  variant = "info",
  title,
  text,
  actionLabel,
  onAction,
  onClose,
  closeLabel,
}) {
  const palette =
    variant === "success"
      ? { border: "rgba(130,255,160,0.22)", bg: "rgba(40,80,52,0.18)", color: "#d6ffe3" }
      : variant === "warn"
      ? { border: "rgba(255,223,154,0.22)", bg: "rgba(90,70,20,0.16)", color: "#ffdf9a" }
      : {
          border: "rgba(255,255,255,0.14)",
          bg: "rgba(0,0,0,0.22)",
          color: "rgba(245,245,255,0.92)",
        };

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
            <div
              className="card-text"
              style={{ fontWeight: 700, marginBottom: 4, color: palette.color }}
            >
              {title}
            </div>
          )}
          {text && (
            <div
              className="card-text"
              style={{ fontSize: "0.92rem", opacity: 0.92, whiteSpace: "pre-wrap" }}
            >
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
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ whiteSpace: "nowrap" }}
          >
            {closeLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================
// COMPONENTI SUPPORTO
// ==========================
function MetricheGrafico({ metriche, labels }) {
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
    emozioni: labels.emotions,
    relazioni: labels.relationships,
    energia: labels.energy,
  };

  const normalize = (val) => {
    if (typeof val !== "number" || !isFinite(val)) return 0;
    const clamped = Math.max(-1, Math.min(1, val));
    return Math.round(((clamped + 1) / 2) * 100);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h4 className="card-subtitle">{labels.title}</h4>
      <p
        className="card-text"
        style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}
      >
        {labels.subtitle}
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
                {labels.subperiod}
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
              const label = s.label || labels.phase.replace("{n}", idx + 1);
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
                      <td
                        key={a}
                        style={{
                          padding: "6px 8px",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
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

function AspettiTable({ aspetti, labels }) {
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
      <h4 className="card-subtitle">{labels.title}</h4>
      <p
        className="card-text"
        style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}
      >
        {labels.subtitle}
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
                }}
              >
                {labels.aspect}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {labels.intensity}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {labels.duration}
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {labels.firstActivation}
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
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
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
                    {durataGiorni != null
                      ? `${durataGiorni} ${
                          durataGiorni === 1 ? labels.day : labels.days
                        }`
                      : "-"}
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
function buildFreeTeaser(oroscopoAi, fallbackText) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  if (isDailyCompactSchema(oroscopoAi)) {
    const parts = [];

    if (oroscopoAi.headline) parts.push(oroscopoAi.headline);
    if (oroscopoAi.focus) parts.push(oroscopoAi.focus);

    if (Array.isArray(oroscopoAi.highlights) && oroscopoAi.highlights.length) {
      parts.push(oroscopoAi.highlights.slice(0, 2).map((x) => `• ${x}`).join("\n"));
    }

    return parts.filter(Boolean).join("\n\n") || fallbackText;
  }

  const intro = (
    oroscopoAi.intro ||
    oroscopoAi.sintesi_periodo ||
    oroscopoAi.sintesi ||
    ""
  ).trim();

  const sections =
    oroscopoAi.sections && typeof oroscopoAi.sections === "object"
      ? oroscopoAi.sections
      : {};
  const pick =
    (
      sections.emozioni ||
      sections.relazioni ||
      sections.panorama ||
      sections.lavoro ||
      ""
    ).trim();

  const base = intro || pick || "";

  const cut =
    base.length > 520
      ? base.slice(0, 520).replace(/\s+\S*$/, "") + "…"
      : base;

  return cut || fallbackText;
}

function getStoredCtaVariant() {
  if (typeof window === "undefined") return "A";
  try {
    return localStorage.getItem("dyana_cta_variant") || "A";
  } catch {
    return "A";
  }
}

export default function OroscopoPage() {
  const { t } = useI18n();
  const { locale } = useI18n();
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const compactLabels = useMemo(
    () => ({
      mood: t("horoscope.compact.mood"),
      keyPoints: t("horoscope.compact.keyPoints"),
      focus: t("horoscope.compact.focus"),
      favorableMoment: t("horoscope.compact.favorableMoment"),
      delicateMoment: t("horoscope.compact.delicateMoment"),
      doLabel: t("horoscope.compact.do"),
      avoid: t("horoscope.compact.avoid"),
      relationships: t("horoscope.compact.relationships"),
      work: t("horoscope.compact.work"),
      finalSummary: t("horoscope.compact.finalSummary"),
    }),
    [t]
  );

  const textLabels = useMemo(
    () => ({
      compact: compactLabels,
      text: {
        mainSubperiods: t("horoscope.text.mainSubperiods"),
        subperiod: t("horoscope.text.subperiod"),
        generalOverview: t("horoscope.text.generalOverview"),
        emotions: t("horoscope.text.emotions"),
        relationships: t("horoscope.text.relationships"),
        energy: t("horoscope.text.energy"),
        work: t("horoscope.text.work"),
        focus: t("horoscope.text.focus"),
        advice: t("horoscope.text.advice"),
        interpretationUnavailable: t("horoscope.text.interpretationUnavailable"),
      },
    }),
    [t, compactLabels]
  );

  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
	country: "IT",
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
  const [gateMode, setGateMode] = useState("login"); // magic | register | login
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
      const draft = loadOroscopoDraft();
      if (draft && typeof draft === "object") {
        if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
        if (typeof draft.oraIgnota === "boolean") setOraIgnota(draft.oraIgnota);
      }

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

  // 4) AUTH_DONE listeners + banner + eventuale azione post-login
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function onAuthDone() {
      try {
        try {
          localStorage.removeItem(AUTH_DONE_KEY);
        } catch {}

        refreshUserFromToken();
        await refreshCreditsUI();

        setEmailGateOpen(false);
        setGateErr("");
        setGateMsg("");

        setAuthBanner({
          variant: "success",
          title: t("horoscope.banner.authCompletedTitle"),
          text: t("horoscope.banner.authCompletedText"),
          actionLabel: t("horoscope.banner.authCompletedAction"),
          action: "RUN_PREMIUM",
        });

        let pending = null;
        try {
          pending = localStorage.getItem(POST_LOGIN_ACTION_KEY);
        } catch {}

        if (pending === "oroscopo_premium") {
          try {
            localStorage.removeItem(POST_LOGIN_ACTION_KEY);
          } catch {}
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

    try {
      const pending = localStorage.getItem(AUTH_DONE_KEY);
      if (pending) onAuthDone();
    } catch {}

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("dyana:auth", onLocalAuthEvent);
      try {
        bc && bc.close();
      } catch {}
    };
  }, [refreshUserFromToken, refreshCreditsUI, t]);

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
const fullCity = buildCityWithCountry(form.citta, form.country);
const payload = {
  nome: form.nome || null,
  citta: fullCity,
  data: form.data,
  ora: oraIgnota ? null : form.ora,
  email: null,
  domanda: null,
  tier,
  lang: locale === "en" ? "en" : "it",   // ✅ NUOVO
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
          t("horoscope.errors.genericGenerationStatus").replace(
            "{status}",
            res.status
          );
        setErrore(
          typeof msg === "string"
            ? msg
            : t("horoscope.errors.genericGeneration")
        );
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
      setErrore(t("horoscope.errors.connection"));
    } finally {
      setLoading(false);
    }
  }

  async function generaPremium() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    setGateErr("");

    setAuthBanner({
      variant: "info",
      title: t("horoscope.banner.generatingPremiumTitle"),
      text: t("horoscope.banner.generatingPremiumText"),
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
          (typeof errorCode === "string" &&
            errorCode.toLowerCase().includes("credit"));

        const msg =
          (data && (data.error || data.detail || data.message)) ||
          t("horoscope.errors.genericGenerationStatus").replace(
            "{status}",
            res.status
          );

        if (isCreditsError) {
          setNoCredits(true);
          setErrore(t("horoscope.errors.insufficientCredits"));
          setAuthBanner(null);
          await refreshCreditsUI();
          if (!isLoggedIn && ENABLE_EMAIL_GATE_WHEN_TRIAL_OVER) {
            if (guestTrialLeft === 0) {
              openEmailGate();
            }
          }
          return;
        }

        setErrore(
          typeof msg === "string" ? msg : t("horoscope.errors.genericGeneration")
        );
        setAuthBanner(null);
        return;
      }

      setPremiumResult(data);

      enqueueConversionEvent("oroscopo_completed", {
        feature: "oroscopo",
        tier: "premium",
      });

      try {
        clearOroscopoDraft();
      } catch {}

      setEmailGateOpen(false);
      setDiyanaOpen(false);

      setAuthBanner({
        variant: "success",
        title: t("horoscope.banner.premiumReadyTitle"),
        text: t("horoscope.banner.premiumReadyText"),
        actionLabel: null,
        action: null,
      });

      await refreshCreditsUI();
    } catch (e) {
      setAuthBanner(null);
      setErrore(t("horoscope.errors.connection"));
    } finally {
      setLoading(false);
    }
  }

  function openEmailGate() {
    setGateErr("");
    setGateLoading(false);
    setGateMode("login");
    setEmailGateOpen(true);

    const trial = guestTrialLeft;
    if (trial === 0) {
      setGateMsg(t("horoscope.gate.messageTrialOver"));
    } else {
      setGateMsg(t("horoscope.gate.messageTrialAvailable"));
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

    await refreshCreditsUI();

    if (guestTrialLeft === 0) {
      openEmailGate();
      return;
    }

    await generaPremium();
  }

  async function submitInlineAuth(e) {
    e.preventDefault();

    setGateErr("");
    setGateLoading(true);

    try {
      const email = (gateEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        setGateErr(t("horoscope.errors.invalidEmail"));
        return;
      }

      try {
        localStorage.setItem("dyana_pending_email", email);
      } catch {}

setResumeTarget({ path: "/oroscopo" });

      const redirectUrl =
        typeof window !== "undefined" && window.location?.origin
          ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback`
          : "https://dyana.app/auth/callback";

if (guestTrialLeft === 0) {
  if (gateMode === "magic") {
    setGateMsg(t("horoscope.gate.magicSent"));

    try {
      localStorage.setItem(POST_LOGIN_ACTION_KEY, "oroscopo_premium");
    } catch {}

    await sendAuthMagicLink(email, redirectUrl);

    setAuthBanner({
      variant: "info",
      title: t("horoscope.banner.checkEmailTitle"),
      text: t("horoscope.banner.checkEmailText"),
      actionLabel: null,
      action: null,
    });

    return;
  }

  if (gateMode === "login") {
    if (!gatePass) {
      setGateErr(t("horoscope.errors.passwordRequired"));
      return;
    }

    await loginWithCredentials(email, gatePass);

    refreshUserFromToken();
    await refreshCreditsUI();

    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");

    setAuthBanner({
      variant: "success",
      title: t("horoscope.banner.authCompletedTitle"),
      text: t("horoscope.banner.generatingPremiumText"),
      actionLabel: null,
      action: null,
    });

    await generaPremium();
    return;
  }

  if (gateMode === "register") {
    if (!gatePass || gatePass.length < 6) {
      setGateErr(t("horoscope.errors.passwordMin"));
      return;
    }

    if (gatePass !== gatePass2) {
      setGateErr(t("horoscope.errors.passwordMismatch"));
      return;
    }

    await registerWithEmail(email, gatePass);
    await loginWithCredentials(email, gatePass);

    refreshUserFromToken();
    await refreshCreditsUI();

    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");

    setAuthBanner({
      variant: "success",
      title: t("horoscope.banner.authCompletedTitle"),
      text: t("horoscope.banner.generatingPremiumText"),
      actionLabel: null,
      action: null,
    });

    await generaPremium();
    return;
  }

  setGateErr(t("horoscope.errors.genericActionFailed"));
  return;
}

      setGateMsg(t("horoscope.gate.generating"));

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
          "[OROSCOPO][INLINE-AUTH] updateMarketingConsent fallito (non blocco):",
          err?.message || err
        );
      }

      try {
        await sendAuthMagicLink(email, redirectUrl);
      } catch (err) {
        console.warn(
          "[OROSCOPO][INLINE-AUTH] magic link non inviato (non blocco):",
          err?.message || err
        );
      }

      await generaPremium();
      await refreshCreditsUI();
      return;
    } catch (err) {
      setGateErr(err?.message || t("horoscope.errors.actionFailed"));
    } finally {
      setGateLoading(false);
    }
  }

  // ==========================
  // DERIVATE UI
  // ==========================
  const currentCost =
    PERIOD_COSTS[form.periodo] != null ? PERIOD_COSTS[form.periodo] : 0;

  const freeTier = freeResult?.oroscopo_ai?.meta?.tier || "free";
  const freeAi =
    freeResult?.oroscopo_ai?.content ||
    freeResult?.oroscopo_ai ||
    freeResult?.content ||
    freeResult ||
    null;
  const freeText = freeAi
    ? buildInterpretazioneTesto(freeAi, freeTier, textLabels)
    : "";
  const freeTeaser = freeAi
    ? buildFreeTeaser(freeAi, t("horoscope.text.freeDefaultTeaser"))
    : "";
  const isFreeDailyCompact = isDailyCompactSchema(freeAi);

  const hasFree = !!freeResult;

  const freePeriodoKey =
    freeResult?.engine_result?.periodo_ita || form.periodo || "giornaliero";
  const freePeriodBlock =
    freeResult?.payload_ai?.periodi &&
    freeResult.payload_ai.periodi[freePeriodoKey]
      ? freeResult.payload_ai.periodi[freePeriodoKey]
      : null;
  const freeMetriche = freePeriodBlock?.metriche_grafico || null;
  const freeAspetti = Array.isArray(freePeriodBlock?.aspetti_rilevanti)
    ? freePeriodBlock.aspetti_rilevanti
    : [];

  const premiumTier = premiumResult?.oroscopo_ai?.meta?.tier || "premium";
  const premiumAi =
    premiumResult?.oroscopo_ai?.content ||
    premiumResult?.oroscopo_ai ||
    premiumResult?.content ||
    premiumResult ||
    null;
  const hasPremium = !!premiumResult;
  const premiumText = premiumAi
    ? buildInterpretazioneTesto(premiumAi, premiumTier, textLabels)
    : "";
  const isPremiumDailyCompact = isDailyCompactSchema(premiumAi);

  useEffect(() => {
    if (!hasFree && !hasPremium) return;

    try {
      const variant = getStoredCtaVariant();

      if (hasFree && !hasPremium) {
        enqueueConversionEvent("dyana_cta_impression", {
          cta_type: "premium",
          cta_variant: variant,
          page: "oroscopo",
        });
      }

      if (hasPremium) {
        enqueueConversionEvent("dyana_cta_impression", {
          cta_type: "ask",
          cta_variant: variant,
          page: "oroscopo",
        });
      }
    } catch {}
  }, [hasFree, hasPremium]);

  const premiumPeriodoKey =
    premiumResult?.engine_result?.periodo_ita || form.periodo || "giornaliero";
  const premiumPeriodBlock =
    premiumResult?.payload_ai?.periodi &&
    premiumResult.payload_ai.periodi[premiumPeriodoKey]
      ? premiumResult.payload_ai.periodi[premiumPeriodoKey]
      : null;
  const premiumMetriche = premiumPeriodBlock?.metriche_grafico || null;
  const premiumAspetti = Array.isArray(premiumPeriodBlock?.aspetti_rilevanti)
    ? premiumPeriodBlock.aspetti_rilevanti
    : [];

  const periodLabelMap = useMemo(
    () => ({
      giornaliero: t("horoscope.labels.day"),
      settimanale: t("horoscope.labels.week"),
      mensile: t("horoscope.labels.month"),
      annuale: t("horoscope.labels.year"),
    }),
    [t]
  );
const typebotUrl = useMemo(() => {
  const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
  try {
    const params = new URLSearchParams();

    if (userIdForDyana) params.set("user_id", userIdForDyana);
    if (sessionId) params.set("session_id", sessionId);

    params.set(
      "reading_id",
      premiumResult?.oroscopo_ai?.meta?.reading_id || "oroscopo_inline"
    );

    params.set("reading_type", "oroscopo_ai");

    params.set(
      "reading_label",
      t("horoscope.labels.readingLabel").replace(
        "{period}",
        periodLabelMap[premiumPeriodoKey] || premiumPeriodoKey || ""
      )
    );

    const safeReadingText = (premiumText || "").slice(0, 6000);
    if (safeReadingText) params.set("reading_text", safeReadingText);

    // 👇 AGGIUNGI QUESTO
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
  premiumText,
  premiumPeriodoKey,
  periodLabelMap,
  t,
  locale, // 👈 aggiungi anche questo
]);

  const handleBannerAction = async () => {
    if (!authBanner?.action) return;
    if (authBanner.action === "RUN_PREMIUM") {
      await handleApprofondisciClick();
    }
  };

  const primaryBusy = loading || gateLoading;
  const primaryLabel = primaryBusy
    ? t("horoscope.form.generating")
    : t("horoscope.form.generate");
  const premiumBusyLabel = primaryBusy
    ? t("horoscope.form.generating")
    : t("horoscope.form.unlockFull");

  return (
    <main className="page-root">
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={handleLogout}
      />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">{t("horoscope.title")}</h1>
          <p className="section-subtitle">{t("horoscope.subtitle")}</p>
          <p
            className="card-text"
            style={{ maxWidth: 680, margin: "18px  auto 0", opacity: 0.9,  textAlign: "center",lineHeight: 1.6, }}
          >
            {t("horoscope.introHint")}
          </p>
        </header>

        {authBanner && (
          <InlineBanner
            variant={authBanner.variant}
            title={authBanner.title}
            text={authBanner.text}
            actionLabel={authBanner.actionLabel}
            onAction={authBanner.action ? handleBannerAction : null}
            onClose={() => setAuthBanner(null)}
            closeLabel={t("horoscope.banner.close")}
          />
        )}

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {false && (
                <div>
                  <label className="card-text">
                    {t("horoscope.form.nameOptional")}
                  </label>
                  <input
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={t("horoscope.form.namePlaceholder")}
                  />
                </div>
              )}

              <div>
                <label className="card-text">{t("horoscope.form.birthDate")}</label>
                <input
                  type="date"
                  name="data"
                  value={form.data}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">{t("horoscope.form.birthTime")}</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={oraIgnota}
                      onChange={handleOraIgnotaChange}
                      style={{ width: 14, height: 14 }}
                    />
                    <span>{t("horoscope.form.unknownTime")}</span>
                  </label>
                </div>
<div>
  <label className="card-text">{t("horoscope.form.birthCity")}</label>
  <input
    name="citta"
    value={form.citta}
    onChange={handleChange}
    className="form-input"
    placeholder={t("horoscope.form.birthCityPlaceholder")}
  />

  <div style={{ marginTop: 12 }}>
    <label className="card-text">
      {locale === "en" ? "Country" : "Paese"}
    </label>
    <select
      name="country"
      value={form.country}
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
              </div>

              <div style={{ marginTop: 10 }}>
                <p
                  className="card-text"
                  style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: 8 }}
                >
                  {t("horoscope.form.periodPrompt")}
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    ["giornaliero", t("horoscope.form.periodDay")],
                    ["settimanale", t("horoscope.form.periodWeek")],
                    ["mensile", t("horoscope.form.periodMonth")],
                    ["annuale", t("horoscope.form.periodYear")],
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

                <p
                  className="card-text"
                  style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 8 }}
                ></p>
              </div>

              <button
                onClick={generaFree}
                className="btn btn-primary"
                disabled={primaryBusy}
                style={{ marginTop: "14px" }}
              >
                {primaryLabel}
              </button>

              {errore &&
                (noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {isLoggedIn ? (
                      <>
                        <p>{t("horoscope.noCredits.loggedTitle")}</p>
                        <p style={{ marginTop: 8 }}>
                          <Link href="/crediti" className="link">
                            {t("horoscope.noCredits.loggedCta")}
                          </Link>
                        </p>
                        <p
                          style={{ marginTop: 8, fontSize: "0.8rem", opacity: 0.8 }}
                        >
                          {t("horoscope.errors.details")} {errore}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{t("horoscope.noCredits.guestTitle")}</p>
                        <p
                          style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}
                        >
                          {t("horoscope.noCredits.guestSubtitle")}
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

        {/* BLOCCO FREE */}
        {hasFree && !hasPremium && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">{t("horoscope.free.title")}</h3>

              {SHOW_TABLES_IN_FREE && freeMetriche && (
                <MetricheGrafico
                  metriche={freeMetriche}
                  labels={{
                    title: t("horoscope.metrics.title"),
                    subtitle: t("horoscope.metrics.subtitle"),
                    subperiod: t("horoscope.metrics.subperiod"),
                    phase: t("horoscope.metrics.phase"),
                    emotions: t("horoscope.text.emotions"),
                    relationships: t("horoscope.text.relationships"),
                    energy: t("horoscope.text.energy"),
                  }}
                />
              )}
              {SHOW_TABLES_IN_FREE && freeAspetti.length > 0 && (
                <AspettiTable
                  aspetti={freeAspetti}
                  labels={{
                    title: t("horoscope.aspects.title"),
                    subtitle: t("horoscope.aspects.subtitle"),
                    aspect: t("horoscope.aspects.aspect"),
                    intensity: t("horoscope.aspects.intensity"),
                    duration: t("horoscope.aspects.duration"),
                    firstActivation: t("horoscope.aspects.firstActivation"),
                    day: t("horoscope.aspects.day"),
                    days: t("horoscope.aspects.days"),
                  }}
                />
              )}

              <h4 className="card-subtitle" style={{ marginTop: 24 }}>
                {t("horoscope.free.emergingNow")}
              </h4>

              {isFreeDailyCompact ? (
                <DailyCompactCard data={freeAi} tier={freeTier} labels={compactLabels} />
              ) : (
                <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                  {freeTeaser}
                </p>
              )}

              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                }}
              >
                <div className="card-text" style={{ fontWeight: 700, marginBottom: 6 }}>
                  {t("horoscope.free.completeReportTitle")}
                </div>
                <div className="card-text" style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>
                  {t("horoscope.free.completeReportBullets")}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <DyanaCTA
                  type="premium"
                  onClick={handleApprofondisciClick}
                  disabled={primaryBusy}
                />

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
    {t("horoscope.free.cost")
      .replace("{n}", currentCost)
      .replace("{nPlural}", currentCost > 1 ? "i" : "")}
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
                    {guestTrialLeft === 0
                      ? t("horoscope.gate.exhaustedTitle")
                      : t("horoscope.gate.continueTitle")}
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
    disabled={primaryBusy}
  >
    {t("horoscope.gate.login")}
  </button>

  <button
    type="button"
    className={gateMode === "register" ? "btn btn-primary" : "btn"}
    onClick={() => setGateMode("register")}
    disabled={primaryBusy}
  >
    {t("horoscope.gate.register")}
  </button>

  <button
    type="button"
    className={gateMode === "magic" ? "btn btn-primary" : "btn"}
    onClick={() => setGateMode("magic")}
    disabled={primaryBusy}
  >
    {t("horoscope.gate.emailLink")}
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
                      {t("horoscope.gate.close")}
                    </button>
                  </div>

                  <form
                    onSubmit={submitInlineAuth}
                    style={{ marginTop: 12, display: "grid", gap: 10 }}
                  >
                    <input
                      className="form-input"
                      type="email"
                      placeholder={t("horoscope.gate.emailPlaceholder")}
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                      disabled={primaryBusy}
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
                            disabled={primaryBusy}
                            style={{ width: 14, height: 14, marginTop: 3 }}
                          />
                          <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                            {t("horoscope.gate.marketingConsent")}
                          </span>
                        </label>

                        <p
                          className="card-text"
                          style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 8 }}
                        >
                          {t("horoscope.gate.legalPrefix")}{" "}
                          <Link
                            href="/condizioni"
                            className="link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("horoscope.gate.legalTerms")}
                          </Link>{" "}
                          {t("horoscope.gate.legalAndPrivacy")}{" "}
                          <Link
                            href="/privacy"
                            className="link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("horoscope.gate.legalPrivacy")}
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
                          placeholder={t("horoscope.gate.passwordPlaceholder")}
                          value={gatePass}
                          onChange={(e) => setGatePass(e.target.value)}
                          autoComplete="current-password"
                          disabled={primaryBusy}
                        />
                        {gateMode === "register" && (
                          <input
                            className="form-input"
                            type="password"
                            placeholder={t("horoscope.gate.repeatPasswordPlaceholder")}
                            value={gatePass2}
                            onChange={(e) => setGatePass2(e.target.value)}
                            autoComplete="new-password"
                            disabled={primaryBusy}
                          />
                        )}
                      </>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={primaryBusy}
                    >
                      {gateLoading || loading
                        ? t("horoscope.form.generating")
                        : guestTrialLeft === 0
                        ? gateMode === "magic"
                          ? t("horoscope.gate.submitMagic")
                          : gateMode === "login"
                          ? t("horoscope.gate.submitLogin")
                          : t("horoscope.gate.submitRegister")
                        : t("horoscope.gate.submitContinue")}
                    </button>

                    {gateErr && (
                      <p className="card-text" style={{ color: "#ff9a9a" }}>
                        {gateErr}
                      </p>
                    )}

                    {guestTrialLeft != null && (
                      <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                        {t("horoscope.gate.trialRemaining")}{" "}
                        <strong>{guestTrialLeft}</strong>
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
                <h3 className="card-title">{t("horoscope.premium.title")}</h3>

                {premiumMetriche && (
                  <MetricheGrafico
                    metriche={premiumMetriche}
                    labels={{
                      title: t("horoscope.metrics.title"),
                      subtitle: t("horoscope.metrics.subtitle"),
                      subperiod: t("horoscope.metrics.subperiod"),
                      phase: t("horoscope.metrics.phase"),
                      emotions: t("horoscope.text.emotions"),
                      relationships: t("horoscope.text.relationships"),
                      energy: t("horoscope.text.energy"),
                    }}
                  />
                )}
                {premiumAspetti.length > 0 && (
                  <AspettiTable
                    aspetti={premiumAspetti}
                    labels={{
                      title: t("horoscope.aspects.title"),
                      subtitle: t("horoscope.aspects.subtitle"),
                      aspect: t("horoscope.aspects.aspect"),
                      intensity: t("horoscope.aspects.intensity"),
                      duration: t("horoscope.aspects.duration"),
                      firstActivation: t("horoscope.aspects.firstActivation"),
                      day: t("horoscope.aspects.day"),
                      days: t("horoscope.aspects.days"),
                    }}
                  />
                )}

                <h4 className="card-subtitle" style={{ marginTop: 24 }}>
                  {t("horoscope.premium.interpretation")}
                </h4>

                {isPremiumDailyCompact ? (
                  <DailyCompactCard data={premiumAi} tier={premiumTier} labels={compactLabels} />
                ) : (
                  <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                    {premiumText || t("horoscope.premium.fallbackText")}
                  </p>
                )}
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
                  <p
                    className="card-text"
                    style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 4 }}
                  >
                    {t("horoscope.dyana.badge")}
                  </p>

                  <h3 className="card-title" style={{ marginBottom: 6 }}>
                    {t("horoscope.dyana.title")}
                  </h3>

                  <p className="card-text" style={{ marginBottom: 4, opacity: 0.9 }}>
                    {t("horoscope.dyana.subtitle")}
                  </p>

                  <DyanaAskCTA
                    open={diyanaOpen}
                    onClick={() => setDiyanaOpen((prev) => !prev)}
                    disabled={false}
                  />

                  {diyanaOpen && (
                    <div
                      style={{
                        marginTop: 16,
                        width: "100%",
                        height: 560,
                        borderRadius: 18,
                        overflow: "hidden",
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
                    {t("horoscope.dyana.note")}
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
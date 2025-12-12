"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { getToken, clearToken, getAnyAuthTokenAsync, ensureGuestToken } from "../../lib/authClient";

// ==========================
// COSTANTI GLOBALI
// ==========================

// ID Typebot (uguale a Tema/Sinastria)
const TYPEBOT_DYANA_ID = "diyana-ai";

// Base URL del backend AstroBot (Render → fallback locale)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE
  ? process.env.NEXT_PUBLIC_API_BASE
  : (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"))
  ? "http://127.0.0.1:8001"
  : "https://chatbot-test-0h4o.onrender.com";

// JWT di fallback (stesso del Tema)
const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

// Mappa costi crediti per periodo (allineata a OROSCOPO_FEATURE_COSTS lato backend)
const PERIOD_COSTS = {
  giornaliero: 1,
  settimanale: 2,
  mensile: 3,
  annuale: 5,
};

if (typeof window !== "undefined") {
  console.log("[DYANA][OROSCOPO] API_BASE runtime:", API_BASE);
}

// ==========================
// Helper decode JWT
// ==========================
function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("[DYANA][OROSCOPO] Errore decode JWT:", e);
    return null;
  }
}

// ==========================
// Helpers periodo
// ==========================
function mapPeriodoToSlug(periodo) {
  switch (periodo) {
    case "giornaliero":
      return "daily";
    case "settimanale":
      return "weekly";
    case "mensile":
      return "monthly";
    case "annuale":
      return "yearly";
    default:
      return "daily";
  }
}

// ==========================
// Costruzione testo interpretazione (nuovo schema AI)
// ==========================
function buildInterpretazioneTesto(oroscopoAi, tierRaw) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  const tier = (tierRaw || "free").toLowerCase();
  const isPremium = tier === "premium";
  const pieces = [];

  // 1) Intro / sintesi
  const intro =
    (oroscopoAi.intro ||
      oroscopoAi.sintesi_periodo ||
      oroscopoAi.sintesi ||
      "").trim();
  if (intro) {
    pieces.push(intro);
  }

  // 2) Macro-periodi (sottoperiodi)
  const macro =
    Array.isArray(oroscopoAi.macro_periods) && oroscopoAi.macro_periods.length > 0
      ? oroscopoAi.macro_periods
      : [];

  if (macro.length) {
    if (isPremium) {
      macro.forEach((mp, idx) => {
        if (!mp || typeof mp !== "object") return;
        const label =
          mp.label || mp.titolo || mp.title || `Sottoperiodo ${idx + 1}`;
        const range = mp.date_range;
        let rangeText = "";

        if (typeof range === "string") {
          rangeText = range;
        } else if (range && typeof range === "object") {
          const start = range.start || range.inizio || range.from;
          const end = range.end || range.fine || range.to;
          if (start && end) {
            rangeText = `${start} – ${end}`;
          }
        }

        const text =
          (mp.text || mp.testo || mp.testo_esteso || mp.sintesi || "").trim();
        if (!text) return;

        const header = rangeText ? `${label} (${rangeText})` : label;
        pieces.push(`${header}\n${text}`);
      });
    } else {
      // FREE → elenco dei sottoperiodi come “assaggio”
      const labels = macro
        .map((mp) => mp && (mp.label || mp.titolo || mp.title))
        .filter(Boolean);
      if (labels.length) {
        pieces.push(
          "Sottoperiodi principali:\n" +
            labels.map((l) => `• ${l}`).join("\n")
        );
      }
    }
  }

  // 3) Sezioni tematiche
  const sections = oroscopoAi.sections || {};
  const SECTION_LABELS = {
    panorama: "Panoramica generale",
    emozioni: "Emozioni e mondo interiore",
    relazioni: "Relazioni e vita affettiva",
    lavoro: "Lavoro, studio e progetti",
    energia: "Energia e benessere",
    opportunita: "Opportunità, sfide e consigli",
  };
  const orderedKeys = [
    "panorama",
    "emozioni",
    "relazioni",
    "lavoro",
    "energia",
    "opportunita",
  ];

  if (sections && typeof sections === "object") {
    const secPieces = [];

    orderedKeys.forEach((key) => {
      const rawVal = sections[key];
      if (!rawVal || typeof rawVal !== "string") return;
      const val = rawVal.trim();
      if (!val) return;
      const label = SECTION_LABELS[key] || key;

      if (isPremium) {
        secPieces.push(`${label}\n${val}`);
      } else {
        // FREE → solo titoli sintetici
        secPieces.push(`${label}: ${val}`);
      }
    });

    if (secPieces.length) {
      pieces.push(secPieces.join("\n\n"));
    }
  }

  // 4) Summary / CTA
  if (isPremium) {
    const summary = (oroscopoAi.summary || "").trim();
    if (summary) {
      pieces.push(summary);
    }
  } else {
    const cta = (oroscopoAi.cta || "").trim();
    const premiumMsg = (oroscopoAi.premium_message || "").trim();
    if (cta) pieces.push(cta);
    if (premiumMsg) pieces.push(premiumMsg);
  }

  if (!pieces.length) {
    return "Interpretazione non disponibile.";
  }

  return pieces.join("\n\n");
}

// ==========================
// COMPONENTI DI SUPPORTO: GRAFICO + TABELLA ASPETTI
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
    lavoro: "Lavoro / progetti",
    energia: "Energia",
  };

  const normalize = (val) => {
    if (typeof val !== "number" || !isFinite(val)) return 0;
    // assumiamo range [-1,1] → [0,100]
    const clamped = Math.max(-1, Math.min(1, val));
    return Math.round(((clamped + 1) / 2) * 100);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h4 className="card-subtitle">Andamento del periodo</h4>
      <p
        className="card-text"
        style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}
      >
        Ogni riga rappresenta un sottoperiodo del periodo scelto; i rettangoli
        mostrano l&apos;intensità media di emozioni, relazioni ed energia.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
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
              const intensities =
                metrics.intensities || metrics.raw_scores || {};

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
                    const val = intensities[a];
                    const perc = normalize(val);

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
                            background:
                              "linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
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

  return (
    <div style={{ marginTop: 24 }}>
      <h4 className="card-subtitle">Aspetti chiave del periodo</h4>
      <p
        className="card-text"
        style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 8 }}
      >
        Una selezione compatta degli aspetti più rilevanti che colorano questo
        periodo.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
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
              let tr = a.pianeta_transito || a.transit_planet || "";
              let nat = a.pianeta_natale || a.natal_planet || "";
              let asp = a.aspetto || a.tipo || "";
              const chiave = a.chiave || a.key || "";

              // Fallback: parsiamo la chiave tipo "Sole_congiunzione_Urano"
              if ((!tr || !nat || !asp) && typeof chiave === "string" && chiave) {
                const parts = chiave.split("_").filter(Boolean);
                if (parts.length >= 3) {
                  if (!tr) tr = parts[0];
                  if (!asp) asp = parts[1];
                  if (!nat) nat = parts[2];
                }
              }

              if (!tr) tr = "?";
              if (!asp) asp = "?";
              if (!nat) nat = "?";

              const intensita =
                a.intensita_discreta ||
                a.intensita ||
                a.intensity ||
                null;

              const pers = a.persistenza || {};
              const durataGiorni =
                pers.durata_giorni ??
                pers.durata ??
                pers.days ??
                null;
              const first =
                a.prima_occorrenza ||
                pers.data_inizio ||
                pers.start ||
                null;

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
                    {intensita || "-"}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {durataGiorni != null
                      ? `${durataGiorni} giorno${durataGiorni === 1 ? "" : "i"}`
                      : "-"}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {first || "-"}
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
// COMPONENTE PRINCIPALE
// ==========================
export default function OroscopoPage() {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
    periodo: "giornaliero",
    tier: "free",
  });

  const [oraIgnota, setOraIgnota] = useState(false);

  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");
  // ⇨ flag per errore "nessun credito"
  const [noCredits, setNoCredits] = useState(false);

  // Stato utente "globale"
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(2);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_oroscopo");

  // Billing restituito da /oroscopo_ai/{periodo}
  const [billing, setBilling] = useState(null);

  // DYANA
  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  // Sessione DYANA per questa pagina
  const [sessionId] = useState(() => `oroscopo_session_${Date.now()}`);

  // ======================================================
  // Token login (registrato) → aggiorna UI
  // ======================================================
  function refreshUserFromToken() {
    const token = getToken();

    // 👉 se NON c'è token login, NON forziamo i crediti
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_oroscopo");
      return;
    }

    const payload = decodeJwtPayload(token);
    const role = payload?.role || "free";
    setUserRole(role);

    const sub = payload?.sub;
    setUserIdForDyana(sub || "guest_oroscopo");

    // solo UI placeholder per utenti loggati
    if (role === "premium") {
      setUserCredits(10);
    } else {
      setUserCredits(2);
    }
  }

  useEffect(() => {
    // 1) Token login, se c'è
    refreshUserFromToken();

   // 2) Assicura token guest (se non loggato)
  ensureGuestToken();
  }, []);


  function handleLogout() {
    clearToken();
    setUserRole("guest");
    setUserCredits(2);
    setUserIdForDyana("guest_oroscopo");
    alert("Logout effettuato");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleOraIgnotaChange(e) {
    const checked = e.target.checked;
    setOraIgnota(checked);
    setForm((prev) => ({
      ...prev,
      ora: checked ? "" : prev.ora,
    }));
  }

  // ======================================================
  // Chiamata principale a /oroscopo_ai/{periodo}
  // ======================================================
  async function generaOroscopo() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    setRisultato(null);
    setBilling(null);
    setReadingId("");
    setReadingPayload(null);
    setKbTags([]);
    setDiyanaOpen(false); // chiudo DYANA quando rigenero
    // ⇨ azzero il flag noCredits a ogni nuova richiesta
    setNoCredits(false);
    try {
      const slug = mapPeriodoToSlug(form.periodo);

      const payload = {
        nome: form.nome || null,
        citta: form.citta,
        data: form.data, // "YYYY-MM-DD"
        ora: oraIgnota ? null : form.ora, // "HH:MM" o null se ora ignota
        email: null,
        domanda: null,
        tier: form.tier, // "free" o "premium"
      };

      // ✅ Token unico gestito da authClient.js (login o guest)
      let token = await getAnyAuthTokenAsync();

      // 3) Fallback finale: JWT statico
      if (!token && ASTROBOT_JWT_TEMA) {
        token = ASTROBOT_JWT_TEMA;
      }

      const headers = {
        "Content-Type": "application/json",
        "X-Client-Source": "dyana_web/oroscopo",
        "X-Client-Session": sessionId,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn(
          "[DYANA][OROSCOPO] Nessun token disponibile (login/guest/fallback)"
        );
      }

      console.log(
        "[DYANA][OROSCOPO] Token usato per /oroscopo_ai:",
        token ? token.slice(0, 25) : "NESSUN TOKEN"
      );

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

      if (!res.ok) {
        console.log("[DYANA /oroscopo_ai] status non OK:", res.status);
        console.log("[DYANA /oroscopo_ai] body errore:", data);

        const errorCode =
          data?.error_code || data?.code || data?.error || data?.detail;

        const isCreditsError =
          res.status === 402 ||
          res.status === 403 ||
          (typeof errorCode === "string" &&
            errorCode.toLowerCase().includes("credit"));

        let message =
          (data && (data.error || data.detail || data.message)) ||
          `Errore nella generazione dell'oroscopo (status ${res.status}).`;

        if (typeof message !== "string") {
          message =
            "Errore nella generazione dell'oroscopo. Riprova più tardi.";
        }

        // ⇨ caso specifico: nessun credito per lettura premium
        if (isCreditsError && form.tier === "premium") {
          setNoCredits(true);
          setErrore(message);
          setLoading(false);
          return;
        }

        // ⇨ errore generico
        setErrore(message);
        setLoading(false);
        return;
      }

      setRisultato(data);

      if (data && data.billing) {
        setBilling(data.billing);

        const remaining = data.billing.remaining_credits;
        if (typeof remaining === "number") {
          setUserCredits(remaining);

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("dyana:refresh-credits", {
                detail: {
                  feature: "oroscopo_ai",
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

      // Meta per DYANA
      const meta = data?.oroscopo_ai?.meta || {};
      const readingIdFromBackend =
        meta.reading_id ||
        meta.id ||
        `oroscopo_${slug}_${Date.now()}`;
      setReadingId(readingIdFromBackend);
      setReadingPayload(data);

      const kbFromBackend =
        meta.kb_tags || [`oroscopo_${slug}`, "oroscopo_ai"];
      setKbTags(kbFromBackend);
    } catch (err) {
      console.error("[DYANA /oroscopo_ai] errore fetch:", err);
      setErrore(
        "Impossibile comunicare con il server. Controlla la connessione e riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // Derivate per UI
  // ==========================
  const periodoKey =
    risultato?.engine_result?.periodo_ita || form.periodo || "giornaliero";

  const isPremium = form.tier === "premium";
  const currentCost =
    PERIOD_COSTS[form.periodo] != null ? PERIOD_COSTS[form.periodo] : 0;
  const premiumOptionLabel =
    currentCost > 0
      ? `Premium (${currentCost} credito${currentCost === 1 ? "" : "i"})`
      : "Premium";

  const tierFromResult =
    risultato?.oroscopo_ai?.meta?.tier || form.tier || "free";

  const testoInterpretazione = risultato
    ? buildInterpretazioneTesto(risultato.oroscopo_ai, tierFromResult)
    : "";

  const hasReading = !!testoInterpretazione;

  // Blocchi per grafico e tabella (dal payload_ai "light")
  const periodBlock =
    risultato?.payload_ai?.periodi &&
    risultato.payload_ai.periodi[periodoKey]
      ? risultato.payload_ai.periodi[periodoKey]
      : null;

  const metricheGrafico =
    periodBlock && periodBlock.metriche_grafico
      ? periodBlock.metriche_grafico
      : null;

  const aspettiRilevanti =
    periodBlock && Array.isArray(periodBlock.aspetti_rilevanti)
      ? periodBlock.aspetti_rilevanti
      : [];

  // ==========================
  // URL Typebot con parametri
  // ==========================
  const typebotUrl = useMemo(() => {
    const baseUrl = "https://typebot.co/dyana-ai";

    try {
      const params = new URLSearchParams();

      if (userIdForDyana) {
        params.set("user_id", userIdForDyana);
      }

      if (sessionId) {
        params.set("session_id", sessionId);
      }

      if (readingId) {
        params.set("reading_id", readingId);
      } else {
        params.set("reading_id", "oroscopo_inline");
      }

      params.set("reading_type", "oroscopo_ai");
      params.set(
        "reading_label",
        `Il tuo oroscopo (${periodoKey || "giorno"})`
      );

      const safeReadingText = (testoInterpretazione || "").slice(0, 6000);
      if (safeReadingText) {
        params.set("reading_text", safeReadingText);
      }

      const qs = params.toString();
      if (!qs) return baseUrl;
      return `${baseUrl}?${qs}`;
    } catch (e) {
      console.error("[DYANA][OROSCOPO] errore build URL Typebot:", e);
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, readingId, testoInterpretazione, periodoKey]);

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

      <section className="landing-wrapper">
        {/* INTESTAZIONE RICCA */}

        <header className="section">
          <h1 className="section-title">
            Oroscopo dinamico: giorno, settimana, mese, anno.
          </h1>
          <p className="section-subtitle">
            In questa pagina puoi esplorare il tuo{" "}
            <strong>Oroscopo personalizzato</strong>: inserisci i tuoi dati di
            nascita, scegli il <strong>periodo</strong> che ti interessa e
            decidi se usare la versione <strong>free</strong> o{" "}
            <strong>premium</strong>.
            <br />
            DYANA traduce il linguaggio dei pianeti in indicazioni chiare e
            utili per comprendere te stesso con più profondità.
            <br />
            <br />
            ✨ <strong>Vuoi andare oltre la lettura base?</strong>
            <br />
            Con la versione <strong>premium</strong>, puoi fare domande a DYANA
            e ottenere risposte personalizzate sulla tua mappa astrologica.
          </p>
        </header>
        {/* FORM */}
        <section className="section">
          <div
            className="card"
            style={{ maxWidth: "650px", margin: "0 auto" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Nome */}
              <div>
                <label className="card-text">Nome (opzionale)</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Come vuoi essere chiamato"
                />
              </div>

              {/* Città */}
              <div>
                <label className="card-text">Città di nascita</label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Es. Milano, Roma, Napoli…"
                />
              </div>

              {/* Data */}
              <div>
                <label className="card-text">Data di nascita</label>
                <input
                  type="date"
                  name="data"
                  value={form.data}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Ora + flag ora ignota */}
              <div>
                <label className="card-text">Ora di nascita</label>
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
                    style={
                      oraIgnota
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
                    <span>
                      Non conosco l&apos;ora esatta (uso un oroscopo con ora
                      neutra)
                    </span>
                  </label>
                </div>
              </div>

              {/* PERIODO */}
              <div>
                <label className="card-text">Periodo</label>
                <select
                  name="periodo"
                  value={form.periodo}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="giornaliero">Giornaliero</option>
                  <option value="settimanale">Settimanale</option>
                  <option value="mensile">Mensile</option>
                  <option value="annuale">Annuale</option>
                </select>
                <p
                  className="card-text"
                  style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 4 }}
                >
                  Scegli se vuoi una fotografia della giornata, della settimana,
                  del mese o dell&apos;anno.
                </p>
              </div>

              {/* TIER */}
              <div>
                <label className="card-text">Versione</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="free">Free (0 crediti)</option>
                  <option value="premium">{premiumOptionLabel}</option>
                </select>
                <p
                  className="card-text"
                  style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: 4 }}
                >
                  {form.tier === "premium" ? (
                    <>
                      Questa lettura{" "}
                      <strong>Premium</strong> per il periodo selezionato
                      richiede{" "}
                      <strong>
                        {currentCost} credito
                        {currentCost === 1 ? "" : "i"}
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      La versione <strong>Free</strong> non consuma crediti ed è
                      pensata come anteprima sintetica della lettura Premium.
                    </>
                  )}
                </p>
              </div>

              {/* Invio */}
              <button
                onClick={generaOroscopo}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Generazione..." : "Genera oroscopo con DYANA"}
              </button>

              {/* Errore */}
              {errore && (
                noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {userRole === "guest" ? (
                      <>
                        <p>
                          Hai usato i tuoi crediti di prova. Per continuare con
                          le letture premium{" "}
                          <Link href="/login" className="link">
                            iscriviti e ottieni altri crediti gratuiti
                          </Link>
                          .
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Hai finito i tuoi crediti. Per effettuare altre
                          letture premium{" "}
                          <Link href="/crediti" className="link">
                            vai alla pagina crediti
                          </Link>
                          .
                        </p>
                      </>
                    )}
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: "0.8rem",
                        opacity: 0.8,
                      }}
                    >
                      Dettagli: {errore}
                    </p>
                  </div>
                ) : (
                  <p className="card-text" style={{ color: "#ff9a9a" }}>
                    {errore}
                  </p>
                )
              )}
            </div>
          </div>
        </section>

        {/* RISULTATO – TESTO + GRAFICO + ASPETTI */}
        {hasReading && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Il tuo Oroscopo</h3>

              {/* Grafico + tabella aspetti (se disponibili) */}
              {metricheGrafico && (
                <MetricheGrafico metriche={metricheGrafico} />
              )}

              {aspettiRilevanti && aspettiRilevanti.length > 0 && (
                <AspettiTable aspetti={aspettiRilevanti} />
              )}

              <h4 className="card-subtitle" style={{ marginTop: 24 }}>
                Interpretazione
              </h4>
              <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {testoInterpretazione}
              </p>
            </div>
          </section>
        )}

        {/* BLOCCO DYANA */}
        {hasReading && (
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
                  DYANA • Q&amp;A sul tuo Oroscopo
                </p>

                {form.tier === "premium" ? (
                  <>
                    <h3 className="card-title" style={{ marginBottom: 6 }}>
                      Hai domande su questa lettura?
                    </h3>

                    <p
                      className="card-text"
                      style={{ marginBottom: 4, opacity: 0.9 }}
                    >
                      DYANA conosce già l&apos;oroscopo che hai appena generato
                      e può aiutarti a capire meglio cosa sta emergendo nel tuo
                      cielo in questo periodo.
                    </p>

                    <p
                      className="card-text"
                      style={{ fontSize: "0.9rem", opacity: 0.8 }}
                    >
                      Con questa lettura <strong>Premium</strong> hai a
                      disposizione{" "}
                      <strong>2 domande di chiarimento</strong> incluse.
                      Successivamente potrai usare i tuoi crediti per sbloccare
                      altre domande extra.
                    </p>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: 16 }}
                      onClick={() => {
                        setDiyanaOpen((prev) => !prev);
                      }}
                    >
                      {diyanaOpen ? "Chiudi DYANA" : "Chiedi a DYANA"}
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
                      DYANA risponde solo su questo oroscopo, non su altri
                      argomenti generici.
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
                    Hai domande su questa lettura? Effettua una lettura{" "}
                    <strong>Premium</strong> per fare domande a DYANA e ottenere
                    risposte personalizzate sul tuo oroscopo.
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

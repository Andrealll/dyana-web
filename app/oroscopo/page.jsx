//oroscopo

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { DyanaPopup } from "../../components/DyanaPopup";
import { getToken, clearToken } from "../../lib/authClient";

// ==========================
// COSTANTI GLOBALI
// ==========================

// ID Typebot (uguale al Tema)
const TYPEBOT_DYANA_ID = "diyana-ai";

// Base URL del backend AstroBot (Render → fallback locale)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE
  ? process.env.NEXT_PUBLIC_API_BASE
  : (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"))
  ? "http://127.0.0.1:8001"
  : "https://chatbot-test-0h4o.onrender.com";

// Base URL del servizio auth (astrobot_auth_pub, Render → fallback locale)
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE
  ? process.env.NEXT_PUBLIC_AUTH_BASE
  : (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"))
  ? "http://127.0.0.1:8002"
  : "https://astrobot-auth-pub.onrender.com";

// Storage key per il JWT guest
const GUEST_TOKEN_STORAGE_KEY = "diyana_guest_jwt";

// JWT di fallback (stesso del Tema, se presente)
const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

// Mappa costi crediti per periodo (allineata a OROSCOPO_FEATURE_COSTS lato backend)
const PERIOD_COSTS = {
  giornaliero: 1,
  settimanale: 2,
  mensile: 3,
  annuale: 5,
};

// Etichette per il grafico di intensità
const INTENSITY_LABELS = {
  energy: "Energia",
  emotions: "Emozioni",
  relationships: "Relazioni",
  work: "Lavoro",
  luck: "Fortuna",
};

// Singleton per evitare più chiamate parallele a /auth/anonymous
let guestTokenPromise = null;

if (typeof window !== "undefined") {
  console.log("[DYANA][OROSCOPO] API_BASE runtime:", API_BASE);
  console.log("[DYANA][OROSCOPO] AUTH_BASE runtime:", AUTH_BASE);
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
// FUNZIONE GUEST TOKEN SINGLETON
// ==========================
async function getGuestTokenSingleton() {
  if (typeof window === "undefined") return null;

  // 1) Se esiste in localStorage → lo usiamo sempre
  const stored = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  if (stored) {
    console.log(
      "[DYANA][OROSCOPO][GUEST] Uso token guest da localStorage:",
      stored.slice(0, 25)
    );
    return stored;
  }

  // 2) Se una richiesta è già in corso → riusiamo la stessa Promise
  if (guestTokenPromise) {
    console.log("[DYANA][OROSCOPO][GUEST] Riuso guestTokenPromise esistente");
    return guestTokenPromise;
  }

  // 3) Creiamo la promise una sola volta
  const base = AUTH_BASE.replace(/\/+$/, ""); // toglie eventuali slash finali
  const url = `${base}/auth/anonymous`;
  console.log(
    "[DYANA][OROSCOPO][GUEST] Nessun token LS, chiamo /auth/anonymous:",
    url
  );

  guestTokenPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(
          "[DYANA][OROSCOPO][GUEST] /auth/anonymous non OK:",
          res.status
        );
        return null;
      }
      const data = await res.json();
      const token = data?.access_token || data?.token;
      if (!token) {
        console.error(
          "[DYANA][OROSCOPO][GUEST] /auth/anonymous: token mancante nella risposta",
          data
        );
        return null;
      }
      window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
      console.log(
        "[DYANA][OROSCOPO][GUEST] Guest token inizializzato e salvato in LS:",
        token.slice(0, 25)
      );
      return token;
    } catch (err) {
      console.error(
        "[DYANA][OROSCOPO][GUEST] Errore chiamando /auth/anonymous:",
        err
      );
      return null;
    }
  })();

  const token = await guestTokenPromise;
  return token;
}

// ==========================
// Helpers periodo / intensità
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

function formatIntensity(value) {
  if (typeof value !== "number" || isNaN(value)) return 0;
  return Math.round(value * 100);
}

function estraiIntensita(engineResult) {
  try {
    const intensities =
      engineResult?.pipe?.metriche_grafico?.samples?.[0]?.metrics?.intensities;

    if (!intensities) return null;

    return {
      energy: formatIntensity(intensities.energy),
      emotions: formatIntensity(intensities.emotions),
      relationships: formatIntensity(intensities.relationships),
      work: formatIntensity(intensities.work),
      luck: formatIntensity(intensities.luck),
    };
  } catch {
    return null;
  }
}

function estraiInterpretazione(oroscopo_ai) {
  if (!oroscopo_ai) return null;

  const sintesi = oroscopo_ai.sintesi_periodo;
  const capitoli = Array.isArray(oroscopo_ai.capitoli)
    ? oroscopo_ai.capitoli
    : [];

  return { sintesi, capitoli };
}

// Info aggiuntive dal motore numerico (pipe / metriche)
function estraiInfoMetriche(engineResult) {
  if (!engineResult || typeof engineResult !== "object") return null;

  const engineVersion = engineResult.engine_version || null;
  const periodoIta = engineResult.periodo_ita || null;

  const pipe = engineResult.pipe || {};
  const metriche = pipe.metriche_grafico || {};
  const samples = Array.isArray(metriche.samples) ? metriche.samples : [];

  const nSamples = samples.length;

  let nAspettiTot = 0;
  let hasNAspetti = false;

  samples.forEach((s) => {
    const n =
      s?.metrics && typeof s.metrics.n_aspetti === "number"
        ? s.metrics.n_aspetti
        : null;
    if (typeof n === "number") {
      hasNAspetti = true;
      nAspettiTot += n;
    }
  });

  const nAspettiMedio =
    hasNAspetti && nSamples > 0
      ? Math.round(nAspettiTot / nSamples)
      : null;

  return {
    engineVersion,
    periodoIta,
    nSamples,
    nAspettiMedio,
  };
}

// Info di alto livello dal payload AI
function estraiInfoPayload(payloadAi) {
  if (!payloadAi || typeof payloadAi !== "object") return null;

  const topLevelKeys = Object.keys(payloadAi);
  const meta =
    payloadAi.meta && typeof payloadAi.meta === "object"
      ? payloadAi.meta
      : null;

  const lang = meta?.lang || meta?.language || null;
  const periodCode =
    payloadAi.period_code || meta?.period_code || meta?.period || null;

  return {
    lang: lang || null,
    periodCode: periodCode || null,
    sectionsCount: topLevelKeys.length,
  };
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

  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  // Stato utente "globale"
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(2);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_oroscopo");

  // Billing restituito da /oroscopo_ai/{periodo}
  const [billing, setBilling] = useState(null);

  // Stati per DYANA
  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  // Sessione DYANA per questa pagina (solo UI)
  const [sessionId] = useState(() => `oroscopo_session_${Date.now()}`);

  // ======================================================
  // Token login (registrato) → aggiorna UI
  // ======================================================
  function refreshUserFromToken() {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserCredits(2);
      setUserIdForDyana("guest_oroscopo");
      return;
    }

    const payload = decodeJwtPayload(token);
    const role = payload?.role || "free";
    setUserRole(role);

    const sub = payload?.sub;
    if (sub) {
      setUserIdForDyana(sub);
    } else {
      setUserIdForDyana("guest_oroscopo");
    }

    // Dummy credits in UI (reali arriveranno via /credits/state)
    if (role === "premium") {
      setUserCredits(10);
    } else if (role === "free") {
      setUserCredits(2);
    } else {
      setUserCredits(2);
    }
  }

  useEffect(() => {
    // 1) Token login, se c'è
    refreshUserFromToken();

    // 2) Inizializza guest token in background (singleton)
    getGuestTokenSingleton();
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

  // ======================================================
  // Chiamata principale a /oroscopo_ai/{periodo}
  // ======================================================
  async function generaOroscopo() {
    setLoading(true);
    setErrore("");
    setRisultato(null);
    setBilling(null);
    setReadingId("");
    setReadingPayload(null);
    setKbTags([]);

    try {
      const slug = mapPeriodoToSlug(form.periodo);

      const payload = {
        nome: form.nome || null,
        citta: form.citta,
        data: form.data, // "YYYY-MM-DD"
        ora: form.ora, // "HH:MM"
        email: null,
        domanda: null,
        tier: form.tier, // "free" o "premium"
      };

      // 1) Token di login, se esiste
      let token = getToken();

      // 2) Se non c'è login → usiamo il guest token SINGLETON
      if (!token) {
        const guest = await getGuestTokenSingleton();
        if (guest) {
          token = guest;
        }
      }

      // 3) Fallback finale: JWT statico da .env
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

        setErrore(
          (data && (data.error || data.detail)) ||
            `Errore nella generazione dell'oroscopo (status ${res.status}).`
        );
        setLoading(false);
        return;
      }

      setRisultato(data);

      if (data && data.billing) {
        setBilling(data.billing);
      } else {
        setBilling(null);
      }

      // Estraggo meta per DYANA (se presente)
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
  const intensita = risultato
    ? estraiIntensita(risultato.engine_result)
    : null;
  const interpretazione = risultato
    ? estraiInterpretazione(risultato.oroscopo_ai)
    : null;

  const metricsInfo = risultato
    ? estraiInfoMetriche(risultato.engine_result)
    : null;

  const payloadInfo = risultato
    ? estraiInfoPayload(risultato.payload_ai)
    : null;

  const periodoLabel =
    risultato?.engine_result?.periodo_ita || form.periodo || "giornaliero";

  const isPremium = form.tier === "premium";
  const currentCost =
    isPremium ? PERIOD_COSTS[form.periodo] || 0 : 0;

  // Testo per DYANA: sintesi + eventuali capitoli
  let readingTextForDyana = "";
  if (interpretazione?.sintesi) {
    readingTextForDyana += interpretazione.sintesi;
  }
  if (interpretazione?.capitoli?.length) {
    const extraParts = [];
    interpretazione.capitoli.forEach((cap, idx) => {
      const titolo = cap.titolo || `Capitolo ${idx + 1}`;
      const testo =
        cap.sintesi || cap.riassunto || cap.testo || "";
      if (testo) {
        extraParts.push(`${titolo}:\n${testo}`);
      }
    });
    if (extraParts.length > 0) {
      readingTextForDyana += "\n\n" + extraParts.join("\n\n");
    }
  }

  const hasReading = !!readingTextForDyana;

  return (
    <main className="page-root">
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={handleLogout}
      />

      <section className="landing-wrapper">
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">Genera il tuo Oroscopo</h1>
          <p className="section-subtitle">
            Seleziona il periodo e inserisci i tuoi dati di nascita: DYANA
            userà il motore AstroBot (<code>/oroscopo_ai</code>) per
            calcolare il tuo oroscopo, con interpretazione AI. Usa il campo
            Livello per testare le versioni free e premium.
          </p>
        </header>

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Nome */}
              <div>
                <label className="card-text">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  className="form-input"
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

              {/* Ora */}
              <div>
                <label className="card-text">Ora di nascita</label>
                <input
                  type="time"
                  name="ora"
                  value={form.ora}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Città */}
              <div>
                <label className="card-text">Luogo di nascita</label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Es. Napoli, IT"
                />
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
              </div>

              {/* TIER */}
              <div>
                <label className="card-text">Livello</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="free">Free (0 crediti)</option>
                  <option value="premium">Premium + DYANA</option>
                </select>
                <p
                  className="card-text"
                  style={{
                    fontSize: "0.75rem",
                    opacity: 0.75,
                    marginTop: 4,
                  }}
                >
                  Hai <strong>{userCredits}</strong> crediti disponibili.{" "}
                  L&apos;opzione selezionata userà{" "}
                  <strong>{currentCost}</strong> crediti.
                </p>
              </div>

              {/* Invio */}
              <button
                onClick={generaOroscopo}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Generazione..." : "Genera Oroscopo"}
              </button>

              {/* Errore */}
              {errore && (
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {errore}
                </p>
              )}

              {/* Billing info */}
              {billing && (
                <div
                  className="card-text"
                  style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: 8 }}
                >
                  <p>
                    Billing: <strong>{billing.mode}</strong> • Tier:{" "}
                    <strong>{billing.tier}</strong> • Scope:{" "}
                    <strong>{billing.scope}</strong>
                  </p>
                  {typeof billing.remaining_credits === "number" && (
                    <p>
                      Crediti rimanenti:{" "}
                      <strong>{billing.remaining_credits}</strong>
                    </p>
                  )}
                  <p>
                    Costo pagato:{" "}
                    <strong>{billing.cost_paid_credits || 0}</strong> crediti
                    pagati,{" "}
                    <strong>{billing.cost_free_credits || 0}</strong> crediti
                    free.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RISULTATO */}
        {risultato && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Il tuo Oroscopo</h3>

              {/* INTERPRETAZIONE */}
              <div style={{ marginBottom: "16px" }}>
                <h4 className="card-subtitle">Interpretazione</h4>
                {interpretazione?.sintesi ? (
                  <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                    {interpretazione.sintesi}
                  </p>
                ) : (
                  <p className="card-text">
                    Nessuna interpretazione testuale disponibile (campo
                    oroscopo_ai assente nella risposta).
                  </p>
                )}

                {/* Capitoli sintetici, se presenti */}
                {interpretazione?.capitoli &&
                  interpretazione.capitoli.length > 0 && (
                    <>
                      <div style={{ marginTop: "12px" }}>
                        <h5 className="card-subtitle">Capitoli principali</h5>
                        <ul
                          style={{
                            listStyle: "disc",
                            paddingLeft: "20px",
                          }}
                        >
                          {interpretazione.capitoli.map((cap, idx) => (
                            <li key={cap.id || idx} className="card-text">
                              <strong>
                                {cap.titolo || `Capitolo ${idx + 1}`} —{" "}
                              </strong>
                              {cap.sintesi ||
                                cap.riassunto ||
                                "Capitolo senza sintesi breve disponibile."}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Capitoli più lunghi */}
                      <div style={{ marginTop: "16px" }}>
                        <h5 className="card-subtitle">
                          Approfondimento capitoli
                        </h5>
                        {interpretazione.capitoli.map((cap, idx) => {
                          const titolo =
                            cap.titolo || `Capitolo ${idx + 1}`;
                          const testoLungo =
                            cap.testo || cap.testo_esteso || "";

                          if (!testoLungo) return null;

                          return (
                            <div
                              key={cap.id || `long_${idx}`}
                              style={{ marginTop: "8px" }}
                            >
                              <p
                                className="card-text"
                                style={{ fontWeight: 600 }}
                              >
                                {titolo}
                              </p>
                              <p
                                className="card-text"
                                style={{
                                  whiteSpace: "pre-wrap",
                                  fontSize: "0.9rem",
                                  opacity: 0.95,
                                }}
                              >
                                {testoLungo}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
              </div>

              {/* METRICHE TECNICHE */}
              <div style={{ marginTop: "16px" }}>
                <h4 className="card-subtitle">Panoramica tecnica</h4>
                <p className="card-text">
                  Periodo: {periodoLabel || "giornaliero"}
                </p>

                {intensita && (
                  <>
                    <p className="card-text">Intensità (0–100):</p>
                    <ul
                      style={{
                        listStyle: "none",
                        paddingLeft: 0,
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "4px 12px",
                      }}
                    >
                      <li className="card-text">
                        Energia: {intensita.energy}
                      </li>
                      <li className="card-text">
                        Emozioni: {intensita.emotions}
                      </li>
                      <li className="card-text">
                        Relazioni: {intensita.relationships}
                      </li>
                      <li className="card-text">
                        Lavoro: {intensita.work}
                      </li>
                      <li className="card-text">
                        Fortuna: {intensita.luck}
                      </li>
                    </ul>

                    {/* Grafico intensità */}
                    <div className="intensity-chart">
                      <h5
                        className="card-subtitle"
                        style={{ marginTop: "8px" }}
                      >
                        Grafico intensità
                      </h5>
                      <div className="intensity-chart-grid">
                        {["energy", "emotions", "relationships", "work", "luck"].map(
                          (key) => (
                            <div key={key} className="intensity-row">
                              <span className="intensity-label">
                                {INTENSITY_LABELS[key]}
                              </span>
                              <div className="intensity-bar-track">
                                <div
                                  className="intensity-bar-fill"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, intensita[key] ?? 0)
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="intensity-value">
                                {intensita[key] ?? 0}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* INFO MOTORE NUMERICO */}
              {metricsInfo && (
                <div style={{ marginTop: "16px" }}>
                  <h4 className="card-subtitle">Info dal motore AstroBot</h4>
                  <ul
                    className="card-text"
                    style={{ listStyle: "disc", paddingLeft: "20px" }}
                  >
                    {metricsInfo.periodoIta && (
                      <li>
                        Periodo astrologico considerato:{" "}
                          <strong>{metricsInfo.periodoIta}</strong>
                      </li>
                    )}
                    <li>
                      Snapshot analizzati:{" "}
                      <strong>{metricsInfo.nSamples}</strong>
                    </li>
                    {typeof metricsInfo.nAspettiMedio === "number" && (
                      <li>
                        Aspetti medi per snapshot:{" "}
                        <strong>{metricsInfo.nAspettiMedio}</strong>
                      </li>
                    )}
                    {metricsInfo.engineVersion && (
                      <li>
                        Versione motore:{" "}
                        <strong>{metricsInfo.engineVersion}</strong>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* INFO PAYLOAD AI */}
              {payloadInfo && (
                <div style={{ marginTop: "16px" }}>
                  <h4 className="card-subtitle">Info sul payload AI</h4>
                  <ul
                    className="card-text"
                    style={{ listStyle: "disc", paddingLeft: "20px" }}
                  >
                    {payloadInfo.lang && (
                      <li>
                        Lingua della lettura:{" "}
                        <strong>{payloadInfo.lang}</strong>
                      </li>
                    )}
                    {payloadInfo.periodCode && (
                      <li>
                        Codice periodo nel prompt:{" "}
                        <strong>{payloadInfo.periodCode}</strong>
                      </li>
                    )}
                    <li>
                      Sezioni nel payload:{" "}
                      <strong>{payloadInfo.sectionsCount}</strong>
                    </li>
                  </ul>
                </div>
              )}

              {/* RAW JSON */}
              <div style={{ marginTop: "18px" }}>
                <h4 className="card-subtitle">Dettaglio completo (raw JSON)</h4>
                <pre
                  className="card-text"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8rem",
                    maxHeight: "360px",
                    overflow: "auto",
                    marginTop: "8px",
                  }}
                >
                  {JSON.stringify(risultato, null, 2)}
                </pre>
              </div>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <Link href="/chat" className="btn btn-secondary">
                  Vai alla chat con DYANA
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* BLOCCO DYANA Q&A (solo se esiste una lettura testuale) */}
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

                <h3 className="card-title" style={{ marginBottom: 6 }}>
                  Hai domande su questa lettura?
                </h3>

                <p
                  className="card-text"
                  style={{ marginBottom: 4, opacity: 0.9 }}
                >
                  DYANA conosce già l&apos;oroscopo che hai appena generato e
                  può aiutarti a capire meglio cosa sta succedendo in questo
                  periodo.
                </p>

                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Come per il Tema Natale, avrai un numero limitato di domande
                  di chiarimento incluse con questo oroscopo, poi potrai usare i
                  tuoi crediti per sbloccarne di extra.
                </p>

                <div style={{ marginTop: 14 }}>
                  <DyanaPopup
                    typebotId={TYPEBOT_DYANA_ID}
                    userId={userIdForDyana}
                    sessionId={sessionId}
                    readingId={readingId || "oroscopo_inline"}
                    readingType="oroscopo_ai"
                    readingLabel={`Il tuo oroscopo (${periodoLabel})`}
                    readingText={readingTextForDyana}
                    readingPayload={readingPayload}
                    kbTags={kbTags}
                  />
                </div>

                <p
                  className="card-text"
                  style={{
                    marginTop: 8,
                    fontSize: "0.75rem",
                    opacity: 0.65,
                    textAlign: "right",
                  }}
                >
                  DYANA risponde solo su questo oroscopo, non su altri argomenti
                  generici.
                </p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

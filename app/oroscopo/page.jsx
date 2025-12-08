"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { getToken, clearToken } from "../../lib/authClient";

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

// JWT di fallback (stesso del Tema)
const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

// Mappa costi crediti per periodo (allineata a OROSCOPO_FEATURE_COSTS lato backend)
const PERIOD_COSTS = {
  giornaliero: 1,
  settimanale: 2,
  mensile: 3,
  annuale: 5,
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

  // 1) Se esiste in localStorage → lo usiamo
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
  const base = AUTH_BASE.replace(/\/+$/, "");
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

// Costruiamo UN TESTO LUNGO unico per l'interpretazione
function buildInterpretazioneTesto(oroscopoAi) {
  if (!oroscopoAi || typeof oroscopoAi !== "object") return "";

  const pieces = [];

  // 1) Sintesi principale / intro
  const main =
    oroscopoAi.sintesi_periodo ||
    oroscopoAi.sintesi ||
    oroscopoAi.intro ||
    "";
  if (main && main.trim()) {
    pieces.push(main.trim());
  }

  // 2) Periodi / capitoli (Periodo 1, 2, 3…)
  let capitoli = [];
  if (Array.isArray(oroscopoAi.capitoli) && oroscopoAi.capitoli.length > 0) {
    capitoli = oroscopoAi.capitoli;
  } else if (
    Array.isArray(oroscopoAi.macro_periods) &&
    oroscopoAi.macro_periods.length > 0
  ) {
    capitoli = oroscopoAi.macro_periods;
  }

  capitoli.forEach((cap, idx) => {
    const titolo =
      cap.titolo || cap.title || cap.label || `Periodo ${idx + 1}`;
    const testo =
      cap.testo ||
      cap.testo_esteso ||
      cap.testo_lungo ||
      cap.sintesi ||
      cap.riassunto ||
      "";
    if (!testo || !testo.trim()) return;

    pieces.push(`${titolo}\n${testo.trim()}`);
  });

  // 3) Fallback per la versione free (sections)
  if (!capitoli.length && oroscopoAi.sections) {
    const secObj = oroscopoAi.sections;
    Object.entries(secObj).forEach(([key, val]) => {
      if (typeof val !== "string" || !val.trim()) return;
      const label =
        key === "panorama"
          ? "Panoramica generale"
          : key.charAt(0).toUpperCase() + key.slice(1);
      pieces.push(`${label}\n${val.trim()}`);
    });
  }

  if (!pieces.length) {
    return "Interpretazione non disponibile.";
  }
  return pieces.join("\n\n");
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

    // dummy UI, i reali arrivano dalla dashboard/altro
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
    // 2) Inizializza guest token
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
    setDiyanaOpen(false); // chiudo DYANA quando rigenero

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

      // 2) Se non c'è login → guest token
      if (!token) {
        const guest = await getGuestTokenSingleton();
        if (guest) {
          token = guest;
        }
      }

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
  const periodoLabel =
    risultato?.engine_result?.periodo_ita || form.periodo || "giornaliero";

  const isPremium = form.tier === "premium";
  const currentCost = isPremium ? PERIOD_COSTS[form.periodo] || 0 : 0; // NON mostrato, ma lasciato per coerenza

  const testoInterpretazione = risultato
    ? buildInterpretazioneTesto(risultato.oroscopo_ai)
    : "";

  const hasReading = !!testoInterpretazione;

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
      params.set("reading_label", `Il tuo oroscopo (${periodoLabel})`);

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
  }, [userIdForDyana, sessionId, readingId, testoInterpretazione, periodoLabel]);

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
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">Genera il tuo Oroscopo</h1>
          <p className="section-subtitle">
            Seleziona il periodo che ti interessa e inserisci i tuoi dati di
            nascita: DYANA traduce il linguaggio dei pianeti in un oroscopo
            personalizzato, per aiutarti a capire che aria tira davvero nel tuo
            cielo in questo momento.
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
                {/* testo su crediti/costo rimosso */}
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

              {/* Billing info – lasciata solo in commento se ti serve per debug */}
              {/*
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
              */}
            </div>
          </div>
        </section>

        {/* RISULTATO – SOLO TESTO */}
        {hasReading && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Il tuo Oroscopo</h3>

              <h4 className="card-subtitle">Interpretazione</h4>
              <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {testoInterpretazione}
              </p>
            </div>
          </section>
        )}

        {/* BLOCCO DYANA – STESSA LOGICA DI TEMA/SINASTRIA */}
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
                  Come per il Tema Natale e la Sinastria, hai un numero limitato
                  di domande di chiarimento incluse con questo oroscopo. Poi
                  potrai usare i tuoi crediti per sbloccare domande extra.
                </p>

                {/* Bottone con gating premium */}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    if (!isPremium) return;
                    setDiyanaOpen((prev) => !prev);
                  }}
                  disabled={!isPremium}
                >
                  {diyanaOpen ? "Chiudi DYANA" : "Chiedi a DYANA"}
                </button>

                {/* Messaggio se NON è premium */}
                {!isPremium && (
                  <p
                    className="card-text"
                    style={{
                      marginTop: 8,
                      fontSize: "0.9rem",
                      opacity: 0.85,
                    }}
                  >
                    La chat con DYANA è disponibile solo per le letture{" "}
                    <strong>Premium</strong>, che includono domande di
                    approfondimento sul tuo oroscopo.
                  </p>
                )}

                {/* IFRAME solo se premium + aperto */}
                {diyanaOpen && isPremium && (
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
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

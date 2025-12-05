// COMPATIBILITÀ / SINASTRIA
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getToken, clearToken } from "../../lib/authClient";
import DyanaNavbar from "../../components/DyanaNavbar";

// ==========================
// COSTANTI GLOBALI
// ==========================

const TYPEBOT_DYANA_ID = "diyana-ai"; // allineato a Tema

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

// JWT di fallback (stesso di Tema)
const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

// Singleton per evitare più chiamate parallele a /auth/anonymous
let guestTokenPromise = null;

if (typeof window !== "undefined") {
  console.log("[DYANA/COMPAT] API_BASE runtime:", API_BASE);
  console.log("[DYANA/COMPAT] AUTH_BASE runtime:", AUTH_BASE);
}

// ==========================
// Helper decode JWT
// ==========================
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("[DYANA/COMPAT] Errore decode JWT:", e);
    return null;
  }
}

// ==========================
// FUNZIONE GUEST TOKEN SINGLETON
// ==========================
async function getGuestTokenSingleton() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  if (stored) {
    console.log(
      "[DYANA/COMPAT][GUEST] Uso token guest da localStorage:",
      stored.slice(0, 25)
    );
    return stored;
  }

  if (guestTokenPromise) {
    console.log("[DYANA/COMPAT][GUEST] Riuso guestTokenPromise esistente");
    return guestTokenPromise;
  }

  const base = AUTH_BASE.replace(/\/+$/, "");
  const url = `${base}/auth/anonymous`;
  console.log("[DYANA/COMPAT][GUEST] Nessun token LS, chiamo /auth/anonymous:", url);

  guestTokenPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(
          "[DYANA/COMPAT][GUEST] /auth/anonymous non OK:",
          res.status
        );
        return null;
      }
      const data = await res.json();
      const token = data?.access_token || data?.token;
      if (!token) {
        console.error(
          "[DYANA/COMPAT][GUEST] /auth/anonymous: token mancante nella risposta",
          data
        );
        return null;
      }
      window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
      console.log(
        "[DYANA/COMPAT][GUEST] Guest token inizializzato e salvato in LS:",
        token.slice(0, 25)
      );
      return token;
    } catch (err) {
      console.error(
        "[DYANA/COMPAT][GUEST] Errore chiamando /auth/anonymous:",
        err
      );
      return null;
    }
  })();

  const token = await guestTokenPromise;
  return token;
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
    typeof asp.orb === "number" && !Number.isNaN(asp.orb)
      ? asp.orb.toFixed(1)
      : null;

  const orbTxt = orbVal !== null ? ` (orb ${orbVal}°)` : "";
  const base = `${p1} ${tipo} ${p2}`.trim();

  return base + orbTxt;
}
// Restituisce una stringa tipo: "Sole in Leone 23.4°"
function formatPianetaPosizione(info, nomePianeta) {
  if (!info || typeof info !== "object") {
    return nomePianeta;
  }

  const segno =
    info.segno ||
    info.segno_zodiacale ||
    info.sign ||
    info.segno_breve ||
    "";

  let gradiNum = null;
  if (typeof info.gradi_segno === "number") {
    gradiNum = info.gradi_segno;
  } else if (typeof info.gradi === "number") {
    gradiNum = info.gradi;
  } else if (typeof info.degree === "number") {
    gradiNum = info.degree;
  }

  const gradiTxt =
    gradiNum !== null ? `${gradiNum.toFixed(1)}°` : "";

  if (segno && gradiTxt) {
    return `${nomePianeta} in ${segno} ${gradiTxt}`;
  }
  if (segno) {
    return `${nomePianeta} in ${segno}`;
  }
  if (gradiTxt) {
    return `${nomePianeta} ${gradiTxt}`;
  }
  return nomePianeta;
}
// ==========================
// COMPONENTE PRINCIPALE
// ==========================
export default function CompatibilitaPage() {
  const [form, setForm] = useState({
    nomeA: "",
    dataA: "",
    oraA: "",
    cittaA: "",
    nomeB: "",
    dataB: "",
    oraB: "",
    cittaB: "",
    tier: "free", // free / premium
  });

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");

  const [risultato, setRisultato] = useState(null); // JSON completo backend
  const [sinastriaAI, setSinastriaAI] = useState(null); // data.sinastria_ai
  const [billing, setBilling] = useState(null);

  // Stato utente per navbar
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(2);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_compat");

  // DYANA Q&A
  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  const [sessionId] = useState(() => `sinastria_session_${Date.now()}`);
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  // ======================================================
  // Token login (registrato) → aggiorna UI
  // ======================================================
  function refreshUserFromToken() {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserCredits(2);
      setUserIdForDyana("guest_compat");
      return;
    }

    const payload = decodeJwtPayload(token);
    const role = payload?.role || "free";
    setUserRole(role);

    const sub = payload?.sub;
    if (sub) {
      setUserIdForDyana(sub);
    } else {
      setUserIdForDyana("guest_compat");
    }

    if (role === "premium") {
      setUserCredits(10);
    } else if (role === "free") {
      setUserCredits(2);
    } else {
      setUserCredits(2);
    }
  }

  useEffect(() => {
    refreshUserFromToken();
    getGuestTokenSingleton();
  }, []);

  function handleLogout() {
    clearToken();
    setUserRole("guest");
    setUserCredits(2);
    setUserIdForDyana("guest_compat");
    alert("Logout effettuato");
  }

  // ======================================================
  // Handlers form
  // ======================================================
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Helper error backend
  function normalizeErrorMessage(data, status) {
    if (!data) {
      return `Errore nella generazione della compatibilità (status ${status}).`;
    }

    if (typeof data.error === "string") {
      return data.error;
    }

    const detail = data.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      const msgs = detail.map((d) => d.msg || JSON.stringify(d));
      return msgs.join(" | ");
    }
    if (detail && typeof detail === "object") {
      return detail.msg || JSON.stringify(detail);
    }

    return `Errore nella generazione della compatibilità (status ${status}).`;
  }

  // ======================================================
  // Chiamata principale a /sinastria_ai
  // ======================================================
  async function generaCompatibilita() {
    setLoading(true);
    setErrore("");
    setRisultato(null);
    setSinastriaAI(null);
    setBilling(null);
    setReadingId("");
    setReadingPayload(null);
    setKbTags([]);
    setDiyanaOpen(false);

    try {
      const payload = {
        A: {
          citta: form.cittaA,
          data: form.dataA,
          ora: form.oraA,
          nome: form.nomeA || null,
        },
        B: {
          citta: form.cittaB,
          data: form.dataB,
          ora: form.oraB,
          nome: form.nomeB || null,
        },
        tier: form.tier,
      };

      let token = getToken();

      if (!token) {
        const guest = await getGuestTokenSingleton();
        if (guest) {
          token = guest;
        }
      }

      if (!token && ASTROBOT_JWT_TEMA) {
        token = ASTROBOT_JWT_TEMA;
      }

      const headers = {
        "Content-Type": "application/json",
        "X-Client-Source": "dyana_web/compatibilita",
        "X-Client-Session": sessionId,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn(
          "[DYANA/COMPAT] Nessun token disponibile (login/guest/fallback)"
        );
      }

      console.log(
        "[DYANA/COMPAT] Token usato per /sinastria_ai:",
        token ? token.slice(0, 25) : "NESSUN TOKEN"
      );

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

      if (!res.ok) {
        console.log("[DYANA/COMPAT /sinastria_ai] status non OK:", res.status);
        console.log("[DYANA/COMPAT /sinastria_ai] body errore:", data);
        const message = normalizeErrorMessage(data, res.status);
        setErrore(message);
        setLoading(false);
        return;
      }

      setRisultato(data);

      const sin = data?.sinastria_ai || null;
      setSinastriaAI(sin);

      if (data && data.billing) {
        setBilling(data.billing);
      } else {
        setBilling(null);
      }

      // Metadati per DYANA
      const meta =
        (data && data.payload_ai && data.payload_ai.meta) ||
        (sin && sin.meta) ||
        {};
      const readingIdFromBackend =
        meta.reading_id || meta.id || `sinastria_${Date.now()}`;
      setReadingId(readingIdFromBackend);
      setReadingPayload(data);

      const kbFromBackend = meta.kb_tags || ["sinastria_ai"];
      setKbTags(kbFromBackend);
    } catch (err) {
      console.error("[DYANA/COMPAT /sinastria_ai] errore fetch:", err);
      setErrore(
        "Impossibile comunicare con il server. Controlla la connessione e riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // Estratti per grafico + 3 card
  // ======================================================
  const chartBase64 =
    risultato?.chart_sinastria_base64 || null;
  const sinRaw = risultato?.payload_ai?.sinastria || null;
  const temaA = sinRaw?.A || null;
  const temaB = sinRaw?.B || null;

  const aspettiPrincipali = Array.isArray(sinRaw?.sinastria?.top_stretti)
    ? sinRaw.sinastria.top_stretti
    : Array.isArray(sinRaw?.sinastria?.aspetti_AB)
    ? sinRaw.sinastria.aspetti_AB
    : [];

  // ======================================================
  // Testo da passare a DYANA Q&A
  // ======================================================
  const isPremium = form.tier === "premium";

  let readingTextForDyana = "";
  if (sinastriaAI) {
    const parts = [];

    if (sinastriaAI.sintesi_generale) {
      parts.push(`Sintesi generale:\n${sinastriaAI.sintesi_generale}`);
    }

    if (
      Array.isArray(sinastriaAI.aree_relazione) &&
      sinastriaAI.aree_relazione.length
    ) {
      const blocchi = sinastriaAI.aree_relazione.map((area) => {
        const titolo = area.titolo || area.id || "Area della relazione";
        const sintesi = area.sintesi || "";
        const header = `• ${titolo}`;
        return sintesi
          ? `${header}\n${sintesi}`
          : header;
      });
      parts.push("Capitoli della relazione:\n" + blocchi.join("\n\n"));
    }

    if (
      Array.isArray(sinastriaAI.punti_forza) &&
      sinastriaAI.punti_forza.length
    ) {
      parts.push(
        "Punti di forza:\n" +
          sinastriaAI.punti_forza.map((p) => `- ${p}`).join("\n")
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

    readingTextForDyana = parts.join("\n\n");
  }

  const hasReading = !!readingTextForDyana;

  // ==========================
  // URL Typebot
  // ==========================
  const typebotUrl = useMemo(() => {
    const baseUrl = "https://typebot.co/dyana-ai";

    try {
      const params = new URLSearchParams();

      if (userIdForDyana) params.set("user_id", userIdForDyana);
      if (sessionId) params.set("session_id", sessionId);
      if (readingId) {
        params.set("reading_id", readingId);
      } else {
        params.set("reading_id", "sinastria_inline");
      }

      params.set("reading_type", "sinastria");
      params.set("reading_label", "Compatibilità di coppia");

      const safeReadingText = (readingTextForDyana || "").slice(0, 6000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      const qs = params.toString();
      if (!qs) return baseUrl;
      return `${baseUrl}?${qs}`;
    } catch (e) {
      console.error("[DYANA/COMPAT] errore build URL Typebot:", e);
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, readingId, readingTextForDyana]);

  // ======================================================
  // RENDER
  // ======================================================
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
          <h1 className="section-title">Compatibilità di coppia</h1>
          <p className="section-subtitle">
            In questa pagina puoi esplorare la compatibilità astrologica tra
            due persone attraverso la sinastria: il confronto dei vostri temi
            natali per capire affinità, dinamiche e possibili sfide. DYANA
            traduce il linguaggio dei pianeti in indicazioni chiare e
            orientate alla relazione.
          </p>
        </header>

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* PERSONA A + PERSONA B */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "18px",
                }}
              >
                {/* PERSONA A */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>
                    Persona A
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div>
                      <label className="card-text">Nome</label>
                      <input
                        type="text"
                        name="nomeA"
                        value={form.nomeA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="card-text">Luogo di nascita</label>
                      <input
                        type="text"
                        name="cittaA"
                        value={form.cittaA}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Es. Napoli, IT"
                      />
                    </div>
                    <div>
                      <label className="card-text">Data di nascita</label>
                      <input
                        type="date"
                        name="dataA"
                        value={form.dataA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="card-text">Ora di nascita</label>
                      <input
                        type="time"
                        name="oraA"
                        value={form.oraA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* PERSONA B */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>
                    Persona B
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div>
                      <label className="card-text">Nome</label>
                      <input
                        type="text"
                        name="nomeB"
                        value={form.nomeB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="card-text">Luogo di nascita</label>
                      <input
                        type="text"
                        name="cittaB"
                        value={form.cittaB}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Es. Milano, IT"
                      />
                    </div>
                    <div>
                      <label className="card-text">Data di nascita</label>
                      <input
                        type="date"
                        name="dataB"
                        value={form.dataB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="card-text">Ora di nascita</label>
                      <input
                        type="time"
                        name="oraB"
                        value={form.oraB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVELLO */}
              <div>
                <label className="card-text">Livello</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="free">Free (0 crediti)</option>
                  <option value="premium">Premium + DYANA (3 crediti)</option>
                </select>
              </div>

              {/* BOTTONE */}
              <button
                onClick={generaCompatibilita}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Calcolo in corso..." : "Calcola compatibilità"}
              </button>

              {/* ERRORE */}
              {errore && (
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {errore}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* GRAFICO SINASTRIA + 3 CARD */}
        {chartBase64 && (
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
              <h3 className="card-title">Carta della vostra sinastria</h3>

              {/* grafico quadrato */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
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
                    src={`data:image/png;base64,${chartBase64}`}
                    alt="Carta di sinastria"
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

{/* 3 rettangoli: Tema A, Tema B, Aspetti */}
<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "24px",
  }}
>
  {/* TEMA A */}
  {temaA && (
    <div
      style={{
        flex: "0 0 24%",
        minWidth: "200px",
        backgroundColor: "#15191c",
        borderRadius: "12px",
        border: "1px solid #2c3238",
        padding: "16px",
      }}
    >
      <h4
        className="card-text"
        style={{ fontWeight: 600, marginBottom: 6 }}
      >
        Tema A
      </h4>

      {temaA.pianeti_decod &&
        typeof temaA.pianeti_decod === "object" && (
          <ul
            className="card-text"
            style={{
              marginTop: 6,
              paddingLeft: "1.2rem",
              fontSize: "0.8rem",
            }}
          >
            {Object.entries(temaA.pianeti_decod).map(
              ([nome, info]) => (
                <li key={nome}>
                  {formatPianetaPosizione(info, nome)}
                </li>
              )
            )}
          </ul>
        )}
    </div>
  )}

  {/* TEMA B */}
  {temaB && (
    <div
      style={{
        flex: "0 0 24%",
        minWidth: "200px",
        backgroundColor: "#15191c",
        borderRadius: "12px",
        border: "1px solid #2c3238",
        padding: "16px",
      }}
    >
      <h4
        className="card-text"
        style={{ fontWeight: 600, marginBottom: 6 }}
      >
        Tema B
      </h4>

      {temaB.pianeti_decod &&
        typeof temaB.pianeti_decod === "object" && (
          <ul
            className="card-text"
            style={{
              marginTop: 6,
              paddingLeft: "1.2rem",
              fontSize: "0.8rem",
            }}
          >
            {Object.entries(temaB.pianeti_decod).map(
              ([nome, info]) => (
                <li key={nome}>
                  {formatPianetaPosizione(info, nome)}
                </li>
              )
            )}
          </ul>
        )}
    </div>
  )}

  {/* ASPETTI TRA I VOSTRI PIANETI */}
  {aspettiPrincipali.length > 0 && (
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
      <h4
        className="card-text"
        style={{ fontWeight: 600, marginBottom: 6 }}
      >
        Aspetti tra i vostri pianeti
      </h4>
      <p
        className="card-text"
        style={{ fontSize: "0.8rem", opacity: 0.8 }}
      >
        Il motore AstroBot ha individuato{" "}
        <strong>{aspettiPrincipali.length}</strong> aspetti
        significativi tra i vostri temi natali. Qui sotto trovi una
        selezione sintetica.
      </p>

      <ul
        className="card-text"
        style={{
          marginTop: 6,
          paddingLeft: "1.2rem",
          fontSize: "0.8rem",
        }}
      >
        {aspettiPrincipali.slice(0, 10).map((asp, idx) => {
          const label =
            asp.descrizione || formatAspettoLabel(asp) || "";
          return <li key={idx}>{label}</li>;
        })}
      </ul>
    </div>
  )}


              </div>
            </div>
          </section>
        )}

        {/* TESTO AI: SINTESI + AREE + PUNTI */}
        {sinastriaAI?.sintesi_generale && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Sintesi della relazione</h3>
              <p
                className="card-text"
                style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}
              >
                {sinastriaAI.sintesi_generale}
              </p>
            </div>
          </section>
        )}

        {sinastriaAI?.aree_relazione &&
          sinastriaAI.aree_relazione.length > 0 && (
            <section className="section">
              <div
                className="card"
                style={{ maxWidth: "850px", margin: "0 auto" }}
              >
                <h3 className="card-title">Aree della relazione</h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    marginTop: 8,
                  }}
                >
                  {sinastriaAI.aree_relazione.map((area) => (
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
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: 6,
                          }}
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
                              Aspetti principali:
                            </p>
                            <ul
                              className="card-text"
                              style={{ paddingLeft: "1.2rem" }}
                            >
                              {area.aspetti_principali.map((asp, idx) => (
                                <li key={idx}>
                                  {asp.descrizione ||
                                    formatAspettoLabel(asp) ||
                                    ""}
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
                              Consigli pratici:
                            </p>
                            <ul
                              className="card-text"
                              style={{ paddingLeft: "1.2rem" }}
                            >
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

        {(sinastriaAI?.punti_forza ||
          sinastriaAI?.punti_criticita ||
          sinastriaAI?.consigli_finali) && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Focus principali della relazione</h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginTop: 8,
                }}
              >
                {Array.isArray(sinastriaAI?.punti_forza) &&
                  sinastriaAI.punti_forza.length > 0 && (
                    <div>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        Punti di forza
                      </h4>
                      <ul
                        className="card-text"
                        style={{ paddingLeft: "1.2rem" }}
                      >
                        {sinastriaAI.punti_forza.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(sinastriaAI?.punti_criticita) &&
                  sinastriaAI.punti_criticita.length > 0 && (
                    <div>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        Punti di attenzione
                      </h4>
                      <ul
                        className="card-text"
                        style={{ paddingLeft: "1.2rem" }}
                      >
                        {sinastriaAI.punti_criticita.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(sinastriaAI?.consigli_finali) &&
                  sinastriaAI.consigli_finali.length > 0 && (
                    <div>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        Consigli finali
                      </h4>
                      <ul
                        className="card-text"
                        style={{ paddingLeft: "1.2rem" }}
                      >
                        {sinastriaAI.consigli_finali.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* BLOCCO DYANA */}
        {hasReading && readingTextForDyana && (
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
                  DYANA • Q&amp;A sulla vostra compatibilità
                </p>

                <h3 className="card-title" style={{ marginBottom: 6 }}>
                  Hai domande su questa relazione?
                </h3>

                <p
                  className="card-text"
                  style={{ marginBottom: 4, opacity: 0.9 }}
                >
                  DYANA conosce già la sinastria che hai appena generato e può
                  aiutarti a capire meglio le dinamiche della vostra relazione.
                </p>

                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Con la versione <strong>Premium</strong> hai{" "}
                  <strong>2 domande di chiarimento</strong> incluse su questa
                  compatibilità. Poi potrai usare i tuoi crediti per sbloccare
                  altre domande extra.
                </p>

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

                {!isPremium && (
                  <p
                    className="card-text"
                    style={{
                      marginTop: 8,
                      fontSize: "0.9rem",
                      opacity: 0.85,
                    }}
                  >
                    La chat con DYANA è disponibile solo per le sinastrie{" "}
                    <strong>Premium</strong>, che includono 2 domande di
                    approfondimento sulla vostra relazione.
                  </p>
                )}

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
                  DYANA risponde solo su questa compatibilità, non su altri
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

"use client";

import { useState, useEffect } from "react";
import DyanaNavbar from "../../components/DyanaNavbar";
import { DyanaPopup } from "../../components/DyanaPopup";
import { getToken, clearToken } from "../../lib/authClient";

// ==========================
// COSTANTI GLOBALI
// ==========================

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

// JWT di fallback (stesso di tema, ultima spiaggia)
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

  // 1) Se esiste in localStorage → lo usiamo sempre
  const stored = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  // 2) Se una richiesta è già in corso → riusiamo la stessa Promise
  if (guestTokenPromise) {
    return guestTokenPromise;
  }

  // 3) Creiamo la promise una sola volta
  const base = AUTH_BASE.replace(/\/+$/, ""); // toglie eventuali slash finali
  const url = `${base}/auth/anonymous`;
  console.log("[DYANA/COMPAT] getGuestTokenSingleton URL:", url);

  guestTokenPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DYANA/COMPAT] /auth/anonymous non OK:", res.status);
        return null;
      }
      const data = await res.json();
      const token = data?.access_token || data?.token;
      if (!token) {
        console.error(
          "[DYANA/COMPAT] /auth/anonymous: token mancante nella risposta",
          data
        );
        return null;
      }
      window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
      console.log("[DYANA/COMPAT] Guest token inizializzato");
      return token;
    } catch (err) {
      console.error("[DYANA/COMPAT] Errore chiamando /auth/anonymous:", err);
      return null;
    } finally {
      // non azzeriamo guestTokenPromise: tiene in cache il risultato
    }
  })();

  const token = await guestTokenPromise;
  return token;
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
  const [risultato, setRisultato] = useState(null); // JSON completo
  const [sinastriaAI, setSinastriaAI] = useState(null); // risultato.sinastria_ai

  // Stato utente per navbar
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(2);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_compat");

  // billing (debug/logica interna)
  const [billing, setBilling] = useState(null);

  // Stati per DYANA Q&A
  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  // Sessione per questa pagina (per header X-Client-Session)
  const [sessionId] = useState(() => `compat_session_${Date.now()}`);

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
    // 1) Token login, se c'è
    refreshUserFromToken();
    // 2) Guest token in background
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
  // Handlers UI
  // ======================================================
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Helper per trasformare l'errore backend in stringa sicura
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
      // classico 422 di FastAPI: array di {type, loc, msg, input}
      const msgs = detail.map((d) => d.msg || JSON.stringify(d));
      return msgs.join(" | ");
    }
    if (detail && typeof detail === "object") {
      return detail.msg || JSON.stringify(detail);
    }

    return `Errore nella generazione della compatibilità (status ${status}).`;
  }

  // ======================================================
  // Chiamata principale a /sinastria_ai (backend AstroBot)
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

    try {
      const payload = {
        A: {
          citta: form.cittaA,
          data: form.dataA, // YYYY-MM-DD
          ora: form.oraA, // HH:MM
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

      // 1) Token di login, se esiste
      let token = getToken();

      // 2) Se non c'è login → guest token singleton
      if (!token) {
        const guest = await getGuestTokenSingleton();
        if (guest) {
          token = guest;
        }
      }

      // 3) Fallback finale: JWT statico (tema)
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
        console.log("[DYANA /sinastria_ai] status non OK:", res.status);
        console.log("[DYANA /sinastria_ai] body errore:", data);
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
      }

      // Metadati per DYANA (lettura Q&A)
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
      console.error("[DYANA /sinastria_ai] errore fetch:", err);
      setErrore(
        "Impossibile comunicare con il server. Controlla la connessione e riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // Testo da passare a DYANA Q&A
  // ======================================================
  let readingTextForDyana = "";
  if (sinastriaAI) {
    const parts = [];

    if (sinastriaAI.sintesi_generale) {
      parts.push(`Sintesi generale:\n${sinastriaAI.sintesi_generale}`);
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

    readingTextForDyana = parts.join("\n\n");
  }

  const hasReading = !!readingTextForDyana;

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
          <h1 className="section-title">Compatibilità di Coppia</h1>
          <p className="section-subtitle">
            Inserisci i dati di nascita delle due persone: DYANA userà il
            motore AI di AstroBot (<code>/sinastria_ai</code>) per valutare
            l&apos;affinità astrologica e restituire un quadro sintetico
            della relazione. Usa il campo Livello per testare le versioni
            free e premium.
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
              {/* BLOCCO PERSONA A + PERSONA B */}
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
                        placeholder="Es. Milano, IT"
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
                        placeholder="Es. Napoli, IT"
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
                  <option value="premium">Premium (3 crediti)</option>
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
                  <strong>{form.tier === "premium" ? 3 : 0}</strong> crediti.
                </p>
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

        {/* SINTESI GENERALE */}
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

        {/* AREE DELLA RELAZIONE */}
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
                        {area.titolo}
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

                      {/* Aspetti principali */}
                      {Array.isArray(area.aspetti_principali) &&
                        area.aspetti_principali.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <p
                              className="card-text"
                              style={{
                                fontWeight: 500,
                                marginBottom: 2,
                              }}
                            >
                              Aspetti principali:
                            </p>
                            <ul
                              className="card-text"
                              style={{ paddingLeft: "1.2rem" }}
                            >
                              {area.aspetti_principali.map((asp, idx) => (
                                <li key={idx}>{asp.descrizione}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Consigli pratici */}
                      {Array.isArray(area.consigli_pratici) &&
                        area.consigli_pratici.length > 0 && (
                          <div>
                            <p
                              className="card-text"
                              style={{
                                fontWeight: 500,
                                marginBottom: 2,
                              }}
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

        {/* PUNTI FORZA / CRITICITÀ / CONSIGLI FINALI */}
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
                {/* Punti di forza */}
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

                {/* Punti di criticità */}
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

                {/* Consigli finali */}
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

        {/* BLOCCO DYANA Q&A SULLA SINASTRIA */}
        {hasReading && readingPayload && (
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
                  aiutarti a capire meglio le dinamiche della relazione.
                </p>

                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Hai a disposizione <strong>2 domande di chiarimento</strong>{" "}
                  incluse con questa lettura. Poi potrai usare i tuoi crediti
                  per sbloccare altre domande extra.
                </p>

                <div style={{ marginTop: 14 }}>
                  <DyanaPopup
                    typebotId={TYPEBOT_DYANA_ID}
                    userId={userIdForDyana}
                    sessionId={sessionId}
                    readingId={readingId || "sinastria_inline"}
                    readingType="sinastria"
                    readingLabel="Compatibilità di coppia"
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
                  DYANA risponde solo su questa compatibilità, non su altri
                  argomenti generici.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* DEBUG COMPLETO */}
        {risultato && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Dettagli Sinastria (debug)</h3>
              <pre
                className="card-text"
                style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}
              >
                {JSON.stringify(risultato, null, 2)}
              </pre>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

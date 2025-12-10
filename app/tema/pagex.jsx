// TEMA_AI
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getToken, clearToken } from "../../lib/authClient";
import DyanaNavbar from "../../components/DyanaNavbar";

// ==========================
// COSTANTI GLOBALI
// ==========================

const TYPEBOT_DYANA_ID = "diyana-ai"; // per ora non usato ma lo teniamo

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

// JWT di fallback
const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

// Singleton per evitare più chiamate parallele a /auth/anonymous
let guestTokenPromise = null;

if (typeof window !== "undefined") {
  console.log("[DYANA] API_BASE runtime:", API_BASE);
  console.log("[DYANA] AUTH_BASE runtime:", AUTH_BASE);
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
    console.error("[DYANA] Errore decode JWT:", e);
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
      "[DYANA][GUEST] Uso token guest da localStorage:",
      stored.slice(0, 25)
    );
    return stored;
  }

  if (guestTokenPromise) {
    console.log("[DYANA][GUEST] Riuso guestTokenPromise esistente");
    return guestTokenPromise;
  }

  const base = AUTH_BASE.replace(/\/+$/, "");
  const url = `${base}/auth/anonymous`;
  console.log("[DYANA][GUEST] Nessun token LS, chiamo /auth/anonymous:", url);

  guestTokenPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error("[DYANA][GUEST] /auth/anonymous non OK:", res.status);
        return null;
      }
      const data = await res.json();
      const token = data?.access_token || data?.token;
      if (!token) {
        console.error(
          "[DYANA][GUEST] /auth/anonymous: token mancante nella risposta",
          data
        );
        return null;
      }
      window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
      console.log(
        "[DYANA][GUEST] Guest token inizializzato e salvato in LS:",
        token.slice(0, 25)
      );
      return token;
    } catch (err) {
      console.error("[DYANA][GUEST] Errore chiamando /auth/anonymous:", err);
      return null;
    }
  })();

  const token = await guestTokenPromise;
  return token;
}

// ==========================
// COMPONENTE PRINCIPALE
// ==========================
export default function TemaPage() {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
    tier: "free",
  });

  const [loading, setLoading] = useState(false);
  const [interpretazione, setInterpretazione] = useState("");
  const [contenuto, setContenuto] = useState(null);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  const [temaVis, setTemaVis] = useState(null);

  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(2);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_tema");

  const [billing, setBilling] = useState(null);

  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  const [sessionId] = useState(() => `tema_session_${Date.now()}`);
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  // Ora ignota
  const [oraIgnota, setOraIgnota] = useState(false);

  // ======================================================
  // Token login (registrato) → aggiorna UI
  // ======================================================
  function refreshUserFromToken() {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserCredits(2);
      setUserIdForDyana("guest_tema");
      return;
    }

    const payload = decodeJwtPayload(token);
    const role = payload?.role || "free";
    setUserRole(role);

    const sub = payload?.sub;
    if (sub) {
      setUserIdForDyana(sub);
    } else {
      setUserIdForDyana("guest_tema");
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
    setUserIdForDyana("guest_tema");
    alert("Logout effettuato");
  }

  // ======================================================
  // Chiamata principale a /tema_ai
  // ======================================================
  async function generaTema() {
    setLoading(true);
    setErrore("");
    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);
    setBilling(null);
    setTemaVis(null);
    setDiyanaOpen(false);

    try {
      const oraEffettiva = oraIgnota ? "12:00" : form.ora;

      const payload = {
        citta: form.citta,
        data: form.data,
        ora: oraEffettiva,
        nome: form.nome || null,
        tier: form.tier,
        ora_ignota: oraIgnota,
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
        "X-Client-Source": "dyana_web/tema",
        "X-Client-Session": sessionId,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn("[DYANA] Nessun token disponibile (login/guest/fallback)");
      }

      console.log(
        "[DYANA][TEMA] Token usato per /tema_ai:",
        token ? token.slice(0, 25) : "NESSUN TOKEN"
      );

      const res = await fetch(`${API_BASE}/tema_ai`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      let data = null;
      const text = await res.text();

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        console.log("[DYANA /tema_ai] status non OK:", res.status);
        console.log("[DYANA /tema_ai] body errore:", data);

        setErrore(
          (data && (data.error || data.detail)) ||
            `Errore nella generazione del tema (status ${res.status}).`
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

      const chartBase64 =
        data?.chart_png_base64 ||
        data?.tema_vis?.chart_png_base64 ||
        null;

      const graficoJson = data?.tema_vis?.grafico || null;

      const metaVis =
        (data?.tema_vis && data.tema_vis.meta) ||
        data?.tema_meta ||
        null;

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

      const content = data?.result?.content || null;
      setContenuto(content);

      const profiloGenerale = content?.profilo_generale || "";
      if (!profiloGenerale) {
        setInterpretazione(
          "Interpretazione non disponibile (profilo_generale vuoto)."
        );
      } else {
        setInterpretazione(profiloGenerale);
      }

      const meta = data?.result?.meta || {};
      const readingIdFromBackend =
        meta.reading_id || meta.id || `tema_${Date.now()}`;
      setReadingId(readingIdFromBackend);
      setReadingPayload(data);

      const kbFromBackend = meta.kb_tags || ["tema_natale"];
      setKbTags(kbFromBackend);
    } catch (err) {
      console.error("[DYANA /tema_ai] errore fetch:", err);
      setErrore(
        "Impossibile comunicare con il server. Controlla la connessione e riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // Mappa sezioni
  // ==========================
  const sectionLabels = {
    psicologia_profonda: "Psicologia profonda",
    amore_relazioni: "Amore e relazioni",
    lavoro_carriera: "Lavoro e carriera",
    fortuna_crescita: "Fortuna e crescita",
    talenti: "Talenti",
    sfide: "Sfide",
    consigli: "Consigli",
  };

  const isPremium = form.tier === "premium";

  let readingTextForDyana = interpretazione || "";
  if (isPremium && contenuto) {
    const extraParts = [];
    Object.entries(sectionLabels).forEach(([key, label]) => {
      const text = contenuto?.[key];
      if (text) {
        extraParts.push(`${label}:\n${text}`);
      }
    });
    if (extraParts.length > 0) {
      readingTextForDyana += "\n\n" + extraParts.join("\n\n");
    }
  }

  const hasReading = !!interpretazione;

  // ==========================
  // URL Typebot con parametri per il body
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
        params.set("reading_id", "tema_inline");
      }

      params.set("reading_type", "tema_natale");
      params.set("reading_label", "Il tuo Tema Natale");

      const safeReadingText = (readingTextForDyana || "").slice(0, 6000);
      if (safeReadingText) {
        params.set("reading_text", safeReadingText);
      }

      const qs = params.toString();
      if (!qs) return baseUrl;
      return `${baseUrl}?${qs}`;
    } catch (e) {
      console.error("[DYANA][TEMA] errore build URL Typebot:", e);
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, readingId, readingTextForDyana]);

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
          <h1 className="section-title">Calcola il tuo Tema Natale</h1>
          <p className="section-subtitle">
            In questa pagina puoi esplorare il tuo <strong>Tema Natale</strong>:
            compila i dati sotto e scegli se <strong>free</strong> o{" "}
            <strong>premium</strong>.
            <br />
            DYANA traduce il linguaggio dei pianeti in indicazioni chiare e
            utili per comprendere te stesso con più profondità.
            <br />
            <br />
            ✨ <strong>Vuoi andare oltre la lettura base?</strong>
            <br />
            Con la versione <strong>premium</strong>, puoi fare domande a
            DYANA e ottenere risposte personalizzate sulla tua mappa
            astrologica.
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
              <div>
                <label className="card-text">Nome (opzionale)</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={(e) =>
                    setForm({ ...form, nome: e.target.value })
                  }
                  className="form-input"
                  placeholder="Come vuoi che ti chiami DYANA?"
                />
              </div>

{/* RIGA DATA + ORA + ORA IGNOTA */}
<div className="form-row" style={{ display: "flex", gap: "16px" }}>
  <div className="form-field" style={{ flex: 1 }}>
    <label htmlFor="data_nascita" className="card-text">
      Data di nascita
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
      Ora di nascita
    </label>
    <input
      id="ora_nascita"
      type="time"
      className="form-input"
      value={form.ora || ""}
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
      onChange={(e) => {
        const checked = e.target.checked;
        setOraIgnota(checked);

        setForm((prev) => ({
          ...prev,
          // se ora ignota -> forziamo a "12:00" così si vede nel campo
          ora: checked ? "12:00" : prev.ora || "12:00",
        }));
      }}
    />
    <label htmlFor="ora_ignota" className="card-text">
      Ora ignota
    </label>
  </div>
</div>


              <div>
                <label className="card-text">Luogo di nascita</label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={(e) =>
                    setForm({ ...form, citta: e.target.value })
                  }
                  className="form-input"
                  placeholder="Es. Napoli, IT"
                />
              </div>

              <div>
                <label className="card-text">Livello</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={(e) =>
                    setForm({ ...form, tier: e.target.value })
                  }
                  className="form-input"
                >
                  <option value="free">Free (0 crediti)</option>
                  <option value="premium">
                    Premium + DYANA (2 crediti)
                  </option>
                </select>
              </div>

              <button
                onClick={generaTema}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Generazione..." : "Calcola Tema"}
              </button>

              {errore && (
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {errore}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* GRAFICO TEMA NATALE + BOX PIANETI/ASPETTI */}
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
              <h3 className="card-title">La tua carta del Tema Natale</h3>

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
                    src={`data:image/png;base64,${temaVis.chart_png_base64}`}
                    alt="Carta del Tema Natale"
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

              {/* BLOCCO PIANETI + ASPETTI AFFIANCATI */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginTop: "24px",
                }}
              >
                {/* Card Pianeti */}
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
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    Pianeti nel tema natale
                  </h3>

                  {temaVis?.pianeti && temaVis.pianeti.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
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
                          <span style={{ fontSize: "1.3rem" }}>
                            {p.glyph}
                          </span>
                          <span>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.7,
                      }}
                    >
                      Dati pianeti non disponibili nel payload.
                    </p>
                  )}
                </div>

                {/* Card Aspetti */}
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
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    Aspetti principali
                  </h3>

                  {temaVis?.aspetti && temaVis.aspetti.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
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
                          {/* simboli a sinistra */}
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
                          {/* testo completo */}
                          <div style={{ flex: 1 }}>{a.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.7,
                      }}
                    >
                      Dati aspetti non disponibili nel payload.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* INTERPRETAZIONE PRINCIPALE */}
        {interpretazione && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Interpretazione principale</h3>
              <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {interpretazione}
              </p>
            </div>
          </section>
        )}

        {/* SEZIONI DETTAGLIATE (solo premium) */}
        {isPremium && contenuto && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Sezioni dettagliate</h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {Object.entries(sectionLabels).map(([key, label]) => {
                  const text = contenuto?.[key];
                  if (!text) return null;
                  return (
                    <div key={key}>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
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
                  DYANA • Q&amp;A sul tuo Tema Natale
                </p>

                <h3 className="card-title" style={{ marginBottom: 6 }}>
                  Hai domande su questa lettura?
                </h3>

                <p
                  className="card-text"
                  style={{ marginBottom: 4, opacity: 0.9 }}
                >
                  DYANA conosce già il Tema che hai appena generato e può
                  aiutarti a capire meglio cosa sta emergendo nel tuo cielo
                  personale.
                </p>

                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Hai a disposizione <strong>2 domande di chiarimento</strong>{" "}
                  incluse con questo Tema. In seguito potrai usare i tuoi
                  crediti per sbloccare ulteriori domande extra.
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
                    <strong>Premium</strong>, che includono 2 domande di
                    approfondimento sul tuo Tema Natale.
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
                  DYANA risponde solo su questo Tema, non su altri argomenti
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

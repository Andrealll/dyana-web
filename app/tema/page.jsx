// TEMA_AI
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DyanaPopup } from "../../components/DyanaPopup";
import { getToken, clearToken } from "../../lib/authClient";
import DyanaNavbar from "../../components/DyanaNavbar";

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

    try {
      const payload = {
        citta: form.citta,
        data: form.data,
        ora: form.ora,
        nome: form.nome || null,
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
            Inserisci i tuoi dati di nascita: DYANA userà il motore AI di
            AstroBot (<code>/tema_ai</code>) per generare il tuo profilo
            astrologico. Usa il campo Livello per testare le versioni free e
            premium.
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
                <label className="card-text">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Data di nascita</label>
                <input
                  type="date"
                  name="data"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Ora di nascita</label>
                <input
                  type="time"
                  name="ora"
                  value={form.ora}
                  onChange={(e) => setForm({ ...form, ora: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Luogo di nascita</label>
                <input
                  type="text"
                  name="citta"
                  value={form.citta}
                  onChange={(e) => setForm({ ...form, citta: e.target.value })}
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
    <option value="premium">Premium + DYANA (2 crediti)</option>
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

                  {temaVis?.meta && (
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "0.8rem",
                        opacity: 0.9,
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {temaVis.meta.ascendente_segno && (
                        <div>
                          <strong>Ascendente:</strong>{" "}
                          {temaVis.meta.ascendente_segno}{" "}
                          {typeof temaVis.meta.ascendente_gradi_segno ===
                          "number"
                            ? `${temaVis.meta.ascendente_gradi_segno.toFixed(
                                1
                              )}°`
                            : ""}
                        </div>
                      )}
                      {temaVis.meta.mc_segno && (
                        <div>
                          <strong>Medio Cielo:</strong>{" "}
                          {temaVis.meta.mc_segno}{" "}
                          {typeof temaVis.meta.mc_gradi_segno === "number"
                            ? `${temaVis.meta.mc_gradi_segno.toFixed(1)}°`
                            : ""}
                        </div>
                      )}
                    </div>
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
                          {/* testo completo: es. "Plutone trigono Lilith (orb 0,2°)" */}
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

                <div style={{ marginTop: 14 }}>
                  <DyanaPopup
                    typebotId={TYPEBOT_DYANA_ID}
                    userId={userIdForDyana}
                    sessionId={sessionId}
                    readingId={readingId || "tema_inline"}
                    readingType="tema_natale"
                    readingLabel="Il tuo Tema Natale"
                    readingText={readingTextForDyana}
                    readingPayload={readingPayload}
                    kbTags={kbTags}
                    // 🔹 qui abilitiamo / disabilitiamo il bottone
                    isPremium={isPremiumReading}
                    questionsIncluded={2}
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

// COMPATIBILITÀ / SINASTRIA
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getToken, clearToken, getAnyAuthToken } from "../../lib/authClient";
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

// JWT di fallback (stesso di Tema)
const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

if (typeof window !== "undefined") {
  console.log("[DYANA/COMPAT] API_BASE runtime:", API_BASE);
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

// Pianeta in legenda: "Sole in Leone 23.4° – Casa 10"
function formatPianetaPosizione(info) {
  if (!info || typeof info !== "object") return "";

  const nome = info.nome || info.planet || info.pianeta || "?";
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

  const gradiTxt = gradiNum !== null ? `${gradiNum.toFixed(1)}°` : "";
  const casa = typeof info.casa === "number" ? info.casa : null;

  let base = nome;
  if (segno && gradiTxt) {
    base = `${nome} in ${segno} ${gradiTxt}`;
  } else if (segno) {
    base = `${nome} in ${segno}`;
  } else if (gradiTxt) {
    base = `${nome} ${gradiTxt}`;
  }

  if (casa !== null) {
    return `${base} – Casa ${casa}`;
  }
  return base;
}

// ==========================
// COMPONENTE PRINCIPALE
// ==========================
export default function CompatibilitaPage() {
  const [form, setForm] = useState({
    nomeA: "",
    dataA: "",
    oraA: "",
    oraAIgnota: false,
    cittaA: "",
    nomeB: "",
    dataB: "",
    oraB: "",
    oraBIgnota: false,
    cittaB: "",
    tier: "free", // free / premium
  });

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [noCredits, setNoCredits] = useState(false);

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

    // Nota: i crediti reali arrivano dal backend (billing.remaining_credits).
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
    setNoCredits(false);
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
          ora: form.oraAIgnota ? "" : form.oraA,
          nome: form.nomeA || null,
          ora_ignota: form.oraAIgnota,
        },
        B: {
          citta: form.cittaB,
          data: form.dataB,
          ora: form.oraBIgnota ? "" : form.oraB,
          nome: form.nomeB || null,
          ora_ignota: form.oraBIgnota,
        },
        tier: form.tier,
      };

      let token = getAnyAuthToken();

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

        const isNoCreditsError =
          (res.status === 402 || res.status === 403) && form.tier === "premium";

        setNoCredits(isNoCreditsError);
        setErrore(message);
        setLoading(false);
        return;
      }

      setRisultato(data);

      const sin = data?.sinastria_ai || null;
      setSinastriaAI(sin);

      // Billing + aggiornamento crediti navbar + eventi globali
      if (data && data.billing) {
        setBilling(data.billing);

        const remaining = data.billing.remaining_credits;
        if (typeof remaining === "number") {
          setUserCredits(remaining);

          if (typeof window !== "undefined") {
            // evento "storico"
            window.dispatchEvent(
              new CustomEvent("dyana-credits-updated", {
                detail: {
                  feature: "sinastria_ai",
                  remaining_credits: remaining,
                  billing_mode: data.billing.mode,
                },
              })
            );
            // nuovo evento richiesto
            window.dispatchEvent(
              new CustomEvent("dyana:refresh-credits", {
                detail: {
                  feature: "sinastria_ai",
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
  // Estratti per grafico + card (usa sinastria_vis)
  // ======================================================
  const chartBase64 = risultato?.chart_sinastria_base64 || null;
  const sinVis = risultato?.sinastria_vis || null;
  const temaVisA = sinVis?.A || null;
  const temaVisB = sinVis?.B || null;
  const aspettiPrincipali = Array.isArray(sinVis?.aspetti_top)
    ? sinVis.aspetti_top
    : [];

  const nomeA = temaVisA?.nome || form.nomeA || "Persona A";
  const nomeB = temaVisB?.nome || form.nomeB || "Persona B";

  // Flag ora ignota da payload (se presente) o da form
  const payloadMeta = risultato?.payload_ai?.meta || {};
  const oraIgnotaAFromPayload = !!payloadMeta.ora_ignota_A;
  const oraIgnotaBFromPayload = !!payloadMeta.ora_ignota_B;
  const oraIgnotaGlobal =
    oraIgnotaAFromPayload ||
    oraIgnotaBFromPayload ||
    form.oraAIgnota ||
    form.oraBIgnota;

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

    // Nuova struttura: capitoli[]
    if (
      Array.isArray(sinastriaAI.capitoli) &&
      sinastriaAI.capitoli.length > 0
    ) {
      const blocchi = sinastriaAI.capitoli.map((cap, idx) => {
        const titolo = cap.titolo || `Capitolo ${idx + 1}`;
        const testo = cap.testo || "";
        return testo ? `• ${titolo}\n${testo}` : `• ${titolo}`;
      });
      parts.push("Capitoli della relazione:\n" + blocchi.join("\n\n"));
    } else if (
      Array.isArray(sinastriaAI.aree_relazione) &&
      sinastriaAI.aree_relazione.length
    ) {
      // Fallback vecchia struttura
      const blocchi = sinastriaAI.aree_relazione.map((area) => {
        const titolo = area.titolo || area.id || "Area della relazione";
        const sintesi = area.sintesi || "";
        const header = `• ${titolo}`;
        return sintesi ? `${header}\n${sintesi}` : header;
      });
      parts.push("Aree della relazione:\n" + blocchi.join("\n\n"));
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
            <br />
            <br />
            Compila i dati sotto e scegli se{" "}
            <strong>free</strong> o <strong>premium</strong>.
            <br />
            <br />
            ✨ <strong>Vuoi andare oltre la lettura base?</strong>
            <br />
            Con la versione <strong>premium</strong>, puoi fare domande a DYANA
            e ottenere risposte personalizzate sulla vostra relazione.
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
                        disabled={form.oraAIgnota}
                      />
                      <label
                        className="card-text"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 4,
                          fontSize: "0.85rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.oraAIgnota}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              oraAIgnota: e.target.checked,
                              oraA: e.target.checked ? "" : prev.oraA,
                            }))
                          }
                        />
                        Ora di nascita sconosciuta
                      </label>
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
                        disabled={form.oraBIgnota}
                      />
                      <label
                        className="card-text"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 4,
                          fontSize: "0.85rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.oraBIgnota}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              oraBIgnota: e.target.checked,
                              oraB: e.target.checked ? "" : prev.oraB,
                            }))
                          }
                        />
                        Ora di nascita sconosciuta
                      </label>
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
                noCredits ? (
                  <div className="card-text" style={{ color: "#ffdf9a" }}>
                    {userRole === "guest" ? (
                      <>
                        <p>
                          Hai usato i tuoi crediti di prova. Per continuare con
                          le letture premium{" "}
                          <Link href="/iscriviti" className="link">
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

        {/* GRAFICO SINASTRIA + CARD DATI */}
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

              <p
                className="card-text"
                style={{ fontSize: "0.85rem", opacity: 0.9 }}
              >
                Questo è il grafico che sovrappone i vostri pianeti: internamente
                quelli di <strong>{nomeA}</strong> ed esternamente quelli di{" "}
                <strong>{nomeB}</strong>. Le linee e i cerchi evidenziati
                rappresentano gli aspetti tra i vostri pianeti.
              </p>

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

              <p
                className="card-text"
                style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: 8 }}
              >
                Questi dati riportano la sintesi astrologica del grafico con i
                dati specifici di <strong>{nomeA}</strong> e{" "}
                <strong>{nomeB}</strong> e gli aspetti reciproci.
              </p>

              {/* 3 rettangoli: Tema A, Tema B, Aspetti */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginTop: "12px",
                }}
              >
                {/* TEMA A */}
                {temaVisA && Array.isArray(temaVisA.pianeti) && (
                  <div
                    style={{
                      flex: "0 0 22%",
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
                      {nomeA}
                    </h4>
                    {temaVisA.citta && (
                      <p
                        className="card-text"
                        style={{ fontSize: "0.75rem", opacity: 0.8 }}
                      >
                        {temaVisA.citta}
                      </p>
                    )}

                    <ul
                      className="card-text"
                      style={{
                        marginTop: 6,
                        paddingLeft: "1.2rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {temaVisA.pianeti.map((p, idx) => (
                        <li key={idx}>{formatPianetaPosizione(p)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* TEMA B */}
                {temaVisB && Array.isArray(temaVisB.pianeti) && (
                  <div
                    style={{
                      flex: "0 0 22%",
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
                      {nomeB}
                    </h4>
                    {temaVisB.citta && (
                      <p
                        className="card-text"
                        style={{ fontSize: "0.75rem", opacity: 0.8 }}
                      >
                        {temaVisB.citta}
                      </p>
                    )}

                    <ul
                      className="card-text"
                      style={{
                        marginTop: 6,
                        paddingLeft: "1.2rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {temaVisB.pianeti.map((p, idx) => (
                        <li key={idx}>{formatPianetaPosizione(p)}</li>
                      ))}
                    </ul>
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
                      Qui trovi gli aspetti principali che collegano il tema di{" "}
                      <strong>{nomeA}</strong> con quello di{" "}
                      <strong>{nomeB}</strong>.
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
                          asp.descrizione ||
                          asp.label ||
                          formatAspettoLabel(asp) ||
                          "";
                        return <li key={idx}>{label}</li>;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TESTO AI: SINTESI + CAPITOLI */}
        {sinastriaAI?.sintesi_generale && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Sintesi della relazione</h3>

              {oraIgnotaGlobal && (
                <p
                  className="card-text"
                  style={{
                    marginTop: "6px",
                    fontSize: "0.85rem",
                    color: "#ffdf9a",
                  }}
                >
                  Ascendente e case astrologiche non sono state calcolate e
                  incluse nell&apos;analisi perché l&apos;ora di nascita non è
                  stata indicata con precisione.
                </p>
              )}

              <p
                className="card-text"
                style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}
              >
                {sinastriaAI.sintesi_generale}
              </p>
            </div>
          </section>
        )}

        {/* NUOVA STRUTTURA: CAPITOLI */}
        {Array.isArray(sinastriaAI?.capitoli) &&
          sinastriaAI.capitoli.length > 0 && (
            <section className="section">
              <div
                className="card"
                style={{ maxWidth: "850px", margin: "0 auto" }}
              >
                <h3 className="card-title">Capitoli di approfondimento</h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    marginTop: 8,
                  }}
                >
                  {sinastriaAI.capitoli.map((cap, idx) => (
                    <div key={idx}>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        {cap.titolo || `Capitolo ${idx + 1}`}
                      </h4>
                      {cap.testo && (
                        <p
                          className="card-text"
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: 6,
                          }}
                        >
                          {cap.testo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        {/* Fallback vecchia struttura: aree_relazione */}
        {!(
          Array.isArray(sinastriaAI?.capitoli) &&
          sinastriaAI.capitoli.length > 0
        ) &&
          sinastriaAI?.aree_relazione &&
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

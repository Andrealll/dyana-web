// app/tema/page.jsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";

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
// COSTANTI GLOBALI
// ==========================
const TYPEBOT_DYANA_ID = "diyana-ai";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8001"
    : "https://chatbot-test-0h4o.onrender.com");

const ASTROBOT_JWT_TEMA = process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

if (typeof window !== "undefined") {
  console.log("[DYANA] API_BASE runtime:", API_BASE);
}

// ==========================
// Helper decode JWT
// ==========================
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

// ==========================
// NORMALIZZAZIONE CAPITOLI
// ==========================
function normalizeCapitoli(capitoliRaw) {
  if (!capitoliRaw) return [];
  if (Array.isArray(capitoliRaw)) return capitoliRaw;

  if (typeof capitoliRaw === "object") {
    return Object.entries(capitoliRaw).map(([titolo, testo]) => ({
      chiave: String(titolo).toLowerCase().replace(/\s+/g, "_"),
      titolo,
      testo,
    }));
  }
  return [];
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
  });

  const [oraIgnota, setOraIgnota] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [noCredits, setNoCredits] = useState(false);

  const [interpretazione, setInterpretazione] = useState("");
  const [contenuto, setContenuto] = useState(null);
  const [risultato, setRisultato] = useState(null);
  const [temaVis, setTemaVis] = useState(null);

  const [billing, setBilling] = useState(null);

  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  const [sessionId] = useState(() => `tema_session_${Date.now()}`);
  const [diyanaOpen, setDiyanaOpen] = useState(false);

  // ===== UX allineata a Oroscopo: free sempre sopra, premium sotto =====
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  // ===== Navbar/credits state (allineato a /credits/state) =====
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_tema");

  // trial guest 1/0 (o null se non disponibile)
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  // Email gate inline (allineato a Oroscopo)
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("register"); // register | login
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  // Consenso marketing: prefleggato a sì
  const [gateMarketing, setGateMarketing] = useState(true);

  const isLoggedIn = !!getToken();
  const isPremium = premiumLoaded;

  // ==========================
  // Mappa sezioni (legacy)
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

  const capitoliArray = normalizeCapitoli(contenuto?.capitoli);

  // ==========================
  // Testo passato a DYANA (Q&A)
  // ==========================
  let readingTextForDyana = interpretazione || "";

  if (contenuto) {
    if (isPremium && capitoliArray.length > 0) {
      const extraParts = [];
      capitoliArray.forEach((cap, idx) => {
        const titolo = cap.titolo || `Capitolo ${idx + 1}`;
        const testo = cap.testo || cap.contenuto || cap.testo_breve || "";
        if (testo) extraParts.push(`${titolo}:\n${testo}`);
      });
      if (extraParts.length > 0) {
        readingTextForDyana += (readingTextForDyana ? "\n\n" : "") + extraParts.join("\n\n");
      }
    } else if (isPremium) {
      const extraParts = [];
      Object.entries(sectionLabels).forEach(([key, label]) => {
        const text = contenuto?.[key];
        if (text) extraParts.push(`${label}:\n${text}`);
      });
      if (extraParts.length > 0) {
        readingTextForDyana += (readingTextForDyana ? "\n\n" : "") + extraParts.join("\n\n");
      }
    }
  }

  const hasReading = !!interpretazione;

  // ======================================================
  // Refresh user/credits (allineato Oroscopo)
  // ======================================================
  const refreshUserFromToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_tema");
      return;
    }
    const payload = decodeJwtPayload(token);
    setUserRole(payload?.role || "free");
    setUserIdForDyana(payload?.sub || "guest_tema");
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
      console.warn("[TEMA] refreshCreditsUI failed:", e?.message || e);
    }
  }, []);

  useEffect(() => {
    refreshUserFromToken();
    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }, [refreshUserFromToken, refreshCreditsUI]);

  function handleLogout() {
    clearToken();
    setUserRole("guest");
    setUserCredits(0);
    setUserIdForDyana("guest_tema");
    setGuestTrialLeft(null);

    setPremiumLoaded(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setDiyanaOpen(false);

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }

  // ======================================================
  // CALL /tema_ai
  // ======================================================
  async function callTema({ tier }) {
    const oraEffettiva = oraIgnota ? null : (form.ora || "");

    const payload = {
      citta: form.citta,
      data_nascita: form.data,
      ora_nascita: oraEffettiva,
      nome: form.nome || null,
      tier, // free | premium
      ora_ignota: oraIgnota,
    };

    let token = await getAnyAuthTokenAsync();
    if (!token && ASTROBOT_JWT_TEMA) token = ASTROBOT_JWT_TEMA;

    const headers = {
      "Content-Type": "application/json",
      "X-Client-Source": "dyana_web/tema",
      "X-Client-Session": sessionId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/tema_ai`, {
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

    return { res, data };
  }

  // ======================================================
  // Apply response (parsing invariato)
  // ======================================================
  function applyTemaResponse(data) {
    setRisultato(data);

    if (data?.billing) {
      setBilling(data.billing);
      const remaining = data.billing.remaining_credits;
      if (typeof remaining === "number") {
        setUserCredits(remaining);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dyana-credits-updated", {
              detail: {
                feature: "tema_ai",
                remaining_credits: remaining,
                billing_mode: data.billing.mode,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("dyana:refresh-credits", {
              detail: {
                feature: "tema_ai",
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

    const chartBase64 = data?.chart_png_base64 || data?.tema_vis?.chart_png_base64 || null;
    const graficoJson = data?.tema_vis?.grafico || null;

    const metaVis = (data?.tema_vis && data.tema_vis.meta) || data?.tema_meta || null;
    const pianetiVis = data?.tema_vis?.pianeti || [];
    const aspettiVis = data?.tema_vis?.aspetti || [];

    if (chartBase64 || graficoJson || metaVis || pianetiVis.length > 0 || aspettiVis.length > 0) {
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

// ---- Parsing robusto (supporta più shape di response) ----

// content può arrivare in vari posti a seconda del backend
const content =
  data?.result?.content ||
  data?.tema_ai?.content ||
  data?.content ||
  data?.result ||
  data?.tema_ai ||
  null;

setContenuto(content);

// interpretazione: prova più chiavi possibili
const profiloGenerale =
  content?.profilo_generale ||
  content?.interpretazione ||
  data?.tema_ai?.profilo_generale ||
  data?.result?.content?.profilo_generale ||
  "";

setInterpretazione(
  profiloGenerale || "Interpretazione non disponibile (profilo_generale vuoto)."
);

// meta può arrivare in result.meta oppure in payload_ai.meta oppure in tema_ai.meta
const meta =
  data?.result?.meta ||
  data?.payload_ai?.meta ||
  data?.tema_ai?.meta ||
  content?.meta ||
  {};

const readingIdFromBackend =
  meta.reading_id || meta.id || `tema_${Date.now()}`;

setReadingId(readingIdFromBackend);
setReadingPayload(data);

const kbFromBackend =
  meta.kb_tags ||
  meta.kb ||
  ["tema_natale"];

setKbTags(kbFromBackend);

  }

  // ======================================================
  // FREE (sempre primo step)
  // ======================================================
  async function generaFree() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);

    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");

    setPremiumLoaded(false);

    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);
    setBilling(null);
    setTemaVis(null);

    try {
      const { res, data } = await callTema({ tier: "free" });

      if (!res.ok) {
        const msg =
          (data && (data.error || data.detail || data.message)) ||
          `Errore nella generazione (status ${res.status}).`;
        setErrore(typeof msg === "string" ? msg : "Errore nella generazione.");
        return;
      }

      applyTemaResponse(data);
      await refreshCreditsUI();
    } catch (e) {
      setErrore("Impossibile comunicare con il server. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // PREMIUM (secondo step via CTA)
  // ======================================================
  async function generaPremium() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);
    setGateErr("");

    try {
      const { res, data } = await callTema({ tier: "premium" });

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
          await refreshCreditsUI();
          return;
        }

        setErrore(typeof msg === "string" ? msg : "Errore nella generazione.");
        return;
      }

      applyTemaResponse(data);
      setPremiumLoaded(true);

      setEmailGateOpen(false);
      setDiyanaOpen(false);
      await refreshCreditsUI();
    } catch (e) {
      setErrore("Impossibile comunicare con il server. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // Gate open / Approfondisci click
  // ======================================================
  function openEmailGate() {
    setGateErr("");
    setGateLoading(false);
    setGateMode("register");
    setEmailGateOpen(true);

    const trial = guestTrialLeft;
    if (trial === 0) {
      setGateMsg("Hai finito la tua prova gratuita. Iscriviti o accedi per continuare.");
    } else {
      setGateMsg("Inserisci la tua email per continuare. Ti invieremo anche un link per salvare l’accesso (controlla spam).");
    }
  }

  async function handleApprofondisciClick() {
    setErrore("");
    setNoCredits(false);

    if (premiumLoaded) return;

    if (isLoggedIn) {
      await generaPremium();
      return;
    }

    openEmailGate();
  }

  // ======================================================
  // Submit gate
  // ======================================================
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

      try {
        localStorage.setItem("dyana_pending_email", email);
      } catch {}

      setResumeTarget({ path: "/tema", readingId: "tema_inline" });

      // TRIAL ESAURITO → password login/register
      if (guestTrialLeft === 0) {
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
        await generaPremium();
        return;
      }

      // TRIAL DISPONIBILE → premium subito + magic link best-effort
      setGateMsg("Attendi, sto generando il tuo Tema…");

      const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
      const redirectUrl = `${siteBase}/auth/callback`;

      // marketing consent: SOLO se token utente registrato valido
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
        console.warn("[TEMA][INLINE-AUTH] updateMarketingConsent fallito (non blocco):", err?.message || err);
      }

      try {
        await sendAuthMagicLink(email, redirectUrl);
      } catch (err) {
        console.warn("[TEMA][INLINE-AUTH] magic link non inviato (non blocco):", err?.message || err);
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
  // URL Typebot
  // ==========================
  const typebotUrl = useMemo(() => {
    const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
    try {
      const params = new URLSearchParams();

      if (userIdForDyana) params.set("user_id", userIdForDyana);
      if (sessionId) params.set("session_id", sessionId);

      params.set("reading_id", readingId || "tema_inline");
      params.set("reading_type", "tema_natale");
      params.set("reading_label", "Il tuo Tema Natale");

      const safeReadingText = (readingTextForDyana || "").slice(0, 6000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      const qs = params.toString();
      return qs ? `${baseUrl}?${qs}` : baseUrl;
    } catch {
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, readingId, readingTextForDyana]);

  // ==========================
  // RENDER
  // ==========================
  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={handleLogout} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Calcola il tuo Tema Natale</h1>
          <p className="section-subtitle">
            Inserisci i tuoi dati di nascita per ottenere una lettura base gratuita.
            <br />
            Se vuoi, puoi poi <strong>approfondire</strong> e sbloccare DYANA (Premium).
          </p>
        </header>

        {/* FORM (solo dati) */}
        <section className="section">
          <div className="card" style={{ maxWidth: "650px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label className="card-text">Nome (opzionale)</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                  placeholder="Come vuoi che ti chiami DYANA?"
                />
              </div>

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
                    onChange={(e) => setForm((prev) => ({ ...prev, data: e.target.value }))}
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
                    value={oraIgnota ? "" : (form.ora || "")}
                    onChange={(e) => setForm((prev) => ({ ...prev, ora: e.target.value }))}
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
                    onChange={(e) => setOraIgnota(e.target.checked)}
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
                  onChange={(e) => setForm({ ...form, citta: e.target.value })}
                  className="form-input"
                  placeholder="Es. Napoli, IT"
                />
              </div>

              {/* CTA primaria: genera SEMPRE FREE */}
              <button
                onClick={generaFree}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Generazione..." : "🔮 Inizia la lettura"}
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
                        <p>Hai finito la tua prova gratuita.</p>
                        <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>
                          Iscriviti o accedi per continuare.
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

        {/* AVVISO ORA IGNOTA */}
        {risultato?.input?.ora_ignota && (
          <section className="section">
            <div
              className="card"
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                border: "1px solid rgba(255,180,180,0.4)",
                backgroundColor: "#2a1818",
              }}
            >
              <p className="card-text" style={{ color: "#ffb4b4", whiteSpace: "pre-wrap" }}>
                Ascendente e case astrologiche non sono state calcolate e incluse nell&apos;analisi perché l&apos;ora di nascita non è stata indicata con precisione.
              </p>
            </div>
          </section>
        )}

        {/* GRAFICO */}
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

              <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative", width: "100%", maxWidth: "560px", paddingTop: "100%" }}>
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

              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
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
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "12px" }}>
                    Pianeti nel tema natale
                  </h3>

                  {temaVis?.pianeti && temaVis.pianeti.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                          <span style={{ fontSize: "1.3rem" }}>{p.glyph}</span>
                          <span>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      Dati pianeti non disponibili nel payload.
                    </p>
                  )}
                </div>

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
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "12px" }}>
                    Aspetti principali
                  </h3>

                  {temaVis?.aspetti && temaVis.aspetti.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "1.1rem", minWidth: "70px" }}>
                            <span>{a.g1}</span>
                            <span>{a.g_asp}</span>
                            <span>{a.g2}</span>
                          </div>
                          <div style={{ flex: 1 }}>{a.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      Dati aspetti non disponibili nel payload.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* BLOCCO FREE: interpretazione base + CTA upgrade */}
        {interpretazione && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">La tua sintesi</h3>
              <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {interpretazione}
              </p>

              {!premiumLoaded && (
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApprofondisciClick}
                    disabled={loading}
                  >
                    ✨ Approfondisci con DYANA
                  </button>

                  {isLoggedIn && (
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
                      Costo: 2 crediti
                    </span>
                  )}
                </div>
              )}

              {/* EMAIL GATE INLINE (sparisce appena arriva premium) */}
              {emailGateOpen && !premiumLoaded && (
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
                          className={gateMode === "register" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("register")}
                        >
                          Iscriviti
                        </button>
                        <button
                          type="button"
                          className={gateMode === "login" ? "btn btn-primary" : "btn"}
                          onClick={() => setGateMode("login")}
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
                    />

                    {guestTrialLeft === 1 && (
                      <div style={{ marginTop: 2 }}>
                        <label className="card-text" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <input
                            type="checkbox"
                            checked={gateMarketing}
                            onChange={(e) => setGateMarketing(e.target.checked)}
                            disabled={gateLoading || loading}
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

                    {guestTrialLeft === 0 && (
                      <>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Password"
                          value={gatePass}
                          onChange={(e) => setGatePass(e.target.value)}
                          autoComplete="current-password"
                        />
                        {gateMode === "register" && (
                          <input
                            className="form-input"
                            type="password"
                            placeholder="Ripeti password"
                            value={gatePass2}
                            onChange={(e) => setGatePass2(e.target.value)}
                            autoComplete="new-password"
                          />
                        )}
                      </>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={gateLoading || loading}>
                      {gateLoading
                        ? "Attendi... Sto generando il tuo Tema"
                        : guestTrialLeft === 0
                        ? (gateMode === "login" ? "Accedi e continua" : "Iscriviti e continua")
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

        {/* BLOCCO PREMIUM (si apre sotto; FREE resta sopra) */}
        {premiumLoaded && contenuto && (
          <section className="section">
            <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
              <h3 className="card-title">La tua lettura completa</h3>

              {capitoliArray.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {capitoliArray.map((cap, idx) => {
                    const titolo = cap.titolo || `Capitolo ${idx + 1}`;
                    const testo = cap.testo || cap.contenuto || cap.testo_breve || "";
                    if (!testo) return null;
                    return (
                      <div key={`${titolo}-${idx}`}>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                          {titolo}
                        </h4>
                        <p className="card-text" style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>
                          {testo}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {Object.entries(sectionLabels).map(([key, label]) => {
                    const text = contenuto?.[key];
                    if (!text) return null;
                    return (
                      <div key={key}>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                          {label}
                        </h4>
                        <p className="card-text" style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* BLOCCO DYANA Q&A: solo se premium presente */}
        {premiumLoaded && hasReading && readingTextForDyana && (
          <section className="section">
            <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
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
                <p className="card-text" style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 4 }}>
                  DYANA • Q&amp;A sul tuo Tema Natale
                </p>

                <h3 className="card-title" style={{ marginBottom: 6 }}>
                  Hai domande su questa lettura?
                </h3>

                <p className="card-text" style={{ marginBottom: 4, opacity: 0.9 }}>
                  DYANA conosce già il Tema che hai appena generato e può aiutarti a interpretarlo meglio.
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setDiyanaOpen((prev) => !prev)}
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
                      style={{ border: "none", width: "100%", height: "100%" }}
                      allow="clipboard-write; microphone; camera"
                    />
                  </div>
                )}

                <p className="card-text" style={{ marginTop: 8, fontSize: "0.75rem", opacity: 0.65, textAlign: "right" }}>
                  DYANA risponde solo su questo Tema, non su argomenti generici.
                </p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

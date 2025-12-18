// app/compatibilita/page.jsx
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

// Costo premium compatibilità (coerente con backend / convenzione)
const PREMIUM_COST = 3;

if (typeof window !== "undefined") {
  console.log("[DYANA/COMPAT] API_BASE runtime:", API_BASE);
}

// ==========================
// Helper decode JWT (robusto)
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
// Helper per label aspetti
// ==========================
function formatAspettoLabel(asp) {
  if (!asp || typeof asp !== "object") return "";

  const p1 = asp.pianeta1 || asp.pianetaA || asp.p1 || "?";
  const p2 = asp.pianeta2 || asp.pianetaB || asp.p2 || "?";
  const tipo = asp.tipo || asp.aspetto || asp.nome || "";
  const orbVal =
    typeof asp.orb === "number" && !Number.isNaN(asp.orb) ? asp.orb.toFixed(1) : null;

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
  if (typeof info.gradi_segno === "number") gradiNum = info.gradi_segno;
  else if (typeof info.gradi === "number") gradiNum = info.gradi;
  else if (typeof info.degree === "number") gradiNum = info.degree;

  const gradiTxt = gradiNum !== null ? `${gradiNum.toFixed(1)}°` : "";
  const casa = typeof info.casa === "number" ? info.casa : null;

  let base = nome;
  if (segno && gradiTxt) base = `${nome} in ${segno} ${gradiTxt}`;
  else if (segno) base = `${nome} in ${segno}`;
  else if (gradiTxt) base = `${nome} ${gradiTxt}`;

  if (casa !== null) return `${base} – Casa ${casa}`;
  return base;
}

// Helper error backend
function normalizeErrorMessage(data, status) {
  if (!data) return `Errore nella generazione della compatibilità (status ${status}).`;

  if (typeof data.error === "string") return data.error;

  const detail = data.detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => d.msg || JSON.stringify(d));
    return msgs.join(" | ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  return `Errore nella generazione della compatibilità (status ${status}).`;
}

// Testo Q&A da sinastria_ai
function buildSinastriaReadingText(sinastriaAI) {
  if (!sinastriaAI || typeof sinastriaAI !== "object") return "";

  const parts = [];

  if (sinastriaAI.sintesi_generale) {
    parts.push(`Sintesi generale:\n${sinastriaAI.sintesi_generale}`);
  }

  if (Array.isArray(sinastriaAI.capitoli) && sinastriaAI.capitoli.length > 0) {
    const blocchi = sinastriaAI.capitoli.map((cap, idx) => {
      const titolo = cap.titolo || `Capitolo ${idx + 1}`;
      const testo = cap.testo || "";
      return testo ? `• ${titolo}\n${testo}` : `• ${titolo}`;
    });
    parts.push("Capitoli della relazione:\n" + blocchi.join("\n\n"));
  } else if (Array.isArray(sinastriaAI.aree_relazione) && sinastriaAI.aree_relazione.length > 0) {
    const blocchi = sinastriaAI.aree_relazione.map((area) => {
      const titolo = area.titolo || area.id || "Area della relazione";
      const sintesi = area.sintesi || "";
      const header = `• ${titolo}`;
      return sintesi ? `${header}\n${sintesi}` : header;
    });
    parts.push("Aree della relazione:\n" + blocchi.join("\n\n"));
  }

  if (Array.isArray(sinastriaAI.punti_forza) && sinastriaAI.punti_forza.length) {
    parts.push("Punti di forza:\n" + sinastriaAI.punti_forza.map((p) => `- ${p}`).join("\n"));
  }

  if (Array.isArray(sinastriaAI.punti_criticita) && sinastriaAI.punti_criticita.length) {
    parts.push(
      "Punti di attenzione:\n" + sinastriaAI.punti_criticita.map((p) => `- ${p}`).join("\n")
    );
  }

  if (Array.isArray(sinastriaAI.consigli_finali) && sinastriaAI.consigli_finali.length) {
    parts.push(
      "Consigli finali:\n" + sinastriaAI.consigli_finali.map((c) => `- ${c}`).join("\n")
    );
  }

  return parts.join("\n\n").trim();
}

// ==========================
// PAGINA
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
  });

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [noCredits, setNoCredits] = useState(false);

  // FREE resta sopra, PREMIUM si aggiunge sotto
  const [freeResult, setFreeResult] = useState(null);
  const [premiumResult, setPremiumResult] = useState(null);

  // Billing (ultimo noto)
  const [billing, setBilling] = useState(null);

  // Navbar state
  const [userRole, setUserRole] = useState("guest");
  const [userCredits, setUserCredits] = useState(0);
  const [userIdForDyana, setUserIdForDyana] = useState("guest_compat");

  // trial guest 1/0 (o null se non disponibile)
  const [guestTrialLeft, setGuestTrialLeft] = useState(null);

  // Email gate inline (allineato Oroscopo/Tema)
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState("register"); // register | login
  const [gateEmail, setGateEmail] = useState("");
  const [gatePass, setGatePass] = useState("");
  const [gatePass2, setGatePass2] = useState("");
  const [gateMsg, setGateMsg] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  // Consenso marketing prefleggato a sì
  const [gateMarketing, setGateMarketing] = useState(true);

  // DYANA
  const [diyanaOpen, setDiyanaOpen] = useState(false);
  const [sessionId] = useState(() => `sinastria_session_${Date.now()}`);

  const isLoggedIn = !!getToken();

  // ======================================================
  // Refresh user/credits (allineato)
  // ======================================================
  const refreshUserFromToken = useCallback(() => {
    const token = getToken();
    if (!token) {
      setUserRole("guest");
      setUserIdForDyana("guest_compat");
      return;
    }
    const payload = decodeJwtPayload(token);
    setUserRole(payload?.role || "free");
    setUserIdForDyana(payload?.sub || "guest_compat");
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
      console.warn("[COMPAT] refreshCreditsUI failed:", e?.message || e);
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
    setUserIdForDyana("guest_compat");
    setGuestTrialLeft(null);

    setPremiumResult(null);
    setDiyanaOpen(false);
    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");

    (async () => {
      await ensureGuestToken();
      await refreshCreditsUI();
    })();
  }

  // ======================================================
  // Handlers form
  // ======================================================
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // ======================================================
  // API call /sinastria_ai
  // ======================================================
  async function callSinastria({ tier }) {
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
      tier, // free | premium
    };

    let token = await getAnyAuthTokenAsync();
    if (!token && ASTROBOT_JWT_TEMA) token = ASTROBOT_JWT_TEMA;

    const headers = {
      "Content-Type": "application/json",
      "X-Client-Source": "dyana_web/compatibilita",
      "X-Client-Session": sessionId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

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

    return { res, data };
  }

  function applyBillingAndCredits(data, feature) {
    if (data?.billing) {
      setBilling(data.billing);

      const remaining = data.billing.remaining_credits;
      if (typeof remaining === "number") {
        setUserCredits(remaining);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dyana-credits-updated", {
              detail: {
                feature,
                remaining_credits: remaining,
                billing_mode: data.billing.mode,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("dyana:refresh-credits", {
              detail: {
                feature,
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
  }

  // ======================================================
  // FREE (sempre primo step)
  // ======================================================
  async function generaFree() {
    setLoading(true);
    setErrore("");
    setNoCredits(false);

    setEmailGateOpen(false);
    setGateErr("");
    setGateMsg("");
    setDiyanaOpen(false);

    setPremiumResult(null);
    setBilling(null);

    try {
      const { res, data } = await callSinastria({ tier: "free" });

      if (!res.ok) {
        const msg = normalizeErrorMessage(data, res.status);
        setErrore(msg);
        return;
      }

      setFreeResult(data);
      applyBillingAndCredits(data, "sinastria_ai");
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
      const { res, data } = await callSinastria({ tier: "premium" });

      if (!res.ok) {
        const errorCode = data?.error_code || data?.code || data?.error || data?.detail;

        const isCreditsError =
          res.status === 402 ||
          res.status === 403 ||
          (typeof errorCode === "string" && errorCode.toLowerCase().includes("credit"));

        const msg = normalizeErrorMessage(data, res.status);

        if (isCreditsError) {
          setNoCredits(true);
          setErrore(msg);
          await refreshCreditsUI();
          return;
        }

        setErrore(msg);
        return;
      }

      setPremiumResult(data);
      applyBillingAndCredits(data, "sinastria_ai");

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

    if (premiumResult) return;

    if (isLoggedIn) {
      await generaPremium();
      return;
    }

    openEmailGate();
  }

  // ======================================================
  // Submit gate (identico pattern Tema/Oroscopo)
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

      setResumeTarget({ path: "/compatibilita", readingId: "sinastria_inline" });

      // TRIAL ESAURITO → login/register password
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
      setGateMsg("Attendi, sto generando la compatibilità…");

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
        console.warn("[COMPAT][INLINE-AUTH] updateMarketingConsent fallito (non blocco):", err?.message || err);
      }

      // magic link best-effort (non blocca)
      try {
        await sendAuthMagicLink(email, redirectUrl);
      } catch (err) {
        console.warn("[COMPAT][INLINE-AUTH] magic link non inviato (non blocco):", err?.message || err);
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
  // DERIVATE UI: FREE
  // ==========================
  const freeSinastriaAI = freeResult?.sinastria_ai || null;

  const freeChartBase64 = freeResult?.chart_sinastria_base64 || null;
  const freeSinVis = freeResult?.sinastria_vis || null;
  const freeTemaVisA = freeSinVis?.A || null;
  const freeTemaVisB = freeSinVis?.B || null;
  const freeAspettiPrincipali = Array.isArray(freeSinVis?.aspetti_top) ? freeSinVis.aspetti_top : [];

  const freeNomeA = freeTemaVisA?.nome || form.nomeA || "Persona A";
  const freeNomeB = freeTemaVisB?.nome || form.nomeB || "Persona B";

  const freePayloadMeta = freeResult?.payload_ai?.meta || {};
  const freeOraIgnotaAFromPayload = !!freePayloadMeta.ora_ignota_A;
  const freeOraIgnotaBFromPayload = !!freePayloadMeta.ora_ignota_B;
  const freeOraIgnotaGlobal =
    freeOraIgnotaAFromPayload || freeOraIgnotaBFromPayload || form.oraAIgnota || form.oraBIgnota;

  const hasFree = !!freeResult && (!!freeSinastriaAI?.sintesi_generale || !!freeChartBase64);

  // ==========================
  // DERIVATE UI: PREMIUM
  // ==========================
  const premiumSinastriaAI = premiumResult?.sinastria_ai || null;

  const premiumChartBase64 = premiumResult?.chart_sinastria_base64 || null;
  const premiumSinVis = premiumResult?.sinastria_vis || null;
  const premiumTemaVisA = premiumSinVis?.A || null;
  const premiumTemaVisB = premiumSinVis?.B || null;
  const premiumAspettiPrincipali = Array.isArray(premiumSinVis?.aspetti_top) ? premiumSinVis.aspetti_top : [];

  const premiumNomeA = premiumTemaVisA?.nome || form.nomeA || "Persona A";
  const premiumNomeB = premiumTemaVisB?.nome || form.nomeB || "Persona B";

  const premiumPayloadMeta = premiumResult?.payload_ai?.meta || {};
  const premiumOraIgnotaAFromPayload = !!premiumPayloadMeta.ora_ignota_A;
  const premiumOraIgnotaBFromPayload = !!premiumPayloadMeta.ora_ignota_B;
  const premiumOraIgnotaGlobal =
    premiumOraIgnotaAFromPayload || premiumOraIgnotaBFromPayload || form.oraAIgnota || form.oraBIgnota;

  const hasPremium = !!premiumResult && (!!premiumSinastriaAI?.sintesi_generale || !!premiumChartBase64);

  // ==========================
  // TYPEBOT URL (solo premium)
  // ==========================
  const premiumReadingTextForDyana = useMemo(() => buildSinastriaReadingText(premiumSinastriaAI), [premiumSinastriaAI]);

  const typebotUrl = useMemo(() => {
    const baseUrl = `https://typebot.co/${TYPEBOT_DYANA_ID}`;
    try {
      const params = new URLSearchParams();

      if (userIdForDyana) params.set("user_id", userIdForDyana);
      if (sessionId) params.set("session_id", sessionId);

      const meta =
        (premiumResult && premiumResult.payload_ai && premiumResult.payload_ai.meta) ||
        (premiumSinastriaAI && premiumSinastriaAI.meta) ||
        {};

      const readingId = meta.reading_id || meta.id || "sinastria_inline";
      params.set("reading_id", readingId);

      params.set("reading_type", "sinastria");
      params.set("reading_label", "Compatibilità di coppia");

      const safeReadingText = (premiumReadingTextForDyana || "").slice(0, 6000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      const qs = params.toString();
      return qs ? `${baseUrl}?${qs}` : baseUrl;
    } catch {
      return baseUrl;
    }
  }, [userIdForDyana, sessionId, premiumResult, premiumSinastriaAI, premiumReadingTextForDyana]);

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={handleLogout} />

      <section className="landing-wrapper">
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">Compatibilità di coppia</h1>
          <p className="section-subtitle">
            Inserisci i dati di nascita di entrambe le persone per ottenere una lettura base gratuita.
            <br />
            Poi, se vuoi, puoi <strong>approfondire</strong> e sbloccare DYANA (Premium).
          </p>
        </header>

        {/* FORM (solo dati) */}
        <section className="section">
          <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                {/* PERSONA A */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>Persona A</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label className="card-text">Nome</label>
                      <input type="text" name="nomeA" value={form.nomeA} onChange={handleChange} className="form-input" />
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
                      <input type="date" name="dataA" value={form.dataA} onChange={handleChange} className="form-input" />
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
                        style={form.oraAIgnota ? { opacity: 0.4, pointerEvents: "none" } : undefined}
                      />

                      <label
                        className="card-text"
                        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "0.85rem", cursor: "pointer" }}
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
                          style={{ width: 14, height: 14 }}
                        />
                        <span>Non conosco l&apos;ora esatta (ora neutra)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* PERSONA B */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>Persona B</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label className="card-text">Nome</label>
                      <input type="text" name="nomeB" value={form.nomeB} onChange={handleChange} className="form-input" />
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
                      <input type="date" name="dataB" value={form.dataB} onChange={handleChange} className="form-input" />
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
                        style={form.oraBIgnota ? { opacity: 0.4, pointerEvents: "none" } : undefined}
                      />

                      <label
                        className="card-text"
                        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "0.85rem", cursor: "pointer" }}
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
                          style={{ width: 14, height: 14 }}
                        />
                        <span>Non conosco l&apos;ora esatta (ora neutra)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA primaria: genera SEMPRE FREE */}
              <button onClick={generaFree} className="btn btn-primary" disabled={loading} style={{ marginTop: "14px" }}>
                {loading ? "Calcolo in corso..." : "🔮 Inizia la lettura"}
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

        {/* ==========================
            BLOCCO FREE (resta sempre)
           ========================== */}
        {hasFree && (
          <>
            {/* GRAFICO + DATI (FREE) */}
            {!hasPremium && freeChartBase64 && (
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

                  <p className="card-text" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    Questo è il grafico che sovrappone i vostri pianeti: internamente quelli di <strong>{freeNomeA}</strong> ed esternamente quelli di{" "}
                    <strong>{freeNomeB}</strong>.
                  </p>

                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: "560px", paddingTop: "100%" }}>
                      <img
                        src={`data:image/png;base64,${freeChartBase64}`}
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

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
                    {freeTemaVisA && Array.isArray(freeTemaVisA.pianeti) && (
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {freeNomeA}
                        </h4>

                        <ul className="card-text" style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                          {freeTemaVisA.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {freeTemaVisB && Array.isArray(freeTemaVisB.pianeti) && (
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {freeNomeB}
                        </h4>

                        <ul className="card-text" style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                          {freeTemaVisB.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {freeAspettiPrincipali.length > 0 && (
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          Aspetti tra i vostri pianeti
                        </h4>

                        <ul className="card-text" style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                          {freeAspettiPrincipali.slice(0, 10).map((asp, idx) => {
                            const label = asp.descrizione || asp.label || formatAspettoLabel(asp) || "";
                            return <li key={idx}>{label}</li>;
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SINTESI FREE + CTA UPGRADE */}
            {!hasPremium && freeSinastriaAI?.sintesi_generale && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">La tua sintesi</h3>

                  {freeOraIgnotaGlobal && (
                    <p className="card-text" style={{ marginTop: "6px", fontSize: "0.85rem", color: "#ffdf9a" }}>
                      Ascendente e case astrologiche non sono state calcolate e incluse nell&apos;analisi perché l&apos;ora di nascita non è stata indicata con precisione.
                    </p>
                  )}

                  <p className="card-text" style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}>
                    {freeSinastriaAI.sintesi_generale}
                  </p>
{/* CAPITOLI (FREE): mostra almeno i titoli */}
{Array.isArray(freeSinastriaAI?.capitoli) && freeSinastriaAI.capitoli.length > 0 && (
  <div style={{ marginTop: 16 }}>
    <h4 className="card-subtitle">Capitoli (anteprima)</h4>
    <ul className="card-text" style={{ paddingLeft: "1.2rem", marginTop: 6 }}>
      {freeSinastriaAI.capitoli.map((cap, idx) => (
        <li key={idx}>
          {cap?.titolo || `Capitolo ${idx + 1}`}
        </li>
      ))}
    </ul>
  </div>
)}

{/* CTA testuale dal backend (FREE) */}
{freeSinastriaAI?.cta && (
  <p className="card-text" style={{ marginTop: 12, color: "#ffdf9a", whiteSpace: "pre-wrap" }}>
    {freeSinastriaAI.cta}
  </p>
)}

                  {/* CTA Approfondisci (solo se NON ho già premium) */}
                  {!hasPremium && (
                    <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-primary" onClick={handleApprofondisciClick} disabled={loading}>
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
                          Costo: {PREMIUM_COST} credit{PREMIUM_COST === 1 ? "o" : "i"}
                        </span>
                      )}
                    </div>
                  )}

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

                        <button type="button" className="btn" onClick={() => setEmailGateOpen(false)} style={{ marginLeft: "auto" }}>
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

                        {/* Consenso marketing + link condizioni solo con trial disponibile */}
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
                            ? "Attendi... Sto generando la compatibilità"
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
          </>
        )}

        {/* ==========================
            BLOCCO PREMIUM (si apre sotto)
           ========================== */}
        {hasPremium && (
          <>
            {/* GRAFICO + DATI PREMIUM (se disponibile) */}
            {premiumChartBase64 && (
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
                  <h3 className="card-title">La tua lettura completa</h3>

                  <p className="card-text" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    Versione Premium della sinastria (con approfondimenti e accesso a DYANA).
                  </p>

                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: "560px", paddingTop: "100%" }}>
                      <img
                        src={`data:image/png;base64,${premiumChartBase64}`}
                        alt="Carta di sinastria (Premium)"
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
                    {premiumTemaVisA && Array.isArray(premiumTemaVisA.pianeti) && (
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {premiumNomeA}
                        </h4>

                        <ul className="card-text" style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                          {premiumTemaVisA.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {premiumTemaVisB && Array.isArray(premiumTemaVisB.pianeti) && (
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          {premiumNomeB}
                        </h4>

                        <ul className="card-text" style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                          {premiumTemaVisB.pianeti.map((p, idx) => (
                            <li key={idx}>{formatPianetaPosizione(p)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {premiumAspettiPrincipali.length > 0 && (
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
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 6 }}>
                          Aspetti tra i vostri pianeti
                        </h4>

                        <ul className="card-text" style={{ marginTop: 6, paddingLeft: "1.2rem", fontSize: "0.8rem" }}>
                          {premiumAspettiPrincipali.slice(0, 10).map((asp, idx) => {
                            const label = asp.descrizione || asp.label || formatAspettoLabel(asp) || "";
                            return <li key={idx}>{label}</li>;
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* TESTO PREMIUM: sintesi + capitoli/aree + focus */}
            {premiumSinastriaAI?.sintesi_generale && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">Sintesi della relazione</h3>

                  {premiumOraIgnotaGlobal && (
                    <p className="card-text" style={{ marginTop: "6px", fontSize: "0.85rem", color: "#ffdf9a" }}>
                      Ascendente e case astrologiche non sono state calcolate e incluse nell&apos;analisi perché l&apos;ora di nascita non è stata indicata con precisione.
                    </p>
                  )}

                  <p className="card-text" style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}>
                    {premiumSinastriaAI.sintesi_generale}
                  </p>
                </div>
              </section>
            )}

            {Array.isArray(premiumSinastriaAI?.capitoli) && premiumSinastriaAI.capitoli.length > 0 && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">Capitoli di approfondimento</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                    {premiumSinastriaAI.capitoli.map((cap, idx) => (
                      <div key={idx}>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                          {cap.titolo || `Capitolo ${idx + 1}`}
                        </h4>
                        {cap.testo && (
                          <p className="card-text" style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}>
                            {cap.testo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {!(
              Array.isArray(premiumSinastriaAI?.capitoli) &&
              premiumSinastriaAI.capitoli.length > 0
            ) &&
              Array.isArray(premiumSinastriaAI?.aree_relazione) &&
              premiumSinastriaAI.aree_relazione.length > 0 && (
                <section className="section">
                  <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                    <h3 className="card-title">Aree della relazione</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                      {premiumSinastriaAI.aree_relazione.map((area) => (
                        <div key={area.id}>
                          <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                            {area.titolo || area.id}
                          </h4>

                          {area.sintesi && (
                            <p className="card-text" style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}>
                              {area.sintesi}
                            </p>
                          )}

                          {Array.isArray(area.aspetti_principali) && area.aspetti_principali.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              <p className="card-text" style={{ fontWeight: 500, marginBottom: 2 }}>
                                Aspetti principali:
                              </p>
                              <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                                {area.aspetti_principali.map((asp, idx) => (
                                  <li key={idx}>{asp.descrizione || formatAspettoLabel(asp) || ""}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {Array.isArray(area.consigli_pratici) && area.consigli_pratici.length > 0 && (
                            <div>
                              <p className="card-text" style={{ fontWeight: 500, marginBottom: 2 }}>
                                Consigli pratici:
                              </p>
                              <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
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

            {(premiumSinastriaAI?.punti_forza || premiumSinastriaAI?.punti_criticita || premiumSinastriaAI?.consigli_finali) && (
              <section className="section">
                <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
                  <h3 className="card-title">Focus principali della relazione</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                    {Array.isArray(premiumSinastriaAI?.punti_forza) && premiumSinastriaAI.punti_forza.length > 0 && (
                      <div>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                          Punti di forza
                        </h4>
                        <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                          {premiumSinastriaAI.punti_forza.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(premiumSinastriaAI?.punti_criticita) && premiumSinastriaAI.punti_criticita.length > 0 && (
                      <div>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                          Punti di attenzione
                        </h4>
                        <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                          {premiumSinastriaAI.punti_criticita.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(premiumSinastriaAI?.consigli_finali) && premiumSinastriaAI.consigli_finali.length > 0 && (
                      <div>
                        <h4 className="card-text" style={{ fontWeight: 600, marginBottom: 4 }}>
                          Consigli finali
                        </h4>
                        <ul className="card-text" style={{ paddingLeft: "1.2rem" }}>
                          {premiumSinastriaAI.consigli_finali.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* DYANA Q&A: solo premium */}
            {premiumReadingTextForDyana && (
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
                      DYANA • Q&amp;A sulla vostra compatibilità
                    </p>

                    <h3 className="card-title" style={{ marginBottom: 6 }}>
                      Hai domande su questa relazione?
                    </h3>

                    <p className="card-text" style={{ marginBottom: 4, opacity: 0.9 }}>
                      DYANA conosce già la sinastria che hai appena generato e può aiutarti a interpretarla meglio.
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
                      DYANA risponde solo su questa compatibilità, non su argomenti generici.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

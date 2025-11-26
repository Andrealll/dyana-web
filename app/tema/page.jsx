"use client";

import { useState } from "react";
import { DyanaPopup } from "../../components/DyanaPopup";

// ID che al momento non usiamo più, ma lo lascio se serve in futuro
const TYPEBOT_DYANA_ID = "diyana-ai";

// Base URL del backend AstroBot (usa .env se presente, altrimenti localhost)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8001";

// JWT per chiamare /tema_ai (deve essere settato in .env.local)
const ASTROBOT_JWT_TEMA =
  process.env.NEXT_PUBLIC_ASTROBOT_JWT_TEMA || "";

export default function TemaPage() {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
    tier: "free", // per testare free/premium
  });

  const [loading, setLoading] = useState(false);
  const [interpretazione, setInterpretazione] = useState("");
  const [contenuto, setContenuto] = useState(null); // contiene data.result.content
  const [risultato, setRisultato] = useState(null); // JSON completo per debug
  const [errore, setErrore] = useState("");

  // Stati per DYANA (per ora non usati dall'iframe, ma li teniamo per dopo)
  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  // Sessione DYANA per questa pagina (generata una volta)
  const [sessionId] = useState(() => `tema_session_${Date.now()}`);

  // TODO: integra con il tuo sistema di login reale
  const userId = "user_tema_demo";

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function generaTema() {
    setLoading(true);
    setErrore("");
    setInterpretazione("");
    setContenuto(null);
    setRisultato(null);

    try {
      // Payload allineato al curl che funziona con /tema_ai
      const payload = {
        citta: form.citta,
        data: form.data, // "YYYY-MM-DD"
        ora: form.ora,   // "HH:MM"
        nome: form.nome || null,
        tier: form.tier, // "free" o "premium"
      };

      const headers = {
        "Content-Type": "application/json",
      };

      if (ASTROBOT_JWT_TEMA) {
        headers["Authorization"] = `Bearer ${ASTROBOT_JWT_TEMA}`;
      }

      const res = await fetch(`${API_BASE}/tema_ai`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      let data = null;
      const text = await res.text();

      // Proviamo a interpretare la risposta come JSON
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        console.log("[DYANA /tema_ai] status non OK:", res.status);
        console.log("[DYANA /tema_ai] body errore:", data);

        setErrore(
          (data && data.error) ||
            `Errore nella generazione del tema (status ${res.status}).`
        );
        setLoading(false);
        return;
      }

      // Salviamo tutto per debug
      setRisultato(data);

      const content = data?.result?.content || null;
      setContenuto(content);

      // Interpretazione principale = profilo_generale
      const profiloGenerale = content?.profilo_generale || "";

      if (!profiloGenerale) {
        setInterpretazione(
          "Interpretazione non disponibile (profilo_generale vuoto)."
        );
      } else {
        setInterpretazione(profiloGenerale);
      }

      // ====== Aggancio variabili per DYANA (serve dopo) ======

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

  // Mappa chiave -> etichetta umana
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

  // Costruiamo il reading_text che DYANA deve vedere:
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

  return (
    <main className="page-root">
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

              {/* TIER */}
              <div>
                <label className="card-text">Livello</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Invio */}
              <button
                onClick={generaTema}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Generazione..." : "Calcola Tema"}
              </button>

              {/* Errore */}
              {errore && (
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {errore}
                </p>
              )}
            </div>
          </div>
        </section>

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

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

                <h3
                  className="card-title"
                  style={{ marginBottom: 6 }}
                >
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

                {/* Bottone + finestra DYANA sotto */}
<div style={{ marginTop: 14 }}>
  <DyanaPopup
    typebotId={TYPEBOT_DYANA_ID}
    userId={userId}
    sessionId={sessionId}
    readingId={readingId || "tema_inline"}
    readingType="tema_natale"
    readingLabel="Il tuo Tema Natale"
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
                  DYANA risponde solo su questo Tema, non su altri argomenti
                  generici.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* RISULTATO - DEBUG COMPLETO */}
        {risultato && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Dettagli Tema (debug)</h3>
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

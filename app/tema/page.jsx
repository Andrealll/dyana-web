"use client";
import { useState } from "react";
import { DyanaPopup } from "../../components/DyanaPopup";

const TYPEBOT_DYANA_ID = "dyana-ai"; // TODO: sostituisci con lo slug reale del tuo Typebot

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

  // Nuovi stati per DYANA
  const [readingId, setReadingId] = useState("");
  const [readingPayload, setReadingPayload] = useState(null);
  const [kbTags, setKbTags] = useState([]);

  // Sessione DYANA per questa pagina (generata una volta)
  const [sessionId] = useState(() => `tema_session_${Date.now()}`);

  // TODO: integra con il tuo sistema di login
  const userId = "user_tema_demo";

  // Stessa logica che avevi su tema prima (Render come fallback)
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    "https://chatbot-test-0h4o.onrender.com";

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
      const payload = {
        citta: form.citta,
        data: form.data, // "YYYY-MM-DD"
        ora: form.ora, // "HH:MM"
        nome: form.nome || null,
        email: null,
        domanda: null,
        tier: form.tier, // "free" o "premium"
      };

      const res = await fetch(`${API_BASE}/tema_ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      // ====== Aggancio variabili per DYANA ======

      // reading_id (se esiste in meta, altrimenti uno generato)
      const meta = data?.result?.meta || {};
      const readingIdFromBackend =
        meta.reading_id || meta.id || `tema_${Date.now()}`;
      setReadingId(readingIdFromBackend);

      // payload completo: per DYANA lo consideriamo l'intero JSON di risposta
      setReadingPayload(data);

      // kb_tags: se esistono in meta, altrimenti fallback generico
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
  // - sempre il profilo generale
  // - se premium, aggiungiamo le sezioni dettagliate disponibili
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

        {/* BLOCCO DYANA - SOLO PREMIUM E SE ESISTE UNA LETTURA */}
        {hasReading && readingTextForDyana && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Hai domande sul tuo Tema Natale?</h3>
              <p className="card-text">
                Puoi fare 2 domande di chiarimento a DYANA a partire da questa
                lettura.
              </p>

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

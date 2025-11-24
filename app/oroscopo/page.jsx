"use client";

import { useState } from "react";

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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Mappa "giornaliero" -> "daily", ecc.
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

  async function generaOroscopo() {
    setLoading(true);
    setErrore("");
    setRisultato(null);

    try {
      const slug = mapPeriodoToSlug(form.periodo);

      if (!slug) {
        setErrore("Periodo non valido.");
        setLoading(false);
        return;
      }

      const payload = {
        nome: form.nome || null,
        citta: form.citta,
        data: form.data, // "YYYY-MM-DD"
        ora: form.ora, // "HH:MM"
        email: null,
        domanda: null,
        tier: form.tier, // "free" o "premium"
      };

      // Chiamata alla API interna Next
      const res = await fetch(`/api/oroscopo_ai/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        console.log("[DYANA /oroscopo] status non OK:", res.status);
        console.log("[DYANA /oroscopo] body errore:", data);

        setErrore(
          (data && data.error) ||
            `Errore nella generazione dell'oroscopo (status ${res.status}).`
        );
        setLoading(false);
        return;
      }

      setRisultato(data);
    } catch (err) {
      console.error("[DYANA /oroscopo] errore fetch:", err);
      setErrore(
        "Impossibile comunicare con il server. Controlla la connessione e riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  // Helpers UI per intensità
  function formatIntensity(value) {
    if (typeof value !== "number" || isNaN(value)) return 0;
    return Math.round(value * 100);
  }

  function estraiIntensita(engineResult) {
    try {
      const intensities =
        engineResult?.pipe?.metriche_grafico?.samples?.[0]?.metrics
          ?.intensities;

      if (!intensities) return null;

      return {
        energy: formatIntensity(intensities.energy),
        emotions: formatIntensity(intensities.emotions),
        relationships: formatIntensity(intensities.relationships),
        work: formatIntensity(intensities.work),
        luck: formatIntensity(intensities.luck),
      };
    } catch {
      return null;
    }
  }

  function estraiInterpretazione(oroscopo_ai) {
    if (!oroscopo_ai) return null;

    const sintesi = oroscopo_ai.sintesi_periodo;
    const capitoli = Array.isArray(oroscopo_ai.capitoli)
      ? oroscopo_ai.capitoli
      : [];

    return { sintesi, capitoli };
  }

  const intensita = risultato ? estraiIntensita(risultato.engine_result) : null;
  const interpretazione = risultato
    ? estraiInterpretazione(risultato.oroscopo_ai)
    : null;

  const periodoLabel =
    risultato?.engine_result?.periodo_ita || form.periodo || "giornaliero";

  return (
    <main className="page-root">
      <section className="landing-wrapper">
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">Genera il tuo Oroscopo</h1>
          <p className="section-subtitle">
            Seleziona il periodo e inserisci i tuoi dati: DYANA userà il motore
            AstroBot per calcolare il tuo oroscopo, con interpretazione AI.
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
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
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
            </div>
          </div>
        </section>

        {/* RISULTATO */}
        {risultato && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Il tuo Oroscopo</h3>

              {/* INTERPRETAZIONE */}
              <div style={{ marginBottom: "16px" }}>
                <h4 className="card-subtitle">Interpretazione</h4>
                {interpretazione?.sintesi ? (
                  <p className="card-text">{interpretazione.sintesi}</p>
                ) : (
                  <p className="card-text">
                    Nessuna interpretazione testuale disponibile (campo
                    oroscopo_ai assente nella risposta).
                  </p>
                )}

                {/* Capitoli sintetici, se presenti */}
                {interpretazione?.capitoli &&
                  interpretazione.capitoli.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <h5 className="card-subtitle">Capitoli principali</h5>
                      <ul
                        style={{
                          listStyle: "disc",
                          paddingLeft: "20px",
                        }}
                      >
                        {interpretazione.capitoli.map((cap, idx) => (
                          <li key={cap.id || idx} className="card-text">
                            <strong>
                              {cap.titolo || `Capitolo ${idx + 1}`} —{" "}
                            </strong>
                            {cap.sintesi ||
                              cap.riassunto ||
                              "Capitolo senza sintesi breve disponibile."}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              {/* METRICHE TECNICHE */}
              <div style={{ marginTop: "16px" }}>
                <h4 className="card-subtitle">Panoramica tecnica</h4>
                <p className="card-text">
                  Periodo: {periodoLabel || "giornaliero"}
                </p>

                {intensita && (
                  <>
                    <p className="card-text">Intensità (0–100):</p>
                    <ul
                      style={{
                        listStyle: "none",
                        paddingLeft: 0,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "4px 12px",
                      }}
                    >
                      <li className="card-text">
                        Energia: {intensita.energy}
                      </li>
                      <li className="card-text">
                        Emozioni: {intensita.emotions}
                      </li>
                      <li className="card-text">
                        Relazioni: {intensita.relationships}
                      </li>
                      <li className="card-text">Lavoro: {intensita.work}</li>
                      <li className="card-text">Fortuna: {intensita.luck}</li>
                    </ul>
                  </>
                )}
              </div>

              {/* RAW JSON */}
              <div style={{ marginTop: "18px" }}>
                <h4 className="card-subtitle">Dettaglio completo (raw JSON)</h4>
                <pre
                  className="card-text"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8rem",
                    maxHeight: "360px",
                    overflow: "auto",
                    marginTop: "8px",
                  }}
                >
                  {JSON.stringify(risultato, null, 2)}
                </pre>
              </div>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <a href="/chat" className="btn btn-secondary">
                  Chiedi a DYANA di approfondirlo
                </a>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

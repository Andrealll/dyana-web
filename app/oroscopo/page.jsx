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

  // Base URL del backend AstroBot:
  // puoi sovrascriverlo con NEXT_PUBLIC_ASTROBOT_API_BASE nel .env.local
  const API_BASE =
    process.env.NEXT_PUBLIC_ASTROBOT_API_BASE || "http://127.0.0.1:8001";

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Mappatura periodo italiano -> slug API esistenti
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
        ora: form.ora,   // "HH:MM"
        tier: form.tier, // "free" o "premium"
      };

      const res = await fetch(`${API_BASE}/oroscopo_ai/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Engine": "ai",
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      const text = await res.text();

      // Proviamo a interpretare la risposta come JSON (se lo è)
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

      // Se tutto ok
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

  // ==========================
  // Helpers per visualizzazione
  // ==========================

  function getIntensities(engineResult) {
    try {
      const samples =
        engineResult?.pipe?.metriche_grafico?.samples ||
        engineResult?.metriche_grafico?.samples;
      if (!samples || !samples.length) return null;

      const metrics = samples[0]?.metrics;
      if (!metrics?.intensities) return null;

      const intensities = metrics.intensities;
      return {
        energy: Math.round((intensities.energy ?? 0) * 100),
        emotions: Math.round((intensities.emotions ?? 0) * 100),
        relationships: Math.round((intensities.relationships ?? 0) * 100),
        work: Math.round((intensities.work ?? 0) * 100),
        luck: Math.round((intensities.luck ?? 0) * 100),
      };
    } catch {
      return null;
    }
  }

  function buildViewModel(data) {
    if (!data) return null;

    const engineResult = data.engine_result || null;
    const oroscopoAi = data.oroscopo_ai || null;

    // Interpretazione principale
    const interpretazione =
      oroscopoAi?.sintesi_periodo ||
      oroscopoAi?.sintesi ||
      "Nessuna interpretazione testuale disponibile.";

    // Capitoli: usiamo SOLO struttura, NON i titoli generati da Claude
    let capitoli = [];
    if (oroscopoAi && Array.isArray(oroscopoAi.capitoli)) {
      capitoli = oroscopoAi.capitoli.map((cap, idx) => ({
        id: cap.id ?? `cap-${idx}`,
        // NON usiamo cap.titolo perché i titoli attuali non ti piacciono:
        titolo: `Capitolo ${idx + 1}`,
        sintesi: cap.sintesi || null,
      }));
    }

    // Intensità 0–100
    const intensities = engineResult ? getIntensities(engineResult) : null;

    // Periodo ITA (fallback a "giornaliero")
    const periodoIta =
      engineResult?.periodo_ita ||
      (data.scope === "daily"
        ? "giornaliero"
        : data.scope === "weekly"
        ? "settimanale"
        : data.scope === "monthly"
        ? "mensile"
        : data.scope === "yearly"
        ? "annuale"
        : "giornaliero");

    return {
      interpretazione,
      capitoli,
      intensities,
      periodoIta,
    };
  }

  const viewModel = buildViewModel(risultato);

  return (
    <main className="page-root">
      <section className="landing-wrapper">
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">Genera il tuo Oroscopo</h1>
          <p className="section-subtitle">
            Seleziona il periodo e inserisci i tuoi dati: DYANA userà il motore
            di AstroBot già testato end-to-end per calcolare il tuo oroscopo.
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
              <h2 className="card-title">Il tuo Oroscopo</h2>

              {/* INTERPRETAZIONE */}
              <div style={{ marginTop: "12px" }}>
                <h3 className="card-subtitle">Interpretazione</h3>
                <p className="card-text" style={{ marginTop: "8px" }}>
                  {viewModel?.interpretazione ??
                    "Nessuna interpretazione disponibile."}
                </p>
              </div>

              {/* CAPITOLI PRINCIPALI (con titoli neutri) */}
              {viewModel?.capitoli && viewModel.capitoli.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h3 className="card-subtitle">Capitoli principali</h3>
                  <ul
                    className="card-text"
                    style={{
                      marginTop: "8px",
                      paddingLeft: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {viewModel.capitoli.map((cap) => (
                      <li key={cap.id}>
                        <strong>{cap.titolo}</strong>
                        {cap.sintesi && <> — {cap.sintesi}</>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PANORAMICA TECNICA */}
              <div style={{ marginTop: "24px" }}>
                <h3 className="card-subtitle">Panoramica tecnica</h3>
                <p className="card-text" style={{ marginTop: "6px" }}>
                  Periodo: {viewModel?.periodoIta || "giornaliero"}
                </p>

                {viewModel?.intensities && (
                  <>
                    <p className="card-text" style={{ marginTop: "10px" }}>
                      <strong>Intensità (0–100):</strong>
                    </p>
                    <ul
                      className="card-text"
                      style={{ paddingLeft: "18px", marginTop: "4px" }}
                    >
                      <li>Energia: {viewModel.intensities.energy}</li>
                      <li>Emozioni: {viewModel.intensities.emotions}</li>
                      <li>Relazioni: {viewModel.intensities.relationships}</li>
                      <li>Lavoro: {viewModel.intensities.work}</li>
                      <li>Fortuna: {viewModel.intensities.luck}</li>
                    </ul>
                  </>
                )}
              </div>

              {/* RAW JSON PER DEBUG */}
              <div style={{ marginTop: "24px" }}>
                <h3 className="card-subtitle">Dettaglio completo (raw JSON)</h3>
                <pre
                  className="card-text"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8rem",
                    marginTop: "8px",
                    maxHeight: "400px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(risultato, null, 2)}
                </pre>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

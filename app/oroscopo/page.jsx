// app/oroscopo/page.jsx

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

      const res = await fetch(`${API_BASE}/oroscopo/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 👇 Usa il motore nuovo già testato end-to-end
          "X-Engine": "new",
        },
        credentials: "include", // manda cookie se servono
        body: JSON.stringify({
          nome: form.nome || null,
          citta: form.citta,
          data: form.data, // "YYYY-MM-DD"
          ora: form.ora,   // "HH:MM"
          tier: form.tier, // "free" o "premium"
        }),
      });

      if (!res.ok) {
        throw new Error("Errore nella generazione dell'oroscopo.");
      }

      const data = await res.json();
      setRisultato(data);
    } catch (err) {
      console.error("[DYANA /oroscopo] errore:", err);
      setErrore("Impossibile generare l'oroscopo. Riprova tra qualche istante.");
    } finally {
      setLoading(false);
    }
  }

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
              <h3 className="card-title">Il tuo Oroscopo</h3>

              {/* Per ora mostriamo il JSON completo restituito dalla route esistente */}
              <pre
                className="card-text"
                style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}
              >
                {JSON.stringify(risultato, null, 2)}
              </pre>

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

// app/compatibilita/page.jsx
"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_ASTROBOT_API_BASE || "http://localhost:8001";

export default function CompatibilitaPage() {
  const [form, setForm] = useState({
    nomeA: "",
    dataA: "",
    oraA: "",
    cittaA: "",
    nomeB: "",
    dataB: "",
    oraB: "",
    cittaB: "",
    tier: "free",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        A: {
          nome: form.nomeA || "Persona A",
          data: form.dataA,
          ora: form.oraA,
          citta: form.cittaA,
        },
        B: {
          nome: form.nomeB || "Persona B",
          data: form.dataB,
          ora: form.oraB,
          citta: form.cittaB,
        },
        tier: form.tier || "free",
      };

      const res = await fetch(`${API_BASE}/sinastria_ai/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Qui in futuro potrai aggiungere Authorization: Bearer <token>
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Errore ${res.status}: ${text}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        "Si è verificato un errore durante il calcolo della compatibilità. " +
          "Verifica i dati inseriti o riprova tra poco."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-root">
      <section className="section">
        <h1 className="section-title">Compatibilità di coppia</h1>
        <p className="section-subtitle">
          DYANA, il tuo piccolo gatto nero digitale, confronta due temi natali
          per offrirti una lettura delle dinamiche di relazione: punti di forza,
          attrazioni e zone sensibili da gestire con cura.
        </p>

        {/* FORM SINASTRIA */}
        <form onSubmit={handleSubmit} className="form-grid">
          {/* BLOCCO PERSONA A */}
          <div className="card">
            <h2 className="card-title">Persona A</h2>
            <div className="form-field">
              <label className="form-label" htmlFor="nomeA">
                Nome (opzionale)
              </label>
              <input
                id="nomeA"
                name="nomeA"
                type="text"
                className="form-input"
                value={form.nomeA}
                onChange={handleChange}
                placeholder="Es. Junior"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dataA">
                Data di nascita
              </label>
              <input
                id="dataA"
                name="dataA"
                type="date"
                className="form-input"
                value={form.dataA}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="oraA">
                Ora di nascita
              </label>
              <input
                id="oraA"
                name="oraA"
                type="time"
                className="form-input"
                value={form.oraA}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="cittaA">
                Luogo di nascita
              </label>
              <input
                id="cittaA"
                name="cittaA"
                type="text"
                className="form-input"
                value={form.cittaA}
                onChange={handleChange}
                required
                placeholder="Es. Napoli"
              />
            </div>
          </div>

          {/* BLOCCO PERSONA B */}
          <div className="card">
            <h2 className="card-title">Persona B</h2>
            <div className="form-field">
              <label className="form-label" htmlFor="nomeB">
                Nome (opzionale)
              </label>
              <input
                id="nomeB"
                name="nomeB"
                type="text"
                className="form-input"
                value={form.nomeB}
                onChange={handleChange}
                placeholder="Es. Partner"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dataB">
                Data di nascita
              </label>
              <input
                id="dataB"
                name="dataB"
                type="date"
                className="form-input"
                value={form.dataB}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="oraB">
                Ora di nascita
              </label>
              <input
                id="oraB"
                name="oraB"
                type="time"
                className="form-input"
                value={form.oraB}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="cittaB">
                Luogo di nascita
              </label>
              <input
                id="cittaB"
                name="cittaB"
                type="text"
                className="form-input"
                value={form.cittaB}
                onChange={handleChange}
                required
                placeholder="Es. Roma"
              />
            </div>
          </div>

          {/* BLOCCO OPZIONI / TIER + SUBMIT */}
          <div className="card">
            <h2 className="card-title">Opzioni</h2>

            <div className="form-field">
              <label className="form-label" htmlFor="tier">
                Tipo di lettura
              </label>
              <select
                id="tier"
                name="tier"
                className="form-input"
                value={form.tier}
                onChange={handleChange}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Calcolo in corso..." : "Calcola compatibilità"}
            </button>

            <p className="section-subtitle" style={{ marginTop: "0.75rem" }}>
              DYANA non decide per te, ma ti aiuta a leggere il quadro
              astrologico della relazione in modo più lucido.
            </p>
          </div>
        </form>

        {/* STATO: ERRORE */}
        {error && (
          <p className="error-text" style={{ marginTop: "1.5rem" }}>
            {error}
          </p>
        )}

        {/* RISULTATO: PER ORA JSON GREGGIO */}
        {result && (
          <section className="section" style={{ marginTop: "2rem" }}>
            <h2 className="section-title">Risultato della sinastria</h2>
            <p className="section-subtitle">
              Questa è la risposta completa del motore AstroBot. In un secondo
              momento potremo formattarla meglio (titoli, blocchi, paragrafi).
            </p>
            <pre className="result-json">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        )}
      </section>
    </main>
  );
}

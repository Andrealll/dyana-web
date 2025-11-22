// app/oroscopo/page.jsx

"use client";
import { useState } from "react";

// Mappa periodo UI → etichetta periodo API
const PERIOD_MAP = {
  giornaliero: "daily",
  settimanale: "weekly",
  mensile: "monthly",
  annuale: "yearly",
};

const API_BASE =
  process.env.NEXT_PUBLIC_ASTROBOT_API_BASE || "http://localhost:8001";

export default function OroscopoPage() {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
    periodo: "giornaliero",
  });

  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function generaOroscopo() {
    setLoading(true);
    setErrore("");
    setRisultato(null);

    try {
      const apiPeriod = PERIOD_MAP[form.periodo];

      const url = `${API_BASE}/oroscopo_site`; // <-- USIAMO l'endpoint AI

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Engine": "new", // se il backend usa questo per attivare il motore nuovo
        },
        credentials: "include", // per il token in cookie HttpOnly
body: JSON.stringify({
  nome: form.nome || null,
  citta: form.citta || "",
  data_nascita: form.data || "",
  ora_nascita: form.ora || "",
  periodo: form.periodo,    // "giornaliero" | "settimanale" | ...
  tier: "auto",
}),
      });

      if (!res.ok) {
        throw new Error("Errore nella generazione dell'oroscopo.");
      }

      const data = await res.json();
      setRisultato(data);
    } catch (err) {
      setErrore(
        err.message || "Impossibile generare l'oroscopo. Riprova tra poco."
      );
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
            Seleziona il periodo e inserisci i tuoi dati: DYANA analizzerà i
            transiti attivi e ti offrirà una lettura chiara, sensibile e
            personalizzata.
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
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

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

              <div>
                <label className="card-text">Luogo di nascita</label>
                <input
                  type="text"
                  name="citta"
                  placeholder="es. Milano, IT"
                  value={form.citta}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

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

              <button
                onClick={generaOroscopo}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Generazione..." : "Genera Oroscopo"}
              </button>

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

              <pre className="card-text" style={{ whiteSpace: "pre-wrap" }}>
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

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
          // In futuro: Authorization: Bearer <token>
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

  // --------------------------------------------------
  // Helper per estrarre la parte AI già interpretata
  // --------------------------------------------------
  const sinastriaAi = result?.sinastria_ai || null;
  const metaAi = sinastriaAi?.meta || {};
  const areeRelazione = sinastriaAi?.aree_relazione || [];
  const puntiForza = sinastriaAi?.punti_forza || [];
  const puntiCriticita = sinastriaAi?.punti_criticita || [];
  const consigliFinali = sinastriaAi?.consigli_finali || [];

  const nomeA =
    metaAi?.nome_A || result?.input?.A?.nome || form.nomeA || "Persona A";
  const nomeB =
    metaAi?.nome_B || result?.input?.B?.nome || form.nomeB || "Persona B";

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
                placeholder="Es. Andrea"
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
                placeholder="Es. Muo"
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
                placeholder="Es. Napoli"
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

        {/* RISULTATO FORMATTATO */}
        {sinastriaAi && (
          <section className="section" style={{ marginTop: "2rem" }}>
            <h2 className="section-title">
              Lettura di compatibilità tra {nomeA} e {nomeB}
            </h2>
            <p className="section-subtitle">
              Sintesi generale · tono: {sinastriaAi?.meta?.riassunto_tono}
            </p>

            {/* SINTESI GENERALE */}
            <article className="card">
              <h3 className="card-title">Sintesi generale</h3>
              <p className="card-text">{sinastriaAi.sintesi_generale}</p>
            </article>

            {/* AREE DI RELAZIONE */}
            {areeRelazione.length > 0 && (
              <section style={{ marginTop: "1.5rem" }}>
                <h3 className="section-title">Aree principali della relazione</h3>
                <div className="cards-grid">
                  {areeRelazione.map((area) => (
                    <article key={area.id} className="card">
                      <h4 className="card-title">{area.titolo}</h4>
                      <p className="card-text">{area.sintesi}</p>
                      <p className="card-text">
                        <strong>Intensità:</strong> {area.forza} ·{" "}
                        <strong>Dinamica:</strong> {area.dinamica}
                      </p>

                      {area.aspetti_principali &&
                        area.aspetti_principali.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <p className="card-text">
                              <strong>Aspetti chiave:</strong>
                            </p>
                            <ul>
                              {area.aspetti_principali.map(
                                (asp, idx) =>
                                  asp?.descrizione && (
                                    <li key={idx}>{asp.descrizione}</li>
                                  )
                              )}
                            </ul>
                          </div>
                        )}

                      {area.consigli_pratici &&
                        area.consigli_pratici.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <p className="card-text">
                              <strong>Consigli pratici:</strong>
                            </p>
                            <ul>
                              {area.consigli_pratici.map((c, idx) => (
                                <li key={idx}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* PUNTI DI FORZA / CRITICITÀ */}
            {(puntiForza.length > 0 || puntiCriticita.length > 0) && (
              <section
                className="section"
                style={{ marginTop: "1.5rem", paddingTop: 0 }}
              >
                <div className="cards-grid">
                  {puntiForza.length > 0 && (
                    <article className="card">
                      <h3 className="card-title">Punti di forza</h3>
                      <ul>
                        {puntiForza.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </article>
                  )}

                  {puntiCriticita.length > 0 && (
                    <article className="card">
                      <h3 className="card-title">Punti di criticità</h3>
                      <ul>
                        {puntiCriticita.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </article>
                  )}
                </div>
              </section>
            )}

            {/* CONSIGLI FINALI */}
            {consigliFinali.length > 0 && (
              <article
                className="card"
                style={{ marginTop: "1.5rem", marginBottom: "1rem" }}
              >
                <h3 className="card-title">Consigli finali</h3>
                <ul>
                  {consigliFinali.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
                <p className="card-text" style={{ marginTop: "0.75rem" }}>
                  🐈‍⬛ DYANA ti ricorda: la sinastria non è una sentenza, ma una
                  mappa. Siete voi a scegliere come attraversarla.
                </p>
              </article>
            )}

            {/* DEBUG: JSON COMPLETO (OPZIONALE) */}
            <details style={{ marginTop: "1rem" }}>
              <summary>Mostra il JSON completo (debug)</summary>
              <pre className="result-json" style={{ marginTop: "0.5rem" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </section>
    </main>
  );
}

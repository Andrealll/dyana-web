"use client";

import { useState } from "react";

export default function CompatibilitaPage() {
  const [A, setA] = useState({
    nome: "",
    citta: "",
    data: "",
    ora: "",
  });

  const [B, setB] = useState({
    nome: "",
    citta: "",
    data: "",
    ora: "",
  });

  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);
  const [risultato, setRisultato] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore(null);
    setRisultato(null);
    setLoading(true);

    try {
      const body = {
        A,
        B,
        tier,
      };

      // Chiamiamo l'API interna di Next che a sua volta chiama Render
      const res = await fetch("/api/sinastria_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const data = await res.json();

      if (!data || data.status !== "ok" || !data.sinastria_ai) {
        throw new Error("Risposta sinastria_ai non valida");
      }

      setRisultato(data.sinastria_ai);
    } catch (err) {
      console.error("Errore sinastria_ai:", err);
      setErrore(
        "Si è verificato un errore durante il calcolo della compatibilità. Verifica i dati inseriti o riprova tra poco."
      );
    } finally {
      setLoading(false);
    }
  }

  const sintesi = risultato?.sintesi_generale || null;
  const aree = risultato?.aree_relazione || [];
  const puntiForza = risultato?.punti_forza || [];
  const puntiCriticita = risultato?.punti_criticita || [];
  const consigliFinali = risultato?.consigli_finali || [];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem" }}>
      <h1>Compatibilità di coppia DYANA</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
        <fieldset style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
          <legend>Persona A</legend>

          <div>
            <label>
              Nome
              <input
                type="text"
                value={A.nome}
                onChange={(e) => setA({ ...A, nome: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Città
              <input
                type="text"
                value={A.citta}
                onChange={(e) => setA({ ...A, citta: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Data di nascita
              <input
                type="date"
                value={A.data}
                onChange={(e) => setA({ ...A, data: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Ora di nascita
              <input
                type="time"
                value={A.ora}
                onChange={(e) => setA({ ...A, ora: e.target.value })}
              />
            </label>
          </div>
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
          <legend>Persona B</legend>

          <div>
            <label>
              Nome
              <input
                type="text"
                value={B.nome}
                onChange={(e) => setB({ ...B, nome: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Città
              <input
                type="text"
                value={B.citta}
                onChange={(e) => setB({ ...B, citta: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Data di nascita
              <input
                type="date"
                value={B.data}
                onChange={(e) => setB({ ...B, data: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              Ora di nascita
              <input
                type="time"
                value={B.ora}
                onChange={(e) => setB({ ...B, ora: e.target.value })}
              />
            </label>
          </div>
        </fieldset>

        <div style={{ marginBottom: "1rem" }}>
          <label>
            Tipo di analisi
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Calcolo in corso..." : "Calcola compatibilità"}
        </button>
      </form>

      {errore && (
        <p style={{ color: "red", marginTop: "1rem" }}>
          {errore}
        </p>
      )}

      {risultato && (
        <section style={{ marginTop: "2rem" }}>
          {sintesi && (
            <>
              <h2>Sintesi generale</h2>
              <p>{sintesi}</p>
            </>
          )}

          {aree.length > 0 && (
            <>
              <h3>Aree della relazione</h3>
              <ul>
                {aree.map((area, idx) => (
                  <li key={idx}>
                    <strong>{area.titolo}</strong>: {area.sintesi}
                  </li>
                ))}
              </ul>
            </>
          )}

          {puntiForza.length > 0 && (
            <>
              <h3>Punti di forza</h3>
              <ul>
                {puntiForza.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </>
          )}

          {puntiCriticita.length > 0 && (
            <>
              <h3>Punti di criticità</h3>
              <ul>
                {puntiCriticita.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </>
          )}

          {consigliFinali.length > 0 && (
            <>
              <h3>Consigli finali</h3>
              <ul>
                {consigliFinali.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

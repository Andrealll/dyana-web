// app/tema/page.jsx

"use client";
import { useState } from "react";

export default function TemaNatalePage() {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    ora: "",
    citta: "",
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

  function renderText(value) {
    if (Array.isArray(value)) {
      return value.join(" ");
    }
    return value || "";
  }

  async function generaTemaNatale() {
    setLoading(true);
    setErrore("");
    setRisultato(null);

    try {
      const res = await fetch("/api/tema-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: form.nome || null,
          citta: form.citta,
          data: form.data, // "YYYY-MM-DD"
          ora: form.ora,   // "HH:MM"
          tier: form.tier, // "free" | "premium"
        }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok" || !data.result) {
        throw new Error(
          data?.message || "Impossibile calcolare il tema natale in questo momento."
        );
      }

      setRisultato(data.result);
    } catch (err) {
      console.error("[DYANA /tema] errore:", err);
      setErrore(
        "Impossibile calcolare il tema natale. Riprova tra qualche istante."
      );
    } finally {
      setLoading(false);
    }
  }

  const isFree = form.tier === "free";

  return (
    <main className="page-root">
      <section className="landing-wrapper">
        {/* INTESTAZIONE */}
        <header className="section">
          <h1 className="section-title">Genera il tuo Tema natale</h1>
          <p className="section-subtitle">
            Inserisci i tuoi dati di nascita: DYANA userà il motore di AstroBot già
            testato end-to-end per calcolare e interpretare il tuo tema natale.
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
                onClick={generaTemaNatale}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Sto interpretando..." : "Genera Tema natale"}
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
              style={{ maxWidth: "900px", margin: "0 auto" }}
            >
              <h3 className="card-title">Interpretazione</h3>

              {isFree ? (
                <>
                  {risultato.profilo_generale && (
                    <p
                      className="card-text"
                      style={{ marginTop: "16px", whiteSpace: "pre-wrap" }}
                    >
                      {renderText(risultato.profilo_generale)}
                    </p>
                  )}
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    marginTop: "16px",
                  }}
                >
                  {risultato.profilo_generale && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Profilo generale
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.profilo_generale)}
                      </p>
                    </>
                  )}

                  {risultato.psicologia_profonda && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Psicologia profonda
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.psicologia_profonda)}
                      </p>
                    </>
                  )}

                  {risultato.amore_relazioni && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Amore e relazioni
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.amore_relazioni)}
                      </p>
                    </>
                  )}

                  {risultato.lavoro_carriera && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Lavoro e carriera
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.lavoro_carriera)}
                      </p>
                    </>
                  )}

                  {risultato.fortuna_crescita && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Fortuna e crescita
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.fortuna_crescita)}
                      </p>
                    </>
                  )}

                  {risultato.talenti && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Talenti
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.talenti)}
                      </p>
                    </>
                  )}

                  {risultato.sfide && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Sfide
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.sfide)}
                      </p>
                    </>
                  )}

                  {risultato.consigli && (
                    <>
                      <h4 className="card-title" style={{ fontSize: "1rem" }}>
                        Consigli
                      </h4>
                      <p className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                        {renderText(risultato.consigli)}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

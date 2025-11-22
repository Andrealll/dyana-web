// app/compatibilita/page.jsx

"use client";
import { useState } from "react";

export default function CompatibilitaPage() {
  const [form, setForm] = useState({
    p1_nome: "",
    p1_data: "",
    p1_ora: "",
    p1_citta: "",
    p2_nome: "",
    p2_data: "",
    p2_ora: "",
    p2_citta: ""
  });

  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function calcolaCompatibilita() {
    setLoading(true);
    setErrore("");
    setRisultato(null);

    try {
      const res = await fetch("https://TUO_BACKEND_ASTROBOT/sinastria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // invia token premium nel cookie HttpOnly
        body: JSON.stringify({
          persona1: {
            nome: form.p1_nome,
            data: form.p1_data,
            ora: form.p1_ora,
            citta: form.p1_citta
          },
          persona2: {
            nome: form.p2_nome,
            data: form.p2_data,
            ora: form.p2_ora,
            citta: form.p2_citta
          },
          scope: "sinastria"
        })
      });

      if (!res.ok) throw new Error("Errore durante il calcolo della compatibilità.");

      const data = await res.json();
      setRisultato(data);

    } catch (err) {
      setErrore("Impossibile calcolare la compatibilità. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-root">
      <section className="landing-wrapper">

        {/* HEADER */}
        <header className="section">
          <h1 className="section-title">Compatibilità & Sinastria</h1>
          <p className="section-subtitle">
            Confronta due profili astrologici e scopri l'armonia, le sfide e le 
            dinamiche profonde della relazione.
          </p>
        </header>

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
            
            <h3 className="card-title">Persona 1</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>

              <div>
                <label className="card-text">Nome</label>
                <input
                  type="text"
                  name="p1_nome"
                  value={form.p1_nome}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Data di nascita</label>
                <input
                  type="date"
                  name="p1_data"
                  value={form.p1_data}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Ora di nascita</label>
                <input
                  type="time"
                  name="p1_ora"
                  value={form.p1_ora}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Luogo di nascita</label>
                <input
                  type="text"
                  name="p1_citta"
                  placeholder="es. Milano, IT"
                  value={form.p1_citta}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* PERSONA 2 */}
            <h3 className="card-title">Persona 2</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div>
                <label className="card-text">Nome</label>
                <input
                  type="text"
                  name="p2_nome"
                  value={form.p2_nome}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Data di nascita</label>
                <input
                  type="date"
                  name="p2_data"
                  value={form.p2_data}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Ora di nascita</label>
                <input
                  type="time"
                  name="p2_ora"
                  value={form.p2_ora}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label className="card-text">Luogo di nascita</label>
                <input
                  type="text"
                  name="p2_citta"
                  placeholder="es. Roma, IT"
                  value={form.p2_citta}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Invio */}
            <button
              onClick={calcolaCompatibilita}
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "24px" }}
            >
              {loading ? "Calcolo in corso..." : "Calcola Compatibilità"}
            </button>

            {/* Errore */}
            {errore && (
              <p className="card-text" style={{ color: "#ff9a9a", marginTop: "12px" }}>
                {errore}
              </p>
            )}

          </div>
        </section>

        {/* RISULTATO */}
        {risultato && (
          <section className="section">
            <div className="card" style={{ maxWidth: "900px", margin: "0 auto" }}>
              <h3 className="card-title">Risultato della Compatibilità</h3>

              <pre className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(risultato, null, 2)}
              </pre>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <a href="/chat" className="btn btn-secondary">
                  Chiedi a DYANA di interpretare la relazione
                </a>
              </div>
            </div>
          </section>
        )}

      </section>
    </main>
  );
}

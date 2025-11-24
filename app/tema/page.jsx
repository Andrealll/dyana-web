"use client";
import { useState } from "react";

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
    tier: "free", // free / premium
  });

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [risultato, setRisultato] = useState(null);      // JSON completo
  const [sinastriaAI, setSinastriaAI] = useState(null);  // risultato.sinastria_ai

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function generaCompatibilita() {
    setLoading(true);
    setErrore("");
    setRisultato(null);
    setSinastriaAI(null);

    try {
      const payload = {
        A: {
          citta: form.cittaA,
          data: form.dataA,  // YYYY-MM-DD
          ora: form.oraA,    // HH:MM
          nome: form.nomeA || null,
        },
        B: {
          citta: form.cittaB,
          data: form.dataB,
          ora: form.oraB,
          nome: form.nomeB || null,
        },
        tier: form.tier,
      };

      const res = await fetch("/api/sinastria_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        console.log("[DYANA /sinastria_ai] status non OK:", res.status);
        console.log("[DYANA /sinastria_ai] body errore:", data);
        setErrore(
          (data && data.error) ||
            `Errore nella generazione della compatibilità (status ${res.status}).`
        );
        setLoading(false);
        return;
      }

      setRisultato(data);
      setSinastriaAI(data?.sinastria_ai || null);
    } catch (err) {
      console.error("[DYANA /sinastria_ai] errore fetch:", err);
      setErrore(
        "Impossibile comunicare con il server. Controlla la connessione e riprova."
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
          <h1 className="section-title">Compatibilità di Coppia</h1>
          <p className="section-subtitle">
            Inserisci i dati di nascita delle due persone: DYANA userà il
            motore AI di AstroBot (<code>/sinastria_ai</code>) per valutare
            l&apos;affinità astrologica e restituire un quadro sintetico
            della relazione. Usa il campo Livello per testare le versioni
            free e premium.
          </p>
        </header>

        {/* FORM */}
        <section className="section">
          <div className="card" style={{ maxWidth: "850px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* BLOCCO PERSONA A + PERSONA B */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "18px",
                }}
              >
                {/* PERSONA A */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>
                    Persona A
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div>
                      <label className="card-text">Nome</label>
                      <input
                        type="text"
                        name="nomeA"
                        value={form.nomeA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="card-text">Luogo di nascita</label>
                      <input
                        type="text"
                        name="cittaA"
                        value={form.cittaA}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Es. Milano, IT"
                      />
                    </div>

                    <div>
                      <label className="card-text">Data di nascita</label>
                      <input
                        type="date"
                        name="dataA"
                        value={form.dataA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="card-text">Ora di nascita</label>
                      <input
                        type="time"
                        name="oraA"
                        value={form.oraA}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* PERSONA B */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <h3 className="card-title" style={{ marginBottom: "8px" }}>
                    Persona B
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div>
                      <label className="card-text">Nome</label>
                      <input
                        type="text"
                        name="nomeB"
                        value={form.nomeB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="card-text">Luogo di nascita</label>
                      <input
                        type="text"
                        name="cittaB"
                        value={form.cittaB}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Es. Napoli, IT"
                      />
                    </div>

                    <div>
                      <label className="card-text">Data di nascita</label>
                      <input
                        type="date"
                        name="dataB"
                        value={form.dataB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="card-text">Ora di nascita</label>
                      <input
                        type="time"
                        name="oraB"
                        value={form.oraB}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVELLO */}
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

              {/* BOTTONE */}
              <button
                onClick={generaCompatibilita}
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: "14px" }}
              >
                {loading ? "Calcolo in corso..." : "Calcola compatibilità"}
              </button>

              {/* ERRORE */}
              {errore && (
                <p className="card-text" style={{ color: "#ff9a9a" }}>
                  {errore}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SINTESI GENERALE */}
        {sinastriaAI?.sintesi_generale && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Sintesi della relazione</h3>
              <p
                className="card-text"
                style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}
              >
                {sinastriaAI.sintesi_generale}
              </p>
            </div>
          </section>
        )}

        {/* AREE DELLA RELAZIONE */}
        {sinastriaAI?.aree_relazione &&
          sinastriaAI.aree_relazione.length > 0 && (
            <section className="section">
              <div
                className="card"
                style={{ maxWidth: "850px", margin: "0 auto" }}
              >
                <h3 className="card-title">Aree della relazione</h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    marginTop: 8,
                  }}
                >
                  {sinastriaAI.aree_relazione.map((area) => (
                    <div key={area.id}>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        {area.titolo}
                      </h4>

                      {area.sintesi && (
                        <p
                          className="card-text"
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: 6,
                          }}
                        >
                          {area.sintesi}
                        </p>
                      )}

                      {/* Aspetti principali */}
                      {Array.isArray(area.aspetti_principali) &&
                        area.aspetti_principali.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <p
                              className="card-text"
                              style={{
                                fontWeight: 500,
                                marginBottom: 2,
                              }}
                            >
                              Aspetti principali:
                            </p>
                            <ul
                              className="card-text"
                              style={{ paddingLeft: "1.2rem" }}
                            >
                              {area.aspetti_principali.map((asp, idx) => (
                                <li key={idx}>{asp.descrizione}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Consigli pratici */}
                      {Array.isArray(area.consigli_pratici) &&
                        area.consigli_pratici.length > 0 && (
                          <div>
                            <p
                              className="card-text"
                              style={{
                                fontWeight: 500,
                                marginBottom: 2,
                              }}
                            >
                              Consigli pratici:
                            </p>
                            <ul
                              className="card-text"
                              style={{ paddingLeft: "1.2rem" }}
                            >
                              {area.consigli_pratici.map((c, idx) => (
                                <li key={idx}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        {/* PUNTI FORZA / CRITICITÀ / CONSIGLI FINALI */}
        {(sinastriaAI?.punti_forza ||
          sinastriaAI?.punti_criticita ||
          sinastriaAI?.consigli_finali) && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Focus principali della relazione</h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginTop: 8,
                }}
              >
                {/* Punti di forza */}
                {Array.isArray(sinastriaAI?.punti_forza) &&
                  sinastriaAI.punti_forza.length > 0 && (
                    <div>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        Punti di forza
                      </h4>
                      <ul
                        className="card-text"
                        style={{ paddingLeft: "1.2rem" }}
                      >
                        {sinastriaAI.punti_forza.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Punti di criticità */}
                {Array.isArray(sinastriaAI?.punti_criticita) &&
                  sinastriaAI.punti_criticita.length > 0 && (
                    <div>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        Punti di attenzione
                      </h4>
                      <ul
                        className="card-text"
                        style={{ paddingLeft: "1.2rem" }}
                      >
                        {sinastriaAI.punti_criticita.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Consigli finali */}
                {Array.isArray(sinastriaAI?.consigli_finali) &&
                  sinastriaAI.consigli_finali.length > 0 && (
                    <div>
                      <h4
                        className="card-text"
                        style={{ fontWeight: 600, marginBottom: 4 }}
                      >
                        Consigli finali
                      </h4>
                      <ul
                        className="card-text"
                        style={{ paddingLeft: "1.2rem" }}
                      >
                        {sinastriaAI.consigli_finali.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* DEBUG */}
        {risultato && (
          <section className="section">
            <div
              className="card"
              style={{ maxWidth: "850px", margin: "0 auto" }}
            >
              <h3 className="card-title">Dettagli Sinastria (debug)</h3>
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

// app/come-funziona/page.jsx

export default function ComeFunziona() {
  return (
    <main className="page-root">
      <section className="landing-wrapper">

        {/* TITOLO PAGINA */}
        <header className="section">
          <h1 className="section-title">Come funziona DYANA</h1>
          <p className="section-subtitle">
            Un percorso semplice e intuitivo, basato su astrologia reale e un motore AI che comprende il tuo contesto.
          </p>
        </header>

        {/* SEZIONE A STEP */}
        <section className="section">
          <div className="cards-grid">

            <article className="card">
              <h3 className="card-title">1. Raccolta delle informazioni</h3>
              <p className="card-text">
                DYANA utilizza data, ora e luogo di nascita per identificare i tuoi elementi fondamentali: Sole, Luna,
                ascendente, pianeti, case e configurazioni chiave.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">2. Interpretazione del profilo</h3>
              <p className="card-text">
                La tua struttura astrologica viene letta come un insieme dinamico: energia personale, sensibilità,
                punti di forza, blocchi e modalità con cui affronti le situazioni.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">3. Analisi del momento</h3>
              <p className="card-text">
                I transiti attivi nel periodo vengono analizzati per capire quali temi stanno emergendo ora nella tua
                vita: decisioni, difficoltà, opportunità o risonanze emotive.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">4. Risposta personalizzata</h3>
              <p className="card-text">
                DYANA integra astrologia e AI per darti una risposta chiara, sensibile e basata su ciò che è davvero
                importante per te in questo momento.
              </p>
            </article>

          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="section section-chat">
          <p className="section-subtitle">
            Ora che sai come funziona, puoi iniziare a parlare direttamente con DYANA.
          </p>

          <div className="chat-placeholder">
            <p className="chat-placeholder-text">
              Vai alla{" "}
              <a href="/chat" className="btn btn-primary">
                chat di DYANA
              </a>{" "}
              e inizia la tua esperienza personale.
            </p>
          </div>
        </section>

      </section>
    </main>
  );
}

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

            {/* ✅ NUOVO BOX 5 */}
            <article className="card">
              <h3 className="card-title">5. Come si usano i crediti</h3>
              <p className="card-text">
                Le funzionalità premium consumano crediti. Quando avvii una lettura premium, DYANA verifica il tuo
                saldo e scala automaticamente i crediti necessari. Se non hai crediti sufficienti, ti verrà mostrato un
                messaggio con la soluzione (es. acquistare un pacchetto crediti).
              </p>
              <p className="card-text" style={{ opacity: 0.85, marginTop: 10 }}>
                I crediti servono per sbloccare letture più complete e personalizzate (es. approfondimenti, periodi più
                lunghi, analisi più dettagliate).
              </p>
            </article>

            {/* ✅ NUOVO BOX 6 */}
            <article className="card">
              <h3 className="card-title">6. Crediti gratuiti: 5 all’iscrizione + 1 al giorno</h3>
              <p className="card-text">
                Quando ti iscrivi, ricevi subito <strong>5 crediti gratuiti</strong> per iniziare a usare DYANA in modo
                completo. In più, ogni giorno ricevi <strong>1 credito gratuito</strong> per continuare a leggere anche
                senza acquistare.
              </p>
              <p className="card-text" style={{ opacity: 0.85, marginTop: 10 }}>
                Nota: i crediti gratuiti giornalieri vengono assegnati automaticamente secondo la logica del tuo account.
              </p>
            </article>
          </div>
        </section>

        {/* ✅ CTA rimossa (non più necessaria) */}
      </section>
    </main>
  );
}

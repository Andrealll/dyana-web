// app/page.jsx
import Image from "next/image";

export default function Home() {
  return (
    <main className="page-root">
      {/* SPLASH CON LOGO + SOTTOTITOLO + BOTTONI */}
      <section className="splash-wrapper">
        <div className="splash-inner">
          <div className="splash-content">
            <Image
              src="/dyana-logo.png"
              alt="DYANA"
              className="splash-logo-img"
              width={1000}
              height={1000}
              priority
            />

            {/* SOTTOTITOLO SUBITO SOTTO IL LOGO */}
            <p className="splash-subtitle">
              L&apos;assistente intuitivo che unisce astrologia, AI e
              introspezione per guidarti nelle decisioni quotidiane.
            </p>

            {/* BOTTONI PRINCIPALI */}
            <div className="hero-actions">
              <a href="/come-funziona" className="btn btn-primary">
                Scopri come funziona
              </a>
              <a href="/chat" className="btn btn-secondary">
                Prova la chat di DYANA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LANDING PRINCIPALE */}
      <section id="landing" className="landing-wrapper">
        {/* SEZIONE CARDS / FEATURES */}
        <section id="features" className="section section-features">
          <h2 className="section-title">Cosa può fare DYANA per te</h2>
          <p className="section-subtitle">
            DYANA combina astrologia e intelligenza artificiale per offrirti
            indicazioni pratiche, chiare e personalizzate.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Oroscopo personalizzato</h3>
              <p className="card-text">
                Non il solito segno generico: DYANA usa il tuo profilo
                astrologico per generare indicazioni su misura.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Focus sulle decisioni</h3>
              <p className="card-text">
                Supporto mirato su lavoro, relazioni e crescita personale, con
                un linguaggio chiaro e concreto.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Motore intelligente</h3>
              <p className="card-text">
                Un motore AI che integra calcoli astrologici avanzati per
                offrirti risposte coerenti, profonde e intuitive.
              </p>
            </article>
          </div>
        </section>

        {/* SEZIONE CHAT (DYANA) */}
        <section id="chat" className="section section-chat">
          <h2 className="section-title">Chatta con DYANA</h2>
          <p className="section-subtitle">
            Qui potrai parlare direttamente con DYANA, il tuo assistente
            digitale basato su astrologia e intelligenza artificiale.
          </p>

          <div className="chat-placeholder">
            <p className="chat-placeholder-text">
              Prossimo step: collegare questa sezione al motore conversazionale
              di DYANA e rendere la chat completamente interattiva.
            </p>
          </div>
        </section>

        {/* FOOTER SEMPLICE */}
        <footer className="footer">
          <p className="footer-text">
            <span className="footer-brand">DYANA</span> · tutti i diritti
            riservati · {new Date().getFullYear()}
          </p>
        </footer>
      </section>
    </main>
  );
}

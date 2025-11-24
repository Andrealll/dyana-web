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

            {/* SOTTOTITOLO SOTTO IL LOGO */}
            <p className="splash-subtitle">
              L&apos;assistente intuitivo che unisce astrologia, AI e
              introspezione per guidarti nelle decisioni quotidiane.
            </p>

            {/* PICCOLA INTRO DEL GATTINO NERO */}
            <p className="splash-subtitle">
              🐈‍⬛ DYANA è la tua guida astrologica:
              curiosa, intuitiva e sempre pronto a darti una lettura su misura.
            </p>

            {/* BOTTONI PRINCIPALI: PERCORSI "PRODOTTO" */}
            <div className="hero-actions">
              <a href="/oroscopo" className="btn btn-primary">
                Fai il tuo oroscopo
              </a>
              <a href="/tema" className="btn btn-secondary">
                Calcola il tema natale
              </a>
              <a href="/compatibilita" className="btn btn-secondary">
                Verifica la compatibilità
              </a>
            </div>

            {/* SECONDA RIGA DI BOTTONI, CON PIÙ SPAZIO SOPRA */}
            <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
              <a href="/come-funziona" className="btn btn-secondary">
                Scopri come funziona
              </a>
              <a href="/chat" className="btn btn-secondary">
                Chatta con DYANA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LANDING PRINCIPALE */}
      <section id="landing" className="landing-wrapper">
        {/* SEZIONE: SCEGLI DA DOVE INIZIARE */}
        <section className="section section-features">
          <h2 className="section-title">Scegli da dove iniziare</h2>
          <p className="section-subtitle">
            DYANA usa il motore astrologico di AstroBot per offrirti percorsi diversi:
            dall&apos;oroscopo quotidiano al tema natale, fino alla compatibilità di coppia.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Oroscopo personalizzato</h3>
              <p className="card-text">
                Vai oltre il semplice segno zodiacale: DYANA combina il tuo profilo
                astrologico con i transiti del momento per darti indicazioni mirate.
              </p>
              <a href="/oroscopo" className="btn btn-primary">
                Vai all&apos;oroscopo
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">Tema natale</h3>
              <p className="card-text">
                Esplora la mappa simbolica con cui sei natə: pianeti, case e aspetti
                letti in chiave pratica, per conoscersi meglio e prendere decisioni più lucide.
              </p>
              <a href="/tema" className="btn btn-secondary">
                Calcola il tema natale
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">Compatibilità e relazioni</h3>
              <p className="card-text">
                Confronta due profili astrologici per capire meglio dinamiche, punti di forza
                e aree sensibili della relazione, senza frasi fatte.
              </p>
              <a href="/compatibilita" className="btn btn-secondary">
                Verifica compatibilità
              </a>
            </article>
          </div>
        </section>

        {/* SEZIONE: PAGINE DI SPIEGAZIONE / APPROFONDIMENTO */}
        <section id="features" className="section section-features">
          <h2 className="section-title">Vuoi prima capire meglio come funziona?</h2>
          <p className="section-subtitle">
            Se preferisci avere una panoramica prima di iniziare, DYANA ti guida passo passo
            con alcune pagine di spiegazione.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Come funziona DYANA</h3>
              <p className="card-text">
                Una panoramica semplice su come DYANA usa astrologia e AI
                per generare oroscopi e letture personalizzate.
              </p>
              <a href="/come-funziona" className="btn btn-secondary">
                Apri la pagina
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">Per chi è pensata</h3>
              <p className="card-text">
                Capisci se DYANA è adatta a te: decisioni, relazioni, lavoro,
                momenti di cambiamento o semplice curiosità.
              </p>
              <a href="/per-chi-e" className="btn btn-secondary">
                Scopri di più
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">Dietro le quinte</h3>
              <p className="card-text">
                Una finestra sul motore sottostante: AstroBot, calcoli astrologici,
                transiti e integrazione con l&apos;intelligenza artificiale.
              </p>
              <a href="/dietro-le-quinte" className="btn btn-secondary">
                Vai alla sezione
              </a>
            </article>
          </div>
        </section>

        {/* SEZIONE CHAT (DYANA) */}
        <section id="chat" className="section section-chat">
          <h2 className="section-title">Chatta con DYANA</h2>
          <p className="section-subtitle">
            Qui potrai parlare direttamente con DYANA, il tuo piccolo gatto nero digitale
            basato su astrologia e intelligenza artificiale.
          </p>

          <div className="chat-placeholder">
            <p className="chat-placeholder-text">
              Prossimo step: collegare questa sezione al motore conversazionale
              di DYANA e rendere la chat completamente interattiva.
            </p>
            <p className="chat-placeholder-text">
              Nel frattempo puoi usare la pagina <a href="/chat">chat</a> per
              testare le risposte di DYANA.
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

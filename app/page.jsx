// app/page.jsx
import Image from "next/image";
import DyanaNavbar from "../components/DyanaNavbar";
import CookieBanner from "../components/CookieBanner";


export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className="page-root">
      {/* NAVBAR PRINCIPALE */}
      <DyanaNavbar />

      {/* HERO / SPLASH */}
      <section className="splash-wrapper">
        <div className="splash-inner">
          <div className="splash-content">
            {/* BLOCCO LOGO + TESTO INTRO */}
            <div className="splash-column splash-column-main">
              <Image
                src="/dyana-logo.png"
                alt="DYANA"
                className="splash-logo-img"
                width={1000}
                height={1000}
                priority
              />

              <p className="splash-subtitle">
                La tua guida astrologica potenziata dall&apos;intelligenza artificiale.
                DYANA interpreta la tua storia, ti accompagna nelle scelte
                quotidiane e ti offre letture davvero personali.
              </p>

              <p className="splash-subtitle">
                🐈‍⬛ Non un semplice oroscopo: DYANA &quot;parla&quot;, comprende
                il tuo profilo e risponde alle tue domande.
                Con le richieste premium puoi anche approfondire e ottenere
                chiarimenti mirati.
              </p>
            </div>

            {/* BLOCCO AZIONI PRINCIPALI */}
            <div className="splash-column splash-column-actions">
              <h2 className="section-title" style={{ marginBottom: "1rem" }}>
                Da dove vuoi iniziare?
              </h2>

              {/* PRIMA RIGA: PRODOTTI PRINCIPALI */}
              <div className="hero-actions">
                <a href="/oroscopo" className="btn btn-primary">
                  Oroscopo personalizzato
                </a>
                <a href="/tema" className="btn btn-primary">
                  Tema natale completo
                </a>
                <a href="/compatibilita" className="btn btn-primary">
                  Compatibilità tra due persone
                </a>
              </div>

              {/* SECONDA RIGA: INFO + ACCOUNT + CREDITI + PRIVACY */}
              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href="/come-funziona" className="btn btn-secondary">
                  Come funziona DYANA
                </a>
                <a href="/login" className="btn btn-secondary">
                  Accesso utenti iscritti
                </a>
                <a href="/area-personale" className="btn btn-secondary">
                  Area personale
                </a>
                <a href="/crediti" className="btn btn-secondary">
                  Acquista letture premium
                </a>
                <a href="/privacy" className="btn btn-secondary">
                  Privacy policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* LANDING PRINCIPALE */}
      <section id="landing" className="landing-wrapper">
        {/* SEZIONE: PERCHÉ NON È L'OROSCOPO COPIA-INCOLLA */}
        <section className="section section-features">
          <h2 className="section-title">Basta oroscopi tutti uguali</h2>
          <p className="section-subtitle">
            I Leoni sono tutti egocentrici! E le vergini? Delle gran Pignole! I gemelli doppia faccia, e i cancro?? uhh i cancro!
			Non ti ci ritrovi? Allora sei nel posto giusto! DYANA è pensata esattamente per questo.
            Ogni lettura parte da te, non da un testo preconfezionato.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Non solo il tuo segno</h3>
              <p className="card-text">
                DYANA non si limita ai soliti cliché sui segni zodiacali.
                Attraverso un potente motore di calcolo, considera il tuo profilo completo 
				e costruisce la lettura su tutti gli aspetti astrologici che ti caratterizzano in modo unico,
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">La potenza dell'AI</h3>
              <p className="card-text">
                Spesso capita, anche su siti specializzati, di trovare un muro di aspetti
				anche contraddittori tra loro senza alcun nesso logico. Dyana elabora tutti i tuoi aspetti 
				e aggancia informazioni da molti approcci e scuole astrologiche diverse attraverso l'AI per darti un'interpretazione chiara.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Dyana, la tua astrologa personale sempre con te</h3>
              <p className="card-text">
                Con le letture premium non ricevi solo un testo strutturato e coerente:
                puoi fare domande mirate, chiedere chiarimenti e andare a fondo
                proprio sui punti che ti colpiscono di più.
              </p>
            </article>
          </div>
        </section>

        {/* SEZIONE: COSA PUOI CHIEDERE A DYANA */}
        <section className="section section-features">
          <h2 className="section-title">Cosa puoi chiedere a DYANA</h2>
          <p className="section-subtitle">
            Oroscopo, tema natale, compatibilità: gli strumenti sono gli stessi
            dell’astrologia tradizionale, ma il modo in cui DYANA li usa è
            cucito su di te.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Oroscopo personalizzato</h3>
              <p className="card-text">
                Non un messaggio valido per chiunque abbia il tuo segno,
                ma una lettura che tiene conto del tuo momento e delle
                aree della vita che ti stanno più a cuore.
              </p>
              <a href="/oroscopo" className="btn btn-primary">
                Inizia l’oroscopo
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">Tema natale</h3>
              <p className="card-text">
                Una base solida per capire chi sei: il tema natale diventa
                una mappa pratica, che DYANA usa per interpretare meglio anche
                le letture successive.
              </p>
              <a href="/tema" className="btn btn-primary">
                Calcola il tuo tema
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">Compatibilità</h3>
              <p className="card-text">
                Non ti dice se “siete destinati o no”, ma come funziona
                davvero la dinamica tra voi: dove scorre, dove gratta e
                su cosa ha senso lavorare insieme.
              </p>
              <a href="/compatibilita" className="btn btn-primary">
                Verifica compatibilità
              </a>
            </article>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p className="footer-text">
            <span className="footer-brand">DYANA</span> · tutti i diritti
            riservati · {year}
          </p>
        </footer>
      </section>
    </main>
  );
}
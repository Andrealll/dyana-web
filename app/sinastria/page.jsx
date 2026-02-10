import Image from "next/image";
import DyanaNavbar from "../../components/DyanaNavbar";

export const metadata = {
  title: "Sinastria di coppia | San Valentino | DYANA",
  description:
    "Altro che test da social. Scopri la vostra compatibilità astrologica con DYANA: sinastria di coppia personalizzata, chiara e ironica. Perfetta per San Valentino.",
};

export default function SinastriaSanValentinoPage() {
  const year = new Date().getFullYear();

  return (
    <main className="page-root">
      <DyanaNavbar />

      {/* HERO */}
      <section className="splash-wrapper">
        <div className="splash-inner">
          <div className="splash-content">
            <div className="splash-column splash-column-main">
              <Image
                src="/dyana-logo.png"
                alt="DYANA"
                className="splash-logo-img"
                width={900}
                height={900}
                priority
              />

              <h1 className="section-title" style={{ marginTop: "1rem" }}>
                Sinastria di coppia · Speciale San Valentino
              </h1>

              <p className="splash-subtitle">
                “Siete compatibili?” è facile dirlo.
                <br />
                Il difficile è capirlo davvero.
              </p>

              <p className="splash-subtitle">
                🐈‍⬛ DYANA legge il vostro cielo (non i cliché) e ti dice
                cosa funziona, cosa vi incastra e dove vi fate male.
              </p>

              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href="/compatibilita" className="btn btn-primary">
                  Scopri la nostra compatibilità
                </a>
              </div>

              <p className="card-text" style={{ marginTop: "1rem", opacity: 0.85 }}>
                Niente “anime gemelle” preconfezionate.
                <br />
                Niente “se è destino si vedrà”.
                <br />
                Solo una lettura personale, chiara e utilizzabile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENUTO */}
      <section className="landing-wrapper">
        {/* BASTA TEST DA SOCIAL */}
        <section className="section section-features">
          <h2 className="section-title">Basta test da social e frasi da biscotto</h2>
          <p className="section-subtitle">
            “Se ti cerca è interessato.” <br />
            “Se è geloso ti ama.” <br />
            “Se litigate è passione.”
          </p>

          <p className="section-subtitle">
            Sì, certo. Poi però ci vivi dentro.
          </p>

          <p className="section-subtitle">
            DYANA fa un’altra cosa: prende i vostri dati di nascita e costruisce
            una lettura di coppia che parla di dinamiche reali (non di speranze).
          </p>
        </section>

        {/* COSA È LA SINASTRIA */}
        <section className="section section-features">
          <h2 className="section-title">Cos’è la sinastria (in italiano normale)</h2>
          <p className="section-subtitle">
            La sinastria confronta due cieli: come vi attivate a vicenda,
            dove vi capite al volo e dove vi “innescate”.
          </p>
          <p className="section-subtitle">
            Non è “compatibilità segni”. È compatibilità tra persone.
            Il segno è l’inizio della storia, non la storia.
          </p>
        </section>

        {/* COSA SCOPRI */}
        <section className="section section-features">
          <h2 className="section-title">Cosa scopri nella sinastria DYANA</h2>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Attrazione e chimica</h3>
              <p className="card-text">
                Se l’attrazione è naturale o vi state convincendo a forza.
                E come si manifesta (fisica, mentale, emotiva).
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Comunicazione</h3>
              <p className="card-text">
                Dove vi capite al volo e dove invece vi fraintendete sempre
                (anche quando “parlate tantissimo”).
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Punti critici</h3>
              <p className="card-text">
                Le frizioni tipiche: controllo, distanza, gelosia,
                aspettative, ritmi incompatibili.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Stabilità nel tempo</h3>
              <p className="card-text">
                Se la relazione regge davvero o è fatta di picchi e crolli.
                E cosa serve per farla funzionare.
              </p>
            </article>
          </div>
        </section>

        {/* PERCHÉ SAN VALENTINO */}
        <section className="section section-features">
          <h2 className="section-title">Perché è perfetta per San Valentino</h2>
          <p className="section-subtitle">
            Un regalo diverso: non una cosa “carina”. Una cosa che vi riguarda.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">È personale</h3>
              <p className="card-text">
                Basata sui vostri dati. Non su “consigli validi per tutti”.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">È immediata</h3>
              <p className="card-text">
                Risultato in pochi minuti. Zero attese, zero complicazioni.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">È utile</h3>
              <p className="card-text">
                Ti dice dove lavorare e cosa smettere di interpretare male.
              </p>
            </article>
          </div>

          <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
            <a href="/compatibilita" className="btn btn-primary">
              Calcola la sinastria
            </a>
          </div>
        </section>

        {/* COME FUNZIONA */}
        <section className="section section-features">
          <h2 className="section-title">Come funziona DYANA</h2>
          <p className="section-subtitle">Semplice. Diretto. In pochi minuti.</p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">1) Inserisci i dati</h3>
              <p className="card-text">
                Due persone, due cieli. DYANA usa ciò che serve per una lettura reale.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">2) DYANA elabora</h3>
              <p className="card-text">
                Collega gli aspetti tra voi e costruisce una lettura coerente e leggibile.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">3) Leggi e approfondisci</h3>
              <p className="card-text">
                Capisci la dinamica e puoi approfondire con domande mirate.
              </p>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-features">
          <h2 className="section-title">Domande frequenti sulla sinastria</h2>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">
                È solo compatibilità tra segni zodiacali?
              </h3>
              <p className="card-text">
                No. La sinastria confronta due carte natali. Il segno da solo è troppo poco.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">
                Serve sapere l’ora di nascita?
              </h3>
              <p className="card-text">
                Aiuta molto (case/ascendente). Se non la sai, puoi comunque iniziare,
                ma la lettura sarà meno precisa.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">
                È una “sentenza” sulla relazione?
              </h3>
              <p className="card-text">
                No. È una mappa: ti mostra dinamiche, punti forti e frizioni tipiche.
                Poi decidete voi cosa farne.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">
                Quanto tempo ci vuole?
              </h3>
              <p className="card-text">
                Pochi minuti. Inserisci i dati, DYANA elabora e leggi subito.
              </p>
            </article>
          </div>
        </section>

        {/* CTA FINALE */}
        <section className="section section-features">
          <h2 className="section-title">Ok. Ma voi due, come siete messi davvero?</h2>

          <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
            <a href="/compatibilita" className="btn btn-primary">
              Scopri la compatibilità adesso
            </a>
          </div>
        </section>

        <footer className="footer">
          <p className="footer-text">
            <span className="footer-brand">DYANA</span> · tutti i diritti riservati · {year}
          </p>
        </footer>
      </section>
    </main>
  );
}

// app/oroscopo2026/page.jsx
import Image from "next/image";
import DyanaNavbar from "../../components/DyanaNavbar";

export const metadata = {
  title: "Oroscopo 2026 personalizzato | DYANA",
  description:
    "Basta con i soliti cliché. Scopri il tuo Oroscopo 2026 personalizzato con DYANA: chiaro, ironico e su misura.",
};

export default function Oroscopo2026Page() {
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
                Oroscopo 2026 personalizzato
              </h1>

              <p className="splash-subtitle">
                Il 2026 non sarà uguale per tutti.  
                L’oroscopo generico sì.
              </p>

              <p className="splash-subtitle">
                🐈‍⬛ DYANA crea il tuo Oroscopo 2026 partendo dal tuo cielo,
                non da frasi valide per chiunque.
              </p>

              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href="/oroscopo" className="btn btn-primary">
                  Scopri il mio Oroscopo 2026
                </a>
              </div>

              <p className="card-text" style={{ marginTop: "1rem", opacity: 0.85 }}>
                Niente promesse vaghe.  
                Niente “anno di cambiamenti” copia-incolla.  
                Solo una lettura chiara, concreta e personale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENUTO */}
      <section className="landing-wrapper">
        {/* BASTA CLICHÉ */}
        <section className="section section-features">
          <h2 className="section-title">Basta con i soliti cliché zodiacali</h2>
          <p className="section-subtitle">
            “Segui il tuo cuore.”  
            “Nuove opportunità in arrivo.”  
            “Sarà un anno importante.”
          </p>

          <p className="section-subtitle">
            Frasi che vanno bene per tutti.  
            Quindi non servono a nessuno.
          </p>

          <p className="section-subtitle">
            DYANA fa un’altra cosa: legge come si muove il tuo cielo nel 2026  
            e traduce tutto in indicazioni comprensibili.
          </p>
        </section>

        {/* COSA SCOPRI */}
        <section className="section section-features">
          <h2 className="section-title">Cosa scopri nel tuo Oroscopo 2026</h2>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Le aree chiave dell’anno</h3>
              <p className="card-text">
                Capisci dove il 2026 spinge di più: lavoro, relazioni,
                cambiamenti personali, decisioni importanti.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">I momenti giusti</h3>
              <p className="card-text">
                Quando forzare, quando aspettare, quando cambiare strategia.
                Senza andare a tentoni.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Le tensioni da gestire</h3>
              <p className="card-text">
                Individui in anticipo i punti critici dell’anno,
                prima che diventino problemi.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Le opportunità reali</h3>
              <p className="card-text">
                Non promesse vaghe, ma possibilità concrete,
                coerenti con il tuo profilo.
              </p>
            </article>
          </div>
        </section>

        {/* COME FUNZIONA */}
        <section className="section section-features">
          <h2 className="section-title">Come funziona DYANA</h2>
          <p className="section-subtitle">
            Semplice. Diretto. In pochi minuti.
          </p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">1) Inserisci i tuoi dati</h3>
              <p className="card-text">
                Quel che serve per rendere la lettura davvero personale.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">2) DYANA elabora</h3>
              <p className="card-text">
                L’AI collega i dati astrologici e costruisce
                il tuo Oroscopo 2026.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">3) Leggi e approfondisci</h3>
              <p className="card-text">
                Puoi fermarti alla lettura base o andare più a fondo
                con domande mirate.
              </p>
            </article>
          </div>
        </section>

        {/* CTA FINALE */}
        <section className="section section-features">
          <h2 className="section-title">Il tuo 2026 non è uguale a quello degli altri</h2>

          <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
            <a href="/oroscopo" className="btn btn-primary">
              Inizia il tuo Oroscopo 2026
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-features">
          <h2 className="section-title">FAQ</h2>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">È un oroscopo per segno?</h3>
              <p className="card-text">
                No. Il segno da solo non basta per descrivere un anno intero.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">È gratis?</h3>
              <p className="card-text">
                Puoi iniziare gratuitamente e decidere se approfondire.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Serve l’ora di nascita?</h3>
              <p className="card-text">
                Se la hai, la lettura è più precisa. Se no, puoi comunque iniziare.
              </p>
            </article>
          </div>
        </section>

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

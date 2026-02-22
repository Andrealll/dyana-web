import Image from "next/image";
import DyanaNavbar from "../../components/DyanaNavbar";

export const metadata = {
  title: "Scopri il tuo profilo personale | DYANA",
  description:
    "Sai davvero chi sei? Inserisci i tuoi dati e scopri il tuo profilo personale con una lettura chiara, fatta su di te.",
};

export default function ProfiloPersonaleLandingPage() {
  const year = new Date().getFullYear();

  // ✅ Cambia QUI se vuoi puntare a un’altra pagina
  const CTA_HREF = "/tema"; // oppure "/profilo" se hai già un form dedicato

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
                Sai davvero chi sei?
              </h1>

              <p className="splash-subtitle">
                Scopri il tuo profilo personale con una lettura fatta su di te.
              </p>

              <p className="splash-subtitle">
                🐈‍⬛ Niente frasi generiche. Niente test da social.
                <br />
                Solo una lettura chiara: punti forti, emozioni e modo di vivere.
              </p>

              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href={CTA_HREF} className="btn btn-primary">
                  Scopri il tuo profilo
                </a>
              </div>

              <p className="card-text" style={{ marginTop: "1rem", opacity: 0.85 }}>
                In pochi minuti.
                <br />
                Semplice.
                <br />
                Fatto su di te.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENUTO */}
      <section className="landing-wrapper">
        {/* STOP TEST GENERICI */}
        <section className="section section-features">
          <h2 className="section-title">Basta etichette e frasi fatte</h2>
          <p className="section-subtitle">
            “Sei così.” <br />
            “Tu fai sempre cosà.” <br />
            “È solo carattere.”
          </p>

          <p className="section-subtitle">Ok. Ma tu come funzioni davvero?</p>

          <p className="section-subtitle">
            DYANA crea un profilo personale partendo dai tuoi dati, e lo rende leggibile:
            cosa ti muove, cosa ti pesa, cosa ti fa bene.
          </p>
        </section>

        {/* COSA SCOPRI */}
        <section className="section section-features">
          <h2 className="section-title">Cosa scopri nel tuo profilo</h2>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">Punti forti</h3>
              <p className="card-text">
                Cosa ti viene naturale. Dove rendi meglio. Dove ti accendi.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Emozioni</h3>
              <p className="card-text">
                Cosa ti tocca davvero. Cosa ti calma. Cosa ti manda in tilt.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Relazioni</h3>
              <p className="card-text">
                Come ti leghi agli altri. Cosa cerchi. Cosa non sopporti.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Scelte e direzione</h3>
              <p className="card-text">
                Cosa ti fa crescere. Cosa ti blocca. Dove ha senso investire energie.
              </p>
            </article>
          </div>

          <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
            <a href={CTA_HREF} className="btn btn-primary">
              Inizia ora
            </a>
          </div>
        </section>

        {/* COME FUNZIONA */}
        <section className="section section-features">
          <h2 className="section-title">Come funziona</h2>
          <p className="section-subtitle">Semplice. Diretto. In pochi minuti.</p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">1) Inserisci i dati</h3>
              <p className="card-text">
                Metti i dati richiesti. Se non sai l’ora, puoi comunque iniziare.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">2) DYANA elabora</h3>
              <p className="card-text">
                Costruiamo il tuo profilo e lo trasformiamo in testo chiaro e utile.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">3) Leggi e capisci</h3>
              <p className="card-text">
                Leggi la tua lettura personale e, se vuoi, approfondisci con domande mirate.
              </p>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-features">
          <h2 className="section-title">Domande frequenti</h2>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">È un test di personalità?</h3>
              <p className="card-text">
                No. È una lettura personale costruita sui tuoi dati, non una scheda uguale per tutti.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Serve sapere l’ora di nascita?</h3>
              <p className="card-text">
                Aiuta. Se non la sai, puoi iniziare lo stesso: la lettura sarà meno precisa.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">Quanto tempo ci vuole?</h3>
              <p className="card-text">
                Pochi minuti: inserisci i dati, DYANA elabora e leggi subito.
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">È complicato?</h3>
              <p className="card-text">
                No. Linguaggio semplice. Solo ciò che ti serve per capirti meglio.
              </p>
            </article>
          </div>
        </section>

        {/* CTA FINALE */}
        <section className="section section-features">
          <h2 className="section-title">Ok. E tu, come sei fatto davvero?</h2>

          <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
            <a href={CTA_HREF} className="btn btn-primary">
              Scopri il tuo profilo adesso
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
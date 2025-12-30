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
        {/* PREVISIONI 2026 */}
        <section className="section section-features">
          <h2 className="section-title">Previsioni 2026: cosa cambia davvero</h2>
          <p className="section-subtitle">
            Se stai cercando “oroscopo 2026”, probabilmente vuoi capire una cosa semplice:
            dove spinge l’anno e dove invece conviene smettere di forzare.
          </p>
          <p className="section-subtitle">
            Il problema degli oroscopi annuali “da social” è che restano sempre uguali:
            stessi aggettivi, stesse promesse, stessi consigli da biscotto della fortuna.
            DYANA fa l’opposto: parte dal tuo profilo e traduce il tuo 2026 in scenari pratici.
          </p>
          <p className="section-subtitle">
            Risultato: meno confusione, più direzione. Non ti dice “sarà un anno intenso”.
            Ti aiuta a capire <strong>quali aree</strong> si muovono, <strong>quando</strong> e con <strong>che tono</strong>.
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
        {/* SEGNO PER SEGNO (CATTURA QUERY) */}
        <section className="section section-features">
          <h2 className="section-title">Oroscopo annuale 2026: segno per segno (versione cliché)</h2>
          <p className="section-subtitle">
            Sì, lo sappiamo: molti cercano “oroscopo 2026 segno per segno”.
            Ecco la versione da social, compressa e prevedibile. Poi torniamo alle cose serie.
          </p>

          <div className="cards-grid">
            <article className="card"><h3 className="card-title">Ariete</h3><p className="card-text">“Fai il salto.” Traduzione: fai casino ma con entusiasmo.</p></article>
            <article className="card"><h3 className="card-title">Toro</h3><p className="card-text">“Stabilità.” Traduzione: non ti schiodi nemmeno con le pinze.</p></article>
            <article className="card"><h3 className="card-title">Gemelli</h3><p className="card-text">“Nuove idee.” Traduzione: inizi 12 cose, finisci forse 1.</p></article>
            <article className="card"><h3 className="card-title">Cancro</h3><p className="card-text">“Emozioni.” Traduzione: piangi, poi ti vendichi con stile.</p></article>
            <article className="card"><h3 className="card-title">Leone</h3><p className="card-text">“Successo.” Traduzione: ti applaudi da solo, ma forte.</p></article>
            <article className="card"><h3 className="card-title">Vergine</h3><p className="card-text">“Organizzazione.” Traduzione: controlli anche l’ansia altrui.</p></article>
            <article className="card"><h3 className="card-title">Bilancia</h3><p className="card-text">“Scelte.” Traduzione: ci pensi fino al 2027.</p></article>
            <article className="card"><h3 className="card-title">Scorpione</h3><p className="card-text">“Trasformazione.” Traduzione: zero mezze misure, solo drama.</p></article>
            <article className="card"><h3 className="card-title">Sagittario</h3><p className="card-text">“Avventura.” Traduzione: cambi idea mentre stai parlando.</p></article>
            <article className="card"><h3 className="card-title">Capricorno</h3><p className="card-text">“Risultati.” Traduzione: lavori anche quando dici che riposi.</p></article>
            <article className="card"><h3 className="card-title">Acquario</h3><p className="card-text">“Originalità.” Traduzione: contraddici tutti, pure te stesso.</p></article>
            <article className="card"><h3 className="card-title">Pesci</h3><p className="card-text">“Intuizione.” Traduzione: vivi in un film, ma bello.</p></article>
          </div>

          <p className="card-text" style={{ marginTop: "1rem", opacity: 0.9 }}>
            Ora la parte utile: DYANA non si ferma al segno. Per un oroscopo 2026 personalizzato,
            conta il tuo cielo completo.
          </p>
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

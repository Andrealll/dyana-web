export default function PrivacyPage() {
  return (
    <main className="page-root">
      <section className="landing-wrapper">
        <section className="section">
          <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="section-title">Informativa privacy DYANA</h1>

            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              La presente informativa descrive come DYANA tratta i dati personali
              degli utenti in conformità al Regolamento (UE) 2016/679 (“GDPR”)
              e alla normativa italiana vigente in materia di protezione dei dati.
            </p>

            {/* 1. Titolare */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              1. Titolare del trattamento
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Il titolare del trattamento è Andrea Lombardi, ideatore e responsabile
              del progetto DYANA. Per qualsiasi richiesta relativa alla privacy
              o per l’esercizio dei tuoi diritti puoi scrivere a:
              <br />
              <span style={{ fontStyle: "italic" }}>[dyana.ai.app@gmail.com]</span>.
            </p>

            {/* 2. Dati trattati */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              2. Tipologie di dati trattati
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              DYANA può trattare le seguenti categorie di dati:
            </p>
            <ul className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}>
              <li>
                <strong>Dati identificativi:</strong> nome o nickname, indirizzo email (per utenti registrati).
              </li>
              <li>
                <strong>Dati astrologici:</strong> data, ora e luogo di nascita, oltre ad
                eventuali informazioni che decidi di condividere per contestualizzare
                la lettura (es. ambito relazioni, lavoro, cambiamento personale).
              </li>
              <li>
                <strong>Dati di utilizzo e crediti:</strong> informazioni su accessi,
                consulti richiesti, utilizzo di crediti gratuiti o acquistati.
              </li>
              <li>
                <strong>Dati tecnici:</strong> indirizzo IP, log di sistema, informazioni
                sul dispositivo e cookie tecnici/di preferenza.
              </li>
            </ul>

            {/* 3. Finalità */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              3. Finalità del trattamento
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              I dati personali sono trattati per le seguenti finalità:
            </p>
            <ul className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}>
              <li>erogare consulti astrologici personalizzati tramite DYANA;</li>
              <li>permettere la creazione e gestione dell’account utente;</li>
              <li>gestire il sistema di crediti, i tentativi gratuiti e gli eventuali acquisti;</li>
              <li>monitorare il corretto funzionamento tecnico della piattaforma;</li>
              <li>rispondere a richieste di supporto e assistenza;</li>
              <li>
                inviare comunicazioni informative o promozionali solo se hai
                espresso uno specifico consenso.
              </li>
            </ul>

            {/* 4. Base giuridica */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              4. Base giuridica
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Le principali basi giuridiche del trattamento sono:
            </p>
            <ul className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}>
              <li>
                <strong>esecuzione di un contratto</strong> o di misure precontrattuali
                (uso del servizio e gestione dell’account);
              </li>
              <li>
                <strong>consenso</strong> (per cookie non tecnici, marketing, newsletter);
              </li>
              <li>
                <strong>legittimo interesse</strong> del titolare a mantenere sicura e
                migliorare la piattaforma.
              </li>
            </ul>

            {/* 5. Conservazione */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              5. Conservazione dei dati
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              I dati relativi all’account vengono conservati finché il profilo resta
              attivo. In caso di richiesta di cancellazione o chiusura dell’account,
              i dati sono eliminati o anonimizzati entro un termine ragionevole,
              di norma entro 30 giorni, salvo obblighi di legge diversi. I log
              tecnici possono essere conservati fino a 12 mesi.
            </p>

            {/* 6. AI */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              6. Utilizzo di sistemi di intelligenza artificiale
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Per generare le interpretazioni astrologiche DYANA si avvale di
              modelli di intelligenza artificiale forniti da provider esterni.
              I dati necessari alla generazione della risposta (es. dati astrologici
              e domanda) vengono trasmessi ai soli fini dell’erogazione del servizio.
              Non utilizziamo i tuoi dati per addestrare modelli proprietari o di terzi
              al di fuori degli scopi del servizio.
            </p>

            {/* 7. Destinatari */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              7. Destinatari dei dati
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              I dati possono essere trattati da fornitori tecnici che erogano servizi
              di hosting, infrastruttura cloud, autenticazione, pagamenti e AI
              (ad esempio Supabase, Render, Vercel e provider di modelli linguistici),
              nominati ove necessario responsabili del trattamento. I dati non sono
              venduti a terzi per finalità commerciali autonome.
            </p>

            {/* 8. Cookie */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              8. Cookie
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              DYANA utilizza cookie tecnici necessari al funzionamento del sito e,
              previo consenso, cookie di analisi e marketing. Puoi gestire le tue
              preferenze attraverso il banner o le impostazioni del browser. Il
              rifiuto dei cookie opzionali non impedisce l’utilizzo del servizio,
              ma può escludere eventuali bonus legati al consenso.
            </p>

            {/* 9. Diritti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              9. Diritti dell&apos;interessato
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              In qualsiasi momento puoi esercitare i diritti previsti dagli artt.
              15–22 GDPR (accesso, rettifica, cancellazione, limitazione, opposizione,
              portabilità dei dati, revoca del consenso) scrivendo al Titolare. Hai
              inoltre il diritto di proporre reclamo all’Autorità Garante per la
              protezione dei dati personali.
            </p>

            {/* 10. Trasferimenti extra-UE */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              10. Trasferimenti extra-UE
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Alcuni fornitori di servizi possono avere sede o server al di fuori
              dell’Unione Europea. In tali casi, il trasferimento dei dati avviene
              nel rispetto delle garanzie previste dal GDPR, come le Standard
              Contractual Clauses adottate dalla Commissione Europea.
            </p>

            {/* 11. Aggiornamenti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              11. Aggiornamenti di questa informativa
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: 8 }}>
              Questa informativa può essere soggetta a modifiche per adeguamenti
              normativi o evoluzioni del servizio. La versione aggiornata è sempre
              disponibile su questa pagina.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default function CondizioniPage() {
  return (
    <main className="page-root">
      <section className="landing-wrapper">
        <section className="section">
          <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="section-title">Condizioni del servizio DYANA</h1>

            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Le presenti Condizioni regolano l&apos;uso di DYANA, piattaforma
              digitale che offre consulti astrologici personalizzati tramite
              intelligenza artificiale. Accedendo e utilizzando il servizio,
              l&apos;utente accetta integralmente i termini indicati di seguito.
            </p>

            {/* 1. Oggetto */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              1. Oggetto del servizio
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              DYANA fornisce contenuti e interpretazioni astrologiche basate sui
              dati inseriti dall&apos;utente (ad esempio data, ora e luogo di nascita,
              domande o ambiti di interesse). Le letture hanno finalità di
              intrattenimento, esplorazione personale e crescita interiore e non
              hanno carattere predittivo o deterministico.
            </p>

            {/* 2. Accesso */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              2. Accesso e account utente
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Il servizio può essere utilizzato:
            </p>
            <ul className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}>
              <li>
                come <strong>ospite (guest)</strong>, con funzionalità limitate
                e accesso ad un numero ridotto di consulti gratuiti;
              </li>
              <li>
                come <strong>utente registrato</strong>, mediante creazione di un
                account che permette l&apos;accesso a funzioni aggiuntive.
              </li>
            </ul>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              L&apos;utente è responsabile della correttezza dei dati forniti e della
              riservatezza delle proprie credenziali di accesso.
            </p>

            {/* 3. Crediti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              3. Sistema di crediti
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Alcune funzionalità di DYANA sono accessibili tramite un sistema di
              crediti digitali. I crediti possono essere assegnati gratuitamente
              (es. tentativi iniziali, bonus) oppure acquistati. I crediti:
            </p>
            <ul className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}>
              <li>non costituiscono moneta elettronica o strumento finanziario;</li>
              <li>non sono rimborsabili una volta utilizzati o scaduti;</li>
              <li>
                possono essere soggetti a limiti, condizioni di utilizzo e scadenza
                indicati di volta in volta sulla piattaforma.
              </li>
            </ul>

            {/* 4. Dati inseriti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              4. Dati e contenuti inseriti dall&apos;utente
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              L&apos;utente può inserire dati astrologici e informazioni personali per
              personalizzare la lettura. Rimane responsabile dei contenuti che
              fornisce e garantisce di avere il diritto di comunicarli. DYANA tratta
              tali dati secondo quanto previsto dall&apos;Informativa privacy.
            </p>

            {/* 5. Limitazioni */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              5. Limitazioni e natura del servizio
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              DYANA non sostituisce in alcun modo consulenze professionali di tipo
              medico, psicologico, legale, finanziario o di altra natura specialistica.
              Le interpretazioni astrologiche sono simboliche e non devono essere
              considerate come indicazioni vincolanti o predizioni certe del futuro.
            </p>

            {/* 6. Responsabilità */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              6. Esclusione di responsabilità
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Nei limiti consentiti dalla legge, DYANA non è responsabile per
              decisioni, azioni o omissioni compiute dall&apos;utente sulla base dei
              contenuti generati, né per eventuali danni indiretti, consequenziali
              o imprevedibili. Il servizio è fornito “così com&apos;è”, senza garanzia
              di risultati specifici.
            </p>

            {/* 7. Pagamenti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              7. Pagamenti e rimborsi
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Gli eventuali pagamenti per l&apos;acquisto di crediti o funzionalità
              premium sono gestiti tramite provider esterni (ad esempio sistemi di
              pagamento online). Salvo diverse indicazioni di legge, non sono
              previsti rimborsi per crediti utilizzati o scaduti.
            </p>

            {/* 8. Uso illecito */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              8. Uso non consentito del servizio
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              È vietato utilizzare DYANA per attività illegali o che violino diritti
              di terzi, per generare contenuti offensivi, discriminatori o
              diffamatori, o per tentare di compromettere la sicurezza o il
              funzionamento della piattaforma.
            </p>

            {/* 9. Modifiche */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              9. Modifiche al servizio e alle condizioni
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              DYANA può aggiornare il contenuto del servizio, le funzionalità
              disponibili, il sistema di crediti e le presenti Condizioni.
              Eventuali modifiche rilevanti saranno comunicate tramite il sito o,
              ove possibile, via email agli utenti registrati.
            </p>

            {/* 10. Durata e chiusura account */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              10. Durata del rapporto e chiusura dell&apos;account
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              L&apos;utente può interrompere in qualsiasi momento l&apos;utilizzo di
              DYANA e richiedere la chiusura del proprio account. In caso di
              violazioni gravi delle presenti Condizioni, il titolare si riserva
              la facoltà di sospendere o disattivare l&apos;account senza preavviso.
            </p>

            {/* 11. Legge applicabile */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              11. Legge applicabile e foro competente
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: 8 }}>
              Le presenti Condizioni sono regolate dalla legge italiana. Salvo
              diversi diritti riconosciuti al consumatore dalla normativa vigente,
              per ogni controversia sarà competente il foro del luogo di residenza
              o domicilio del consumatore.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

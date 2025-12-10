"use client";

import DyanaNavbar from "../../../components/DyanaNavbar";

export default function CreditiSuccessPage() {
  return (
    <main className="page-root">
      <DyanaNavbar userRole="user" credits={0} onLogout={() => {}} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Pagamento completato ✅</h1>
          <p className="section-subtitle">
            Grazie! Il tuo pagamento è andato a buon fine.
            I crediti saranno presto disponibili nel tuo account DYANA.
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "640px", margin: "0 auto" }}>
            <p className="card-text" style={{ marginBottom: 12 }}>
              Puoi tornare alla pagina crediti per vedere il saldo aggiornato.
            </p>

            <a href="/crediti" className="btn btn-primary">
              Torna ai crediti
            </a>

            <p
              className="card-text"
              style={{ marginTop: 16, fontSize: "0.8rem", opacity: 0.7 }}
            >
              Se non vedi subito l’aggiornamento dei crediti, aggiorna la pagina
              dopo qualche secondo.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

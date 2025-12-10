// app/crediti/cancel/page.jsx
"use client";

import DyanaNavbar from "../../../components/DyanaNavbar";

export default function CreditiCancelPage() {
  return (
    <main className="page-root">
      <DyanaNavbar userRole="user" credits={0} onLogout={() => {}} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Pagamento annullato</h1>
          <p className="section-subtitle">
            Non è stato addebitato nulla. Puoi riprovare quando vuoi.
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "640px", margin: "0 auto" }}>
            <a href="/crediti" className="btn btn-primary">
              Torna ai crediti
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}

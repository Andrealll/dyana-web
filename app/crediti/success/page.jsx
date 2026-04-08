"use client";

export default function CreditiSuccessPage() {
  return (
    <main className="page-root">
      <section className="landing-wrapper">
        <section className="section" style={{ paddingTop: "64px" }}>
          <div
            className="card"
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              textAlign: "center",
              padding: "32px 24px",
            }}
          >
            <h1
              className="section-title"
              style={{ marginBottom: "12px" }}
            >
              Pagamento completato ✅
            </h1>

            <p
              className="section-subtitle"
              style={{ marginBottom: "24px" }}
            >
              Il pagamento è stato registrato correttamente.
            </p>

            <p
              className="card-text"
              style={{ marginBottom: "24px" }}
            >
              I crediti potrebbero richiedere qualche secondo per comparire.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <a
                href="/crediti"
                className="btn btn-primary"
                style={{ minWidth: "220px" }}
              >
                Vai ai crediti
              </a>

              <a
                href="/"
                className="btn btn-secondary"
                style={{ minWidth: "220px" }}
              >
                Torna a DYANA
              </a>
            </div>

            <p
              className="card-text"
              style={{
                marginTop: "20px",
                fontSize: "0.85rem",
                opacity: 0.7,
              }}
            >
              Se non vedi subito l’aggiornamento, attendi qualche secondo e ricarica.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
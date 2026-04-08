export default function CreditiCancelPage() {
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
            <h1 className="section-title" style={{ marginBottom: "12px" }}>
              Pagamento annullato
            </h1>

            <p className="section-subtitle" style={{ marginBottom: "24px" }}>
              Non è stato addebitato nulla.
            </p>

            <p className="card-text" style={{ marginBottom: "24px" }}>
              Puoi tornare ai crediti e riprovare quando vuoi.
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
                Torna ai crediti
              </a>

              <a
                href="/"
                className="btn btn-secondary"
                style={{ minWidth: "220px" }}
              >
                Torna a DYANA
              </a>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
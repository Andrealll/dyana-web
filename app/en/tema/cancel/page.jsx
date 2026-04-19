import Link from "next/link";

export default function TemaCancelPageEN() {
  return (
    <main className="page-root">
      <section className="landing-wrapper">
        <section className="section">
          <div className="card" style={{ maxWidth: "760px", margin: "0 auto" }}>
            <h1 className="section-title">Payment cancelled</h1>

            <p className="card-text" style={{ marginTop: 12, opacity: 0.9 }}>
              No charge has been made. You can resume your reading anytime.
            </p>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link href="/en/tema" className="btn btn-primary">
                Continue your reading
              </Link>

              <Link href="/crediti" className="btn">
                View credit packs
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
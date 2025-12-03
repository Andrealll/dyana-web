// app/test-typebot/page.jsx
"use client";

export default function TestTypebotPage() {
  // per ora simuliamo SEMPRE il caso premium
  const isPremium = true;

  return (
    <main className="page-root">
      <section className="landing-wrapper">
        <section className="section">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 32,
            }}
          >
            <div
              className="card"
              style={{
                width: "100%",
                maxWidth: "960px",
                padding: "22px 24px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
              }}
            >
              <p
                className="card-text"
                style={{
                  fontSize: "0.8rem",
                  opacity: 0.8,
                  marginBottom: 4,
                }}
              >
                DYANA • Q&amp;A sul tuo Tema Natale
              </p>

              <h3 className="card-title" style={{ marginBottom: 6 }}>
                Hai domande su questa lettura?
              </h3>

              <p
                className="card-text"
                style={{ marginBottom: 4, opacity: 0.9 }}
              >
                DYANA conosce già il Tema che hai appena generato e può
                aiutarti a capire meglio cosa sta emergendo nel tuo cielo
                personale.
              </p>

              <p
                className="card-text"
                style={{ fontSize: "0.9rem", opacity: 0.8 }}
              >
                Hai a disposizione <strong>2 domande di chiarimento</strong>{" "}
                incluse con questo Tema. In seguito potrai usare i tuoi
                crediti per sbloccare ulteriori domande extra.
              </p>

              {/* MESSAGGIO FREE (per ora non usato, isPremium = true) */}
              {!isPremium && (
                <p
                  className="card-text"
                  style={{
                    marginTop: 12,
                    fontSize: "0.9rem",
                    opacity: 0.85,
                  }}
                >
                  La chat con DYANA è disponibile solo per le letture{" "}
                  <strong>Premium</strong>, che includono 2 domande di
                  approfondimento sul tuo Tema Natale.
                </p>
              )}

              {/* EMBED TYPEBOT – IDENTICO AL TEST CHE FUNZIONA */}
              {isPremium && (
                <div
                  style={{
                    marginTop: 16,
                    width: "100%",
                    height: "600px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 22px 48px rgba(0,0,0,0.75)",
                  }}
                >
                  <iframe
                    src="https://typebot.co/dyana-ai"
                    style={{
                      border: "none",
                      width: "100%",
                      height: "100%",
                    }}
                    allow="clipboard-write; microphone; camera"
                  />
                </div>
              )}

              <p
                className="card-text"
                style={{
                  marginTop: 8,
                  fontSize: "0.75rem",
                  opacity: 0.65,
                  textAlign: "right",
                }}
              >
                DYANA risponde solo su questo Tema, non su altri argomenti
                generici.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

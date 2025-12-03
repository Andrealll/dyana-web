"use client";

import { useState } from "react";

export default function TestTypebotPage() {
  const isPremium = true;

  const [open, setOpen] = useState(false);

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

              <p className="card-text" style={{ opacity: 0.9 }}>
                DYANA conosce già il Tema che hai appena generato e può
                aiutarti a capire meglio cosa sta emergendo nel tuo cielo
                personale.
              </p>

              <p
                className="card-text"
                style={{ fontSize: "0.9rem", opacity: 0.8 }}
              >
                Hai <strong>2 domande incluse</strong> con la versione Premium.
              </p>

              {/* 🔥 BOTTONE TOGGLE */}
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => setOpen((prev) => !prev)}
              >
                {open ? "Chiudi DYANA" : "Chiedi a DYANA"}
              </button>

              {/* 🔥 IFRAME SOLO SE OPEN = TRUE */}
              {open && (
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
                DYANA risponde solo su questo Tema, non su altre tematiche.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

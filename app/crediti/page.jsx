// ==========================
// COSTANTI GLOBALI
// ==========================
"use client";

import { useEffect, useState } from "react";
import DyanaNavbar from "../../components/DyanaNavbar";
import { getToken, clearToken } from "../../lib/authClient";


// Se il path reale di DyanaNavbar nelle altre pagine è diverso (es. "../components/DyanaNavbar" vs "../../components"),
// usa esattamente LO STESSO che hai usato in /tema e /login.
const API_BASE = process.env.NEXT_PUBLIC_AUTH_BASE; // usiamo il servizio auth_pub

export default function CreditiPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPack, setLoadingPack] = useState(null);
  const [errore, setErrore] = useState("");
  const [success, setSuccess] = useState("");
  const [jwt, setJwt] = useState(null);

  const [userRole, setUserRole] = useState("guest");
  const [userCredits] = useState(0); // per ora non leggiamo i crediti reali qui

  useEffect(() => {
    const token = getToken();
    if (token) {
      setJwt(token);
      setUserRole("user");
    }
  }, []);

  useEffect(() => {
    async function fetchPacks() {
      setErrore("");
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/payments/packs`);
        if (!res.ok) {
          throw new Error("Impossibile caricare i pacchetti crediti.");
        }
        const data = await res.json();
        setPacks(data.packs || []);
      } catch (err) {
        console.error("[CREDITI] Errore load packs:", err);
        setErrore(err.message || "Errore nel caricamento dei pacchetti.");
      } finally {
        setLoading(false);
      }
    }

    fetchPacks();
  }, []);

  async function handleCompra(packId) {
    setErrore("");
    setSuccess("");

    if (!jwt) {
      setErrore(
        "Per acquistare crediti devi prima effettuare il login con la tua email."
      );
      return;
    }

    setLoadingPack(packId);
    try {
      const res = await fetch(`${API_BASE}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // in futuro, quando il backend leggerà il JWT:
          // Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ pack_id: packId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.detail || "Errore nella creazione della sessione di pagamento."
        );
      }

      const data = await res.json();

      if (data.checkout_url && data.mode === "placeholder") {
        // per ora non reindirizziamo davvero, è solo demo
        setSuccess(
          "Simulazione: l'integrazione con Stripe non è ancora attiva, ma il flusso è pronto."
        );
      } else if (data.checkout_url) {
        // quando integrerai Stripe, qui faremo il redirect reale:
        window.location.href = data.checkout_url;
      } else {
        setSuccess(
          "Richiesta di pagamento creata, ma manca la checkout_url. Controlla il backend."
        );
      }
    } catch (err) {
      console.error("[CREDITI] Errore acquisto:", err);
      setErrore(err.message || "Errore inatteso durante l'acquisto.");
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <main className="page-root">
      <DyanaNavbar
        userRole={userRole}
        credits={userCredits}
        onLogout={() => {
          // se in futuro vuoi gestire logout da qui, puoi usare clearToken()
        }}
      />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Ricarica i tuoi crediti</h1>
          <p className="section-subtitle">
            Scegli un pacchetto crediti per sbloccare le letture premium di DYANA:
            tema natale, sinastria, oroscopi avanzati e domande extra.
          </p>
        </header>

        <section className="section">
          {loading && packs.length === 0 ? (
            <p className="card-text">Caricamento pacchetti in corso...</p>
          ) : (
            <div
              className="card"
              style={{
                maxWidth: "960px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="card"
                  style={{
                    border:
                      pack.id === "medium"
                        ? "1px solid var(--dyana-gold)"
                        : "1px solid rgba(255,255,255,0.08)",
                    boxShadow:
                      pack.id === "medium"
                        ? "0 0 16px rgba(187, 154, 99, 0.35)"
                        : "none",
                  }}
                >
                  {pack.id === "medium" && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--dyana-gold)",
                        marginBottom: 6,
                      }}
                    >
                      Più conveniente
                    </div>
                  )}

                  <h2
                    className="section-title"
                    style={{ fontSize: "1.25rem", marginBottom: 8 }}
                  >
                    {pack.name}
                  </h2>
                  <p className="card-text" style={{ marginBottom: 8 }}>
                    {pack.description}
                  </p>

                  <p className="card-text" style={{ marginBottom: 4 }}>
                    <strong>{pack.credits}</strong> crediti
                  </p>
                  <p
                    className="card-text"
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {pack.price_eur} €
                  </p>

                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "auto" }}
                    disabled={loadingPack === pack.id}
                    onClick={() => handleCompra(pack.id)}
                  >
                    {loadingPack === pack.id
                      ? "Preparazione pagamento..."
                      : "Acquista ora"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              maxWidth: "640px",
              margin: "24px auto 0 auto",
              textAlign: "center",
            }}
          >
            {errore && (
              <p
                className="card-text"
                style={{ color: "#ff9a9a", marginBottom: 8 }}
              >
                {errore}
              </p>
            )}
            {success && (
              <p
                className="card-text"
                style={{ color: "#9cffb2", marginBottom: 8 }}
              >
                {success}
              </p>
            )}

            <p className="card-text" style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              I crediti ti permettono di acquistare letture premium (oroscopi
              giornalieri/settimanali/mensili/annuali, tema natale, sinastria e
              domande extra a DYANA). Nessun rinnovo automatico: ricarichi solo
              quando vuoi.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
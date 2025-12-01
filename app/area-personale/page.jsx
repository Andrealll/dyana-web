"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import { getToken, fetchCreditsState, fetchUsageHistory } from "../../lib/authClient";

export default function AreaPersonalePage() {
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");

  const [creditsState, setCreditsState] = useState(null);
  const [usage, setUsage] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const userRole = "user"; // TODO: in futuro leggilo dal JWT
  const userCredits = creditsState?.total_available ?? 0;

  useEffect(() => {
    async function loadData() {
      try {
        setErrore("");
        setLoading(true);

        const token = getToken();
        if (!token) {
          setErrore("Non sei autenticato. Effettua di nuovo il login.");
          setLoading(false);
          return;
        }

        const [credits, usageHistory] = await Promise.all([
          fetchCreditsState(token),
          fetchUsageHistory(token),
        ]);

        setCreditsState(credits);

        // usageHistory: dividiamo per tipo se vuoi
        setUsage(usageHistory.usage || []);
        setPurchases(usageHistory.purchases || []);
      } catch (err) {
        console.error("[AREA-PERSONALE] errore:", err);
        setErrore("Impossibile caricare i tuoi dati. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <main className="page-root">
      <DyanaNavbar userRole={userRole} credits={userCredits} onLogout={() => {}} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">La tua area DYANA</h1>
          <p className="section-subtitle">
            Qui trovi i tuoi crediti, le letture recenti e le ricariche effettuate.
          </p>
        </header>

        <section className="section" style={{ display: "grid", gap: 16 }}>
          {errore && (
            <p className="card-text" style={{ color: "#ff9a9a" }}>
              {errore}
            </p>
          )}

          {/* Card crediti */}
          <div className="card">
            <h2 className="card-title">Crediti disponibili</h2>
            {loading && !creditsState ? (
              <p className="card-text">Caricamento...</p>
            ) : creditsState ? (
              <>
                <p className="card-text">
                  <strong>{creditsState.total_available}</strong> crediti totali
                </p>
                <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Pagati: {creditsState.paid} • Free rimanenti oggi:{" "}
                  {creditsState.free_left}
                </p>
                <Link href="/ricarica" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Ricarica crediti
                </Link>
              </>
            ) : (
              <p className="card-text" style={{ opacity: 0.8 }}>
                Nessuna informazione crediti disponibile.
              </p>
            )}
          </div>

          {/* Card scorciatoie */}
          <div className="card">
            <h2 className="card-title">Cosa vuoi fare adesso?</h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Link href="/tema" className="btn btn-primary">
                Nuovo Tema natale
              </Link>
              <Link href="/compatibilita" className="btn btn-primary">
                Sinastria
              </Link>
              <Link href="/oroscopo" className="btn btn-primary">
                Oroscopo personalizzato
              </Link>
            </div>
          </div>

          {/* Card ultime letture */}
          <div className="card">
            <h2 className="card-title">Ultime letture premium</h2>
            {loading && !usage.length ? (
              <p className="card-text">Caricamento...</p>
            ) : usage.length === 0 ? (
              <p className="card-text" style={{ opacity: 0.8 }}>
                Ancora nessuna lettura registrata.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {usage.map((u) => (
                  <li
                    key={u.id}
                    className="card-text"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span>
                      {u.when} – {u.feature} ({u.scope})
                    </span>
                    <span>-{u.credits_used} cr</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card ricariche */}
          <div className="card">
            <h2 className="card-title">Ricariche effettuate</h2>
            {loading && !purchases.length ? (
              <p className="card-text">Caricamento...</p>
            ) : purchases.length === 0 ? (
              <p className="card-text" style={{ opacity: 0.8 }}>
                Nessuna ricarica ancora effettuata.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {purchases.map((p) => (
                  <li
                    key={p.id}
                    className="card-text"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span>
                      {p.when} – {p.product}
                    </span>
                    <span>{p.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

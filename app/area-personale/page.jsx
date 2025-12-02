"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import {
  getToken,
  fetchCreditsState,
  fetchUsageHistory,
  updateMarketingConsent,
  deleteProfile,
} from "../../lib/authClient";
// =======================
// Helpers formattazione
// =======================
function formatUsageDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUsageFeature(feature, scope) {
  if (feature === "tema_ai") return "Tema natale";
  if (feature === "sinastria_ai") return "Sinastria";

  if (feature === "oroscopo_ai") {
    const labelByScope = {
      daily: "Oroscopo giornaliero",
      weekly: "Oroscopo settimanale",
      monthly: "Oroscopo mensile",
      yearly: "Oroscopo annuale",
    };
    return labelByScope[scope] || "Oroscopo personalizzato";
  }

  // fallback: chiave tecnica se non riconosciuta
  return feature || "";
}
export default function AreaPersonalePage() {
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [erroreMarketing, setErroreMarketing] = useState("");
  const [successMarketing, setSuccessMarketing] = useState("");

  const [creditsState, setCreditsState] = useState(null);
  const [usage, setUsage] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userRole = "user"; // TODO: in futuro leggilo dal JWT
  const userCredits = creditsState?.total_available ?? 0;

  useEffect(() => {
    async function loadData() {
      try {
        setErrore("");
        setErroreMarketing("");
        setSuccessMarketing("");
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
        setMarketingConsent(Boolean(credits.marketing_consent));

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

  async function handleToggleMarketing() {
    const token = getToken();
    if (!token) {
      setErrore("Sessione scaduta. Effettua di nuovo il login.");
      return;
    }

    const newValue = !marketingConsent;
    setErroreMarketing("");
    setSuccessMarketing("");

    try {
      await updateMarketingConsent(token, newValue);
      setMarketingConsent(newValue);
      setSuccessMarketing("Consenso marketing aggiornato correttamente.");
      setCreditsState((prev) =>
        prev ? { ...prev, marketing_consent: newValue } : prev
      );
    } catch (err) {
      console.error("[AREA-PERSONALE] errore marketing:", err);
      setErroreMarketing("Non è stato possibile aggiornare il consenso marketing.");
    }
  }

  async function handleDeleteProfile() {
    const token = getToken();
    if (!token) {
      setErrore("Sessione scaduta. Effettua di nuovo il login.");
      return;
    }

    setDeleting(true);
    setErrore("");

    try {
      await deleteProfile(token);
      // Pulisco token e rimando alla home
      localStorage.removeItem("dyana_jwt");
      window.location.href = "/";
    } catch (err) {
      console.error("[AREA-PERSONALE] errore cancellazione profilo:", err);
      setErrore("Errore nella cancellazione del profilo. Riprova più tardi.");
      setDeleting(false);
    }
  }

  const email = creditsState?.email || "—";

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
          {/* Messaggi globali */}
          {errore && (
            <p className="card-text" style={{ color: "#ff9a9a" }}>
              {errore}
            </p>
          )}
          {erroreMarketing && (
            <p className="card-text" style={{ color: "#ffb199" }}>
              {erroreMarketing}
            </p>
          )}
          {successMarketing && (
            <p className="card-text" style={{ color: "#9cffb2" }}>
              {successMarketing}
            </p>
          )}

          {/* PROFILO UTENTE */}
          <div className="card">
            <h2 className="card-title">Profilo utente</h2>

            <p
              className="card-text"
              style={{ marginTop: 12, marginBottom: 8 }}
            >
              <strong>Email:</strong>{" "}
              <span style={{ opacity: email === "—" ? 0.8 : 1 }}>{email}</span>
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 8,
              }}
            >
              <label
                className="card-text"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={handleToggleMarketing}
                  style={{ margin: 0 }}
                />
                <span>Consenso al marketing diretto</span>
              </label>
              <Link
                href="/privacy"
                className="nav-link"
                style={{ fontSize: "0.8rem" }}
              >
                Informativa privacy
              </Link>
            </div>
          </div>

                    {/* CREDITI DISPONIBILI */}
          <div className="card">
            <h2 className="card-title">Crediti disponibili</h2>
            {loading && !creditsState ? (
              <p className="card-text" style={{ marginTop: 8 }}>
                Caricamento...
              </p>
            ) : creditsState ? (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4, // 👈 spaziatura verticale uniforme
                }}
              >
                <p className="card-text">
                  <strong>{creditsState.total_available}</strong> crediti totali
                </p>
                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.8 }}
                >
                  Pagati: {creditsState.paid} • Free rimanenti oggi:{" "}
                  {creditsState.free_left}
                </p>
                <Link href="/ricarica" className="btn btn-primary">
                  Ricarica crediti
                </Link>
              </div>
            ) : (
              <p
                className="card-text"
                style={{ opacity: 0.8, marginTop: 8 }}
              >
                Nessuna informazione crediti disponibile.
              </p>
            )}
          </div>

           {/* ULTIME LETTURE PREMIUM */}
          <div className="card">
            <h2 className="card-title">Ultime letture premium</h2>
            {loading && !usage.length ? (
              <p className="card-text" style={{ marginTop: 8 }}>
                Caricamento...
              </p>
            ) : usage.length === 0 ? (
              <p
                className="card-text"
                style={{ opacity: 0.8, marginTop: 8 }}
              >
                Ancora nessuna lettura registrata.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0 0",
                }}
              >
                {usage.map((u) => (
                  <li
                    key={u.id}
                    className="card-text"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>
                      {formatUsageDate(u.when)} –{" "}
                      {formatUsageFeature(u.feature, u.scope)}
                    </span>
                    <span>-{u.credits_used} cr</span>
                  </li>
                ))}
              </ul>
            )}
          </div>


          {/* RICARICHE */}
          <div className="card">
            <h2 className="card-title">Ricariche effettuate</h2>
            {loading && !purchases.length ? (
              <p className="card-text" style={{ marginTop: 8 }}>
                Caricamento...
              </p>
            ) : purchases.length === 0 ? (
              <p
                className="card-text"
                style={{ opacity: 0.8, marginTop: 8 }}
              >
                Nessuna ricarica ancora effettuata.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0 0",
                }}
              >
                {purchases.map((p) => (
                  <li
                    key={p.id}
                    className="card-text"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>
                      {p.when} – {p.product}
                    </span>
                    <span>
                      {p.amount != null ? `${p.amount} ${p.currency || "EUR"}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GESTIONE ACCOUNT */}
          <div className="card">
            <h2 className="card-title">Gestione account</h2>
            <p
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.85, marginTop: 8 }}
            >
              Cancellando il profilo, la tua email verrà eliminata dal sistema e
              non potrai più utilizzare i crediti residui. Potrai sempre creare
              un nuovo account in futuro.
            </p>

            {showDeleteConfirm ? (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  className="card-text"
                  style={{ fontSize: "0.9rem", opacity: 0.9 }}
                >
                  Sei sicuro di voler cancellare il tuo profilo?
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    disabled={deleting}
                    onClick={handleDeleteProfile}
                  >
                    {deleting ? "Cancellazione in corso..." : "Conferma cancellazione"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Cancella profilo
              </button>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

// app/crediti/success/page.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
// ATTENZIONE: usa lo stesso import path che hai in app/crediti/page.jsx
import DyanaNavbar from "../../components/DyanaNavbar";

export default function CreditiSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      console.log("[CREDITI] Pagamento completato, session_id:", sessionId);
      // Se in futuro vuoi, qui puoi chiamare il backend per validare la sessione
      // o ricaricare i crediti da /credits/state.
    }
  }, [sessionId]);

  return (
    <main className="page-root">
      <DyanaNavbar
        userRole="user"
        credits={0} // se vuoi, in futuro ricarichi da /credits/state
        onLogout={() => {}}
      />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Pagamento completato ✅</h1>
          <p className="section-subtitle">
            Grazie! Il tuo pagamento è stato registrato. I crediti saranno presto disponibili
            nel tuo account DYANA.
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "640px", margin: "0 auto" }}>
            <p className="card-text" style={{ marginBottom: 12 }}>
              Puoi tornare alla pagina crediti per vedere il tuo saldo aggiornato.
            </p>
            <a href="/crediti" className="btn btn-primary">
              Torna ai crediti
            </a>

            {sessionId && (
              <p
                className="card-text"
                style={{ marginTop: 16, fontSize: "0.8rem", opacity: 0.7 }}
              >
                ID transazione Stripe: <code>{sessionId}</code>
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

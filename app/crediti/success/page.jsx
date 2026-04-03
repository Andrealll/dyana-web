//SUCCESS
"use client";

import { useEffect, useMemo, useState } from "react";
import DyanaNavbar from "../../../components/DyanaNavbar";
import { getToken } from "../../../lib/authClient";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_BASE; // auth_pub

export default function CreditiSuccessPage() {
  const [status, setStatus] = useState("checking"); // checking | confirmed | pending | error | not_auth
  const [message, setMessage] = useState("");
  const [credits, setCredits] = useState(0);
  const [paid, setPaid] = useState(0);
  const [freeLeft, setFreeLeft] = useState(0);

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const sp = new URLSearchParams(window.location.search);
    return sp.get("session_id");
  }, []);

  async function fetchCreditsState(token) {
    const res = await fetch(`${API_BASE}/credits/state`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Errore /credits/state (${res.status})`);
    }
    return await res.json();
  }

  async function fetchUsageHistory(token) {
    const res = await fetch(`${API_BASE}/usage/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setMessage("");

      const token = getToken();
      if (!token) {
        setStatus("not_auth");
        setMessage("Sessione non trovata. Fai login e controlla i crediti.");
        return;
      }

      // baseline iniziale
      let baselinePaid = 0;
      try {
        const s0 = await fetchCreditsState(token);
        if (cancelled) return;

        baselinePaid = Number(s0.paid || 0);
        setPaid(baselinePaid);
        setFreeLeft(Number(s0.free_left || 0));
        setCredits(Number(s0.total_available || 0));
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e.message || "Errore nel controllo crediti.");
        return;
      }

      // Poll: 30s max, ogni 2s
      const startedAt = Date.now();
      const timeoutMs = 30000;
      const intervalMs = 2000;

      setStatus("pending");
      setMessage("Sto confermando l’aggiornamento dei crediti…");

      while (!cancelled && Date.now() - startedAt < timeoutMs) {
        try {
          // 1) prova stato crediti
          const s = await fetchCreditsState(token);
          if (cancelled) return;

          const newPaid = Number(s.paid || 0);
          const total = Number(s.total_available || 0);

          setPaid(newPaid);
          setFreeLeft(Number(s.free_left || 0));
          setCredits(total);

          // criterio 1: paid aumenta
          if (newPaid > baselinePaid) {
            setStatus("confirmed");
            setMessage("Pagamento confermato. Crediti aggiornati.");
            return;
          }

          // criterio 2 (fallback): in history compare un acquisto recente
          // utile se i crediti sono free/pool o se paid non cambia come atteso
          const hist = await fetchUsageHistory(token);
          if (hist?.purchases?.length) {
            // Se hai session_id nel DB (vedi patch backend sotto) qui puoi fare match preciso.
            // Per ora: basta che ci sia una purchase molto recente (ultimi 2 minuti).
            const p0 = hist.purchases[0];
            const when = new Date(p0.when).getTime();
            const ageMs = Date.now() - when;
            if (ageMs >= 0 && ageMs < 2 * 60 * 1000) {
              setStatus("confirmed");
              setMessage("Pagamento registrato. Crediti in aggiornamento completato.");
              return;
            }
          }
        } catch (e) {
          // ignora errori transienti e continua
        }

        await new Promise((r) => setTimeout(r, intervalMs));
      }

      // timeout: pagamento ok ma webhook lento
      if (!cancelled) {
        setStatus("pending");
        setMessage(
          "Pagamento ricevuto, ma l’aggiornamento crediti potrebbe richiedere ancora qualche secondo. Riprova tra poco."
        );
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="page-root">
      <DyanaNavbar userRole="user" credits={credits} onLogout={() => {}} />

      <section className="landing-wrapper">
        <header className="section">
          <h1 className="section-title">Pagamento completato ✅</h1>
          <p className="section-subtitle">
            {status === "confirmed"
              ? "Tutto ok: il pagamento è stato confermato."
              : status === "not_auth"
              ? "Serve login per verificare i crediti."
              : status === "error"
              ? "Non riesco a verificare lo stato in questo momento."
              : "Stiamo verificando l’aggiornamento dei crediti…"}
          </p>
        </header>

        <section className="section">
          <div className="card" style={{ maxWidth: "640px", margin: "0 auto" }}>
            {message && (
              <p className="card-text" style={{ marginBottom: 12 }}>
                {message}
              </p>
            )}

            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              <div className="card-text">Paid: <strong>{paid}</strong></div>
              <div className="card-text">Free: <strong>{freeLeft}</strong></div>
              <div className="card-text">Totale: <strong>{credits}</strong></div>
              {sessionId && (
                <div className="card-text" style={{ opacity: 0.7, fontSize: "0.8rem" }}>
                  session_id: {sessionId}
                </div>
              )}
            </div>

            <a href="/crediti" className="btn btn-primary">
              Torna ai crediti
            </a>

            <p
              className="card-text"
              style={{ marginTop: 16, fontSize: "0.8rem", opacity: 0.7 }}
            >
              Se l’aggiornamento non è immediato, attendi qualche secondo e ricarica.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

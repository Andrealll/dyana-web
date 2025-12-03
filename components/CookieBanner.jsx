// components/CookieBanner.jsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dyana_cookie_accepted"; // "accepted" | "rejected"

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("pending"); // "pending" | "accepted" | "rejected"

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted" || stored === "rejected") {
        setStatus(stored);
      }
    } catch (e) {
      console.warn("[CookieBanner] localStorage non disponibile", e);
    }
  }, []);

  // Evita problemi di hydration + nasconde se l'utente ha già scelto
  if (!mounted || status !== "pending") {
    return null;
  }

  const handleAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch (e) {
      console.warn("[CookieBanner] errore salvataggio localStorage (accept)", e);
    }
    setStatus("accepted");
  };

  const handleReject = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "rejected");
    } catch (e) {
      console.warn("[CookieBanner] errore salvataggio localStorage (reject)", e);
    }
    setStatus("rejected");
  };

  return (
    <div className="cookie-overlay">
      <div className="cookie-modal">
        <h2 className="cookie-title">DYANA e i cookie</h2>
        <p className="cookie-text">
          DYANA utilizza cookie tecnici e strumenti simili per funzionare
          correttamente e per offrirti funzionalità aggiuntive, come i crediti
          gratuiti di benvenuto.
          <br />
          <br />
          Puoi accettare per abilitare questi vantaggi, oppure rifiutare e
          continuare ad usare il servizio senza crediti gratuiti.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "4px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleReject}
            className="cookie-reject-btn"
          >
            Rifiuto
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="cookie-accept-btn"
          >
            Accetto e continuo
          </button>
        </div>
      </div>
    </div>
  );
}

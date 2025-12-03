// components/CookieBanner.jsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dyana_cookie_accepted";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setAccepted(true);
      }
    } catch (e) {
      console.warn("[CookieBanner] localStorage non disponibile", e);
    }
  }, []);

  // Evita problemi di hydration + nasconde se già accettato
  if (!mounted || accepted) {
    return null;
  }

  const handleAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch (e) {
      console.warn("[CookieBanner] errore salvataggio localStorage", e);
    }
    setAccepted(true);
  };

  return (
    <div className="cookie-overlay">
      <div className="cookie-modal">
        <h2 className="cookie-title">DYANA e i cookie</h2>
        <p className="cookie-text">
          DYANA utilizza cookie tecnici per funzionare correttamente.
          Accettando potrai usare tutte le funzionalità previste dal tuo piano.
        </p>

        <button
          type="button"
          onClick={handleAccept}
          className="cookie-accept-btn"
        >
          Accetto e continuo
        </button>
      </div>
    </div>
  );
}

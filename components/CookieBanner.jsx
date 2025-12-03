// components/CookieBanner.jsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dyana_cookie_accepted";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // siamo sul client
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setAccepted(true);
      }
    } catch (e) {
      // se localStorage non è disponibile, non blocchiamo niente
      console.warn("[CookieBanner] localStorage non disponibile", e);
    }
  }, []);

  // 🔴 PUNTO CHIAVE:
  // - sul server: mounted = false → return null
  // - primo render sul client: mounted = false → return null
  //   ⇒ HTML server e HTML client iniziale coincidono (nessun mismatch)
  // - solo DOPO l'useEffect, se non è accettato, mostriamo il banner
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
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between px-4 py-3 text-sm bg-black/80 text-white backdrop-blur"
    >
      <span>
        DYANA utilizza cookie tecnici. Accettando riceverai il bonus di
        benvenuto.
      </span>
      <button
        type="button"
        onClick={handleAccept}
        className="ml-4 px-3 py-1 rounded-full border border-white/60 text-xs uppercase tracking-wide"
      >
        Accetto
      </button>
    </div>
  );
}

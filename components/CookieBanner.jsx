"use client";

import { useEffect, useState } from "react";
import { getToken, updateCookieConsent } from "../lib/authClient";

export default function CookieBanner({ onAccept }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = localStorage.getItem("cookieAccepted");
    if (!ok) setVisible(true);
  }, []);

  if (!visible) return null;

  async function handleAccept() {
    // 1) chiudo banner + salvo scelta lato browser
    localStorage.setItem("cookieAccepted", "true");
    setVisible(false);

    // 2) provo ad aggiornare il backend (solo se ho un token guest/utente)
    try {
      const token = getToken();
      if (token) {
        await updateCookieConsent(token);
      }
    } catch (err) {
      console.error("[COOKIE] errore updateCookieConsent:", err);
      // non blocco l'UX: il banner resta chiuso comunque
    }

    // 3) callback opzionale (se l'hai passata)
    if (onAccept) {
      onAccept();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        background: "#2c4050",
        padding: 16,
        color: "white",
        textAlign: "center",
        zIndex: 999,
      }}
    >
      <p style={{ marginBottom: 8 }}>
        DYANA utilizza cookie tecnici di sessione. Accettandoli riceverai il{" "}
        <strong>bonus di benvenuto</strong>. Se non li accetti potrai usare il sito,
        ma senza alcun trial gratuito.
      </p>
      <button className="btn btn-primary" onClick={handleAccept}>
        Accetto
      </button>
    </div>
  );
}

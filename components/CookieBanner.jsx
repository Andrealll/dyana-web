"use client";
import { useEffect, useState } from "react";

export default function CookieBanner({ onAccept }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem("cookieAccepted");
    if (!ok) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      width: "100%",
      background: "#2c4050",
      padding: 16,
      color: "white",
      textAlign: "center",
      zIndex: 999,
    }}>
      <p>DYANA utilizza cookie tecnici. Accettando riceverai il bonus di benvenuto.</p>
      <button
        className="btn btn-primary"
        onClick={() => {
          localStorage.setItem("cookieAccepted", "true");
          setVisible(false);
          onAccept();
        }}
      >
        Accetto
      </button>
    </div>
  );
}

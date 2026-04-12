"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n/useI18n";

const STORAGE_KEY = "dyana_cookie_accepted"; // "accepted" | "rejected"

export default function CookieBanner() {
  const { t } = useI18n();

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
        <h2 className="cookie-title">{t("cookie.title")}</h2>

        <p className="cookie-text">
          {t("cookie.description")}
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
            {t("cookie.reject")}
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="cookie-accept-btn"
          >
            {t("cookie.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
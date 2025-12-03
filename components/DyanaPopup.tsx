// components/DyanaPopup.tsx
"use client";

import { useState, useMemo } from "react";

// Base URL del tuo bot DYANA su Typebot
const URL_BOT_DYANA_BASE = "https://typebot.co/dyana-ai";

type DyanaPopupProps = {
  typebotId?: string;      // per ora non lo usiamo, ma lo teniamo
  userId: string;
  sessionId: string;
  readingId: string;
  readingType: string;
  readingLabel: string;
  readingText: string;
  readingPayload: any;
  kbTags: string[];

  // 🔹 NUOVI CAMPI
  isPremium: boolean;          // true solo per letture premium
  questionsIncluded?: number;  // di default 2 (per le premium)
};

export function DyanaPopup(props: DyanaPopupProps) {
  const {
    userId,
    sessionId,
    readingId,
    readingType,
    readingLabel,
    readingText,
    readingPayload,
    kbTags,
    isPremium,
    questionsIncluded = 2,   // default: 2 domande incluse
  } = props;

  const [open, setOpen] = useState(false);

  // bottone abilitato solo se premium con domande > 0
  const isEnabled = isPremium && questionsIncluded > 0;

  const urlWithParams = useMemo(() => {
    try {
      const params = new URLSearchParams();

      if (userId) params.set("user_id", userId);
      if (sessionId) params.set("session_id", sessionId);
      if (readingId) params.set("reading_id", readingId);
      if (readingType) params.set("reading_type", readingType);
      if (readingLabel) params.set("reading_label", readingLabel);

      // reading_text potrebbe essere molto lungo: tagliamo un po' per sicurezza
      const safeReadingText = (readingText || "").slice(0, 6000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      // JSON grezzo per payload e kb_tags
      const payloadJson = JSON.stringify(readingPayload ?? {});
      const kbTagsJson = JSON.stringify(kbTags ?? []);

      params.set("reading_payload_json", payloadJson);
      params.set("kb_tags_json", kbTagsJson);

      // 🔹 Numero di domande incluse: solo se premium e > 0
      if (isEnabled) {
        params.set("questions_left_initial", String(questionsIncluded));
      } else {
        params.set("questions_left_initial", "0");
      }

      const qs = params.toString();
      if (!qs) return URL_BOT_DYANA_BASE;
      return `${URL_BOT_DYANA_BASE}?${qs}`;
    } catch (e) {
      console.error("[DYANA] errore build URL Typebot:", e);
      return URL_BOT_DYANA_BASE;
    }
  }, [
    userId,
    sessionId,
    readingId,
    readingType,
    readingLabel,
    readingText,
    readingPayload,
    kbTags,
    isEnabled,
    questionsIncluded,
  ]);

  const handleToggle = () => {
    if (!isEnabled) return; // safety: non aprire se non abilitato
    setOpen((prev) => !prev);
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Bottone */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleToggle}
        disabled={!isEnabled}
        style={
          !isEnabled
            ? {
                opacity: 0.6,
                cursor: "not-allowed",
              }
            : undefined
        }
      >
        {open ? "Chiudi DYANA" : "Chiedi a DYANA"}
      </button>

      {/* Messaggio informativo se NON è premium */}
      {!isEnabled && (
        <p
          style={{
            marginTop: 8,
            fontSize: "0.9rem",
            opacity: 0.8,
          }}
        >
          La chat con DYANA è disponibile solo per le letture Premium, che includono 2 domande di approfondimento.
        </p>
      )}

      {/* Finestra chat che si apre da sotto */}
      {open && isEnabled && (
        <div
          style={{
            marginTop: 16,
            width: "100%",
            height: "600px",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 22px 48px rgba(0,0,0,0.75)",
          }}
        >
          <iframe
            src={urlWithParams}
            style={{
              border: "none",
              width: "100%",
              height: "100%",
            }}
            allow="clipboard-write; microphone; camera"
          />
        </div>
      )}
    </div>
  );
}

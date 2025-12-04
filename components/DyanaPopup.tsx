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

  // NUOVI CAMPI
  isPremium: boolean;          // true solo per letture premium
  questionsIncluded?: number;  // default 2 per le premium
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
    isPremium,               // per ora NON lo usiamo per bloccare
    questionsIncluded = 2,
  } = props;

  const [open, setOpen] = useState(false);

  // 🔥 Per ora: bottone sempre abilitato (gating lo rimettiamo dopo)
  const isEnabled = true;

  const urlWithParams = useMemo(() => {
    try {
      const params = new URLSearchParams();

      if (userId) params.set("user_id", userId);
      if (sessionId) params.set("session_id", sessionId);
      if (readingId) params.set("reading_id", readingId);
      if (readingType) params.set("reading_type", readingType);
      if (readingLabel) params.set("reading_label", readingLabel);

      // reading_text potrebbe essere molto lungo: tagliamo un po' per sicurezza
      const safeReadingText = (readingText || "").slice(0, 2000);
      if (safeReadingText) params.set("reading_text", safeReadingText);

      // JSON grezzo per payload e kb_tags
      const payloadJson = JSON.stringify(readingPayload ?? {});
      const kbTagsJson = JSON.stringify(kbTags ?? []);

      params.set("reading_payload_json", payloadJson);
      params.set("kb_tags_json", kbTagsJson);

      // Numero di domande incluse: per ora sempre quelle che passiamo
      params.set("questions_left_initial", String(questionsIncluded));

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
    questionsIncluded,
  ]);

  const handleToggle = () => {
    if (!isEnabled) return;
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
      >
        {open ? "Chiudi DYANA" : "Chiedi a DYANA"}
      </button>

      {/* ⚠️ IMPORTANTE: l'iframe resta SEMPRE montato, lo nascondiamo soltanto */}
      <div
        style={{
          marginTop: 16,
          width: "100%",
          height: open ? "600px" : "0px",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          overflow: "hidden",
          borderRadius: "14px",
          border: open ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
          boxShadow: open ? "0 22px 48px rgba(0,0,0,0.75)" : "none",
          transition: "height 0.25s ease, opacity 0.25s ease, box-shadow 0.25s ease",
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
    </div>
  );
}

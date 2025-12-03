// components/DyanaPopup.tsx
"use client";

import { useState } from "react";

// Base URL del tuo bot DYANA su Typebot (quella che hai incollato)
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

  // Gating
  isPremium: boolean;          // true solo per letture premium
  questionsIncluded?: number;  // default 2 per le premium
};

export function DyanaPopup(props: DyanaPopupProps) {
  const {
    isPremium,
    questionsIncluded = 2,
  } = props;

  const [open, setOpen] = useState(false);

  // bottone abilitato solo se premium con domande > 0
  const isEnabled = isPremium && questionsIncluded > 0;

  const handleToggle = () => {
    if (!isEnabled) return; // non aprire se non abilitato
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
          className="card-text"
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
            src={URL_BOT_DYANA_BASE}
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

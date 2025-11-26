// components/DyanaPopup.tsx
"use client";

import { Popup, open } from "@typebot.io/react";

type DyanaPopupProps = {
  typebotId: string;           // slug del tuo Typebot (es. "diyana-qa-xxxxx")
  userId: string;
  sessionId: string;
  readingId: string;
  readingType: string;
  readingLabel: string;
  readingText: string;
  readingPayload: any;         // JSON dell'oroscopo/tema/sinastria
  kbTags: string[];            // es. ["tema_natale"]
};

export function DyanaPopup(props: DyanaPopupProps) {
  const {
    typebotId,
    userId,
    sessionId,
    readingId,
    readingType,
    readingLabel,
    readingText,
    readingPayload,
    kbTags,
  } = props;

  const handleOpen = () => {
    open();
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleOpen}
      >
        Chiedi a DYANA
      </button>

      <Popup
        typebot={typebotId}
        autoShowDelay={null}
        prefilledVariables={{
          user_id: userId,
          session_id: sessionId,
          reading_id: readingId,
          reading_type: readingType,
          reading_label: readingLabel,
          reading_text: readingText,
          reading_payload_json: JSON.stringify(readingPayload ?? {}),
          kb_tags_json: JSON.stringify(kbTags ?? []),
          questions_left_initial: 2,
        }}
      />
    </>
  );
}

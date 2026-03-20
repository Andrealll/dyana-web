"use client";

import { useMemo } from "react";
import { enqueueConversionEvent } from "./ConversionTracker";

function getVariant() {
  if (typeof window === "undefined") return "A";

  let v = null;
  try {
    v = localStorage.getItem("dyana_cta_variant");
    if (!v) {
      v = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem("dyana_cta_variant", v);
    }
  } catch {
    v = "A";
  }
  return v;
}

export default function DyanaCTA({ type = "premium", onClick, disabled = false }) {
  const variant = useMemo(() => getVariant(), []);

  const config = {
    A: {
      premium: {
        label: "Scopri cosa fare oggi",
        sub: "Consigli pratici e momenti chiave",
      },
      ask: {
        label: "Fai una domanda su questa giornata",
        sub: "Chiedi un chiarimento sulla lettura",
      },
    },
    B: {
      premium: {
        label: "Sblocca il momento migliore della giornata",
        sub: "Quando agire e cosa evitare",
      },
      ask: {
        label: "Chiedi cosa significa per te",
        sub: "Approfondisci un punto della lettura",
      },
    },
  };

  const cta = config[variant]?.[type] || config.A.premium;

  function handleClick() {
    try {
      enqueueConversionEvent("dyana_cta_click", {
        cta_type: type,
        cta_variant: variant,
      });
    } catch {}

    if (onClick) onClick();
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleClick}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 4,
          padding: "14px 16px",
          borderRadius: 16,
        }}
      >
        <span style={{ fontWeight: 800 }}>{cta.label}</span>
        <span style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: 500 }}>
          {cta.sub}
        </span>
      </button>
    </div>
  );
}
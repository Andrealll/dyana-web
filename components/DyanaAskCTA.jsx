"use client";

import { useMemo } from "react";
import { enqueueConversionEvent } from "./ConversionTracker";
import { useI18n } from "../lib/i18n/useI18n";

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

export default function DyanaAskCTA({ open = false, onClick, disabled = false }) {
  const { t } = useI18n();
  const variant = useMemo(() => getVariant(), []);

  const copy = {
    A: {
      closedTitle: t("cta.ask.A.closedTitle"),
      closedSub: t("cta.ask.A.closedSub"),
      openTitle: t("cta.ask.A.openTitle"),
      openSub: t("cta.ask.A.openSub"),
    },
    B: {
      closedTitle: t("cta.ask.B.closedTitle"),
      closedSub: t("cta.ask.B.closedSub"),
      openTitle: t("cta.ask.B.openTitle"),
      openSub: t("cta.ask.B.openSub"),
    },
  };

  const current = copy[variant] || copy.A;
  const title = open ? current.openTitle : current.closedTitle;
  const sub = open ? current.openSub : current.closedSub;

  function handleClick() {
    try {
      enqueueConversionEvent("dyana_cta_click", {
        cta_type: "ask",
        cta_variant: variant,
        cta_state: open ? "open" : "closed",
      });
    } catch {}

    if (onClick) onClick();
  }

  return (
    <button
      type="button"
      className="btn btn-primary"
      style={{
        marginTop: 16,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 18,
      }}
      onClick={handleClick}
      disabled={disabled}
    >
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <span style={{ fontWeight: 800 }}>{title}</span>
        <span style={{ fontSize: "0.85rem", opacity: 0.9, fontWeight: 500 }}>
          {sub}
        </span>
      </span>

      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.22)",
          border: "1px solid rgba(255,255,255,0.14)",
          flex: "0 0 auto",
        }}
      >
        <img
          src="/dyana-logo-NAV.png"
          alt="DYANA"
          style={{ width: 28, height: 28, objectFit: "contain" }}
        />
      </span>
    </button>
  );
}
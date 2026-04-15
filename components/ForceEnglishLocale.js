//components/ForceEnglishLocale.jsx
"use client";

import { useEffect } from "react";
import { useI18n } from "../lib/i18n/useI18n";

export default function ForceEnglishLocale() {
  const { setLocale } = useI18n();

  useEffect(() => {
    setLocale("en");
  }, [setLocale]);

  return null;
}
//LanguageSwitcher

"use client";

import { useI18n } from "../lib/i18n/useI18n";

export default function LanguageSwitcher() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="dyana-navbar-lang" aria-label={t("common.language")}>
      <button
        type="button"
        className={`dyana-navbar-lang-btn ${locale === "it" ? "active" : ""}`}
        onClick={() => setLocale("it")}
      >
        IT
      </button>

      <span className="dyana-navbar-lang-sep">|</span>

      <button
        type="button"
        className={`dyana-navbar-lang-btn ${locale === "en" ? "active" : ""}`}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
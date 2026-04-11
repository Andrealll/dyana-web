// lib/i18n/I18nProvider.jsx

"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_STORAGE_KEY,
} from "./config";
import { dictionaries } from "./dictionaries";

export const I18nContext = createContext(null);

function isSupportedLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale);
}

function normalizeLocale(locale) {
  if (!locale || typeof locale !== "string") return DEFAULT_LOCALE;
  const short = locale.toLowerCase().slice(0, 2);
  return isSupportedLocale(short) ? short : DEFAULT_LOCALE;
}

function getNestedValue(obj, key) {
  return key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

function translate(locale, key) {
  const safeLocale = normalizeLocale(locale);

  const currentValue = getNestedValue(dictionaries[safeLocale], key);
  if (currentValue !== undefined) return currentValue;

  const fallbackValue = getNestedValue(dictionaries[DEFAULT_LOCALE], key);
  if (fallbackValue !== undefined) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[i18n] Missing key "${key}" for locale "${safeLocale}". Fallback to "${DEFAULT_LOCALE}".`
      );
    }
    return fallbackValue;
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[i18n] Missing key "${key}" for locale "${safeLocale}" and fallback "${DEFAULT_LOCALE}".`
    );
  }

  return key;
}

export default function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (savedLocale) {
      setLocaleState(normalizeLocale(savedLocale));
      return;
    }

    const browserLocale = navigator.language || navigator.languages?.[0];
    setLocaleState(normalizeLocale(browserLocale));
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (newLocale) => {
    const safeLocale = normalizeLocale(newLocale);
    setLocaleState(safeLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, safeLocale);
  };

  const value = useMemo(() => {
    return {
      locale,
      setLocale,
      t: (key) => translate(locale, key),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
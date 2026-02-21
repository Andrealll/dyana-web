"use client";

import { useEffect } from "react";

const STORAGE_KEY = "dyana_pending_events";

// Whitelist: evita eventi arbitrari
const ALLOWED_EVENTS = new Set([
  "sinastria_completed",
  "tema_completed",
  "oroscopo_completed",
]);

// Retry config: se gtag non è pronto, ritenta
const RETRY_MAX = 6;          // tentativi
const RETRY_DELAY_MS = 500;   // ogni 0.5s

function readQueue() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

function removeQueue() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function isGtagReady() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function flushQueue() {
  const queue = readQueue();
  if (!queue.length) return;

  if (!isGtagReady()) return;

  const ADS_ID = "AW-17796576310";

  const ADS_CONFIG = {
    sinastria_completed: { label: "E8qVCPvykvgbELboiKZC", value: 5.0 },
    tema_completed: { label: "QkLdCJOuhfgbELboiKZC", value: 5.0 },
    oroscopo_completed: { label: "m68QCOzChfgbELboiKZC", value: 5.0 },
  };

  for (const item of queue) {
    const name = item?.name;
    if (!name || !ALLOWED_EVENTS.has(name)) continue;

    // 1) GA4 custom event
    window.gtag("event", name, item.params || {});

    // 2) Google Ads conversion
    const cfg = ADS_CONFIG[name];
    if (cfg) {
      window.gtag("event", "conversion", {
        send_to: `${ADS_ID}/${cfg.label}`,
        value: cfg.value,
        currency: "EUR",
      });
    }
  }

  removeQueue();
}

// Retry wrapper: prova a flushare anche se gtag arriva dopo
function flushQueueWithRetry(attempt = 0) {
  try {
    // se già pronto, flush e fine
    if (isGtagReady()) {
      flushQueue();
      return;
    }

    // se non pronto, ritenta un po'
    if (attempt >= RETRY_MAX) return;

    setTimeout(() => {
      flushQueueWithRetry(attempt + 1);
    }, RETRY_DELAY_MS);
  } catch {
    // no-op
  }
}

export function enqueueConversionEvent(eventName, params = {}) {
  if (!eventName || typeof eventName !== "string") return;
  if (!ALLOWED_EVENTS.has(eventName)) return;

  const evt = {
    name: eventName,
    params: params && typeof params === "object" ? params : {},
    ts: Date.now(),
  };

  const queue = readQueue();

  // Dedup: stesso evento negli ultimi 10 minuti
  const TEN_MIN = 10 * 60 * 1000;
  const already = queue.some(
    (q) => q.name === evt.name && Math.abs(evt.ts - (q.ts || 0)) < TEN_MIN
  );
  if (already) {
    // anche se dedup, prova comunque a flushare
    flushQueueWithRetry(0);
    return;
  }

  queue.push(evt);

  // Limit: max 20
  writeQueue(queue.slice(-20));

  // flush immediato (con retry se gtag non è pronto)
  flushQueueWithRetry(0);

  // notifica (retry)
  try {
    window.dispatchEvent(new Event("dyana:conversion-enqueued"));
  } catch {}
}

export default function ConversionTracker() {
  useEffect(() => {
    // al mount prova a flushare (con retry)
    flushQueueWithRetry(0);

    const onEnqueued = () => flushQueueWithRetry(0);
    window.addEventListener("dyana:conversion-enqueued", onEnqueued);

    const onVis = () => {
      if (document.visibilityState === "visible") flushQueueWithRetry(0);
    };
    document.addEventListener("visibilitychange", onVis);

    // importante: se l’utente chiude o naviga via subito dopo la conversione
    const onPageHide = () => flushQueueWithRetry(0);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      window.removeEventListener("dyana:conversion-enqueued", onEnqueued);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

export default function DeepLinkHandler() {
  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && window.Capacitor;
    if (!isCapacitor) return;

    let removeListener = null;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");

        const handler = (event) => {
          const url = event?.url;
          if (!url) return;

          // Se arriva un deep link verso dyana.app/auth/callback?... -> naviga dentro la WebView
          if (url.includes("https://dyana.app/")) {
            // Usa replace per evitare history “strana”
            window.location.replace(url);
          }
        };

        const res = await App.addListener("appUrlOpen", handler);
        removeListener = res?.remove || null;
      } catch (e) {
        // se per qualche motivo non carica il plugin, non blocchiamo nulla
        console.warn("DeepLinkHandler: unable to init", e);
      }
    })();

    return () => {
      try {
        if (removeListener) removeListener();
      } catch {}
    };
  }, []);

  return null;
}

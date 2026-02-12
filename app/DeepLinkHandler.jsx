"use client";

import { useEffect } from "react";

export default function DeepLinkHandler() {
  useEffect(() => {
    let removeListener = null;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor?.isNativePlatform?.()) return;

        const { App } = await import("@capacitor/app");

        const go = (url) => {
          try {
            if (!url) return;
            // Forziamo la WebView a navigare: così /auth/callback viene realmente caricato
            console.log("[DEEPLINK] navigate to:", url);
            window.location.href = url;
          } catch (e) {
            console.error("[DEEPLINK] navigate error:", e);
          }
        };

        // 1) Cold start: app aperta *direttamente* dal link
        try {
          const launch = await App.getLaunchUrl();
          const launchUrl = launch?.url || null;
          if (launchUrl) {
            console.log("[DEEPLINK] launchUrl:", launchUrl);
            go(launchUrl);
          }
        } catch (e) {
          console.warn("[DEEPLINK] getLaunchUrl failed:", e);
        }

        // 2) App già in memoria: arriva un nuovo deep link
        const handler = (event) => {
          const url = event?.url || null;
          console.log("[DEEPLINK] appUrlOpen:", url);
          go(url);
        };

        const sub = await App.addListener("appUrlOpen", handler);
        removeListener = () => sub?.remove?.();
      } catch (e) {
        console.warn("[DEEPLINK] not available:", e);
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

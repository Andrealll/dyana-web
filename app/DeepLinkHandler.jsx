"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function DeepLinkHandler() {
  const router = useRouter();
  const lastUrlRef = useRef(null);

  useEffect(() => {
    let removeListener = null;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor?.isNativePlatform?.()) return;

        const { App } = await import("@capacitor/app");

        const go = (incomingUrl) => {
          try {
            if (!incomingUrl) return;
            if (incomingUrl === lastUrlRef.current) return;
            lastUrlRef.current = incomingUrl;

            const u = new URL(incomingUrl);

            // accetta solo i link del dominio app
            if (u.host !== "dyana.app" && u.host !== "www.dyana.app") {
              console.warn("[DEEPLINK] host non gestito:", u.host);
              return;
            }

            const internalPath = `${u.pathname}${u.search}${u.hash}`;
            console.log("[DEEPLINK] internal navigate to:", internalPath);

            router.replace(internalPath);
          } catch (e) {
            console.error("[DEEPLINK] navigate error:", e);
          }
        };

        // 1) cold start
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

        // 2) app già aperta
        const sub = await App.addListener("appUrlOpen", (event) => {
          const url = event?.url || null;
          console.log("[DEEPLINK] appUrlOpen:", url);
          go(url);
        });

        removeListener = () => {
          try {
            sub?.remove?.();
          } catch {}
        };
      } catch (e) {
        console.warn("[DEEPLINK] not available:", e);
      }
    })();

    return () => {
      try {
        if (removeListener) removeListener();
      } catch {}
    };
  }, [router]);

  return null;
}
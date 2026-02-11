"use client";

import { useEffect } from "react";

export default function CapacitorFlag() {
  useEffect(() => {
    // Capacitor espone window.Capacitor nella webview
    if (typeof window !== "undefined" && window.Capacitor) {
      document.documentElement.classList.add("is-capacitor");
    } else {
      document.documentElement.classList.remove("is-capacitor");
    }
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyMagicLink, saveToken } from "../../../lib/authClient";

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("loading"); // loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const ml = sp.get("ml");
        if (!ml) throw new Error("Link mancante.");

        const data = await verifyMagicLink(ml);
        if (!data?.access_token) throw new Error("Token non presente nella risposta.");

        saveToken(data.access_token);

        router.replace("/"); // Home
      } catch (e) {
        setStatus("error");
        setError(e?.message || "Impossibile completare l’accesso.");
      }
    }
    run();
  }, [sp, router]);

  if (status === "error") {
    return (
      <div className="card">
        <h1 className="card-title">Errore accesso</h1>
        <p className="card-text" style={{ color: "#ff9a9a" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="card-title">Sto completando l’accesso…</h1>
      <p className="card-text" style={{ opacity: 0.85 }}>Un momento.</p>
    </div>
  );
}

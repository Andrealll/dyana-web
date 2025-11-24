// app/api/oroscopo_ai/[period]/route.js
import { NextResponse } from "next/server";

const VALID_PERIODS = ["daily", "weekly", "monthly", "yearly"];

// Capisco se sono in produzione su Vercel
const isProd = process.env.VERCEL === "1";

// Base URL del backend AstroBot (FastAPI / Render)
const ASTROBOT_BASE_URL = (() => {
  const fromEnv = process.env.ASTROBOT_BASE_URL
    ? process.env.ASTROBOT_BASE_URL.replace(/\/$/, "")
    : null;

  if (!fromEnv && isProd) {
    // In produzione NON voglio fallback a localhost
    throw new Error(
      "ASTROBOT_BASE_URL non configurata in produzione (Vercel)."
    );
  }

  // In dev posso usare il fallback a FastAPI locale
  return fromEnv || "http://127.0.0.1:8001";
})();

export async function POST(request, context) {
  try {
    // ================================
    // 1) Ricavo il periodo dalla URL
    // ================================
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // Esempio: /api/oroscopo_ai/daily  -> ["api","oroscopo_ai","daily"]
    const period = segments[segments.length - 1];

    console.log("[DYANA] Request URL:", url.toString());
    console.log("[DYANA] Period ricavato da URL:", period);

    // 2) Validazione periodo
    if (!VALID_PERIODS.includes(period)) {
      console.error("[DYANA] Periodo non valido:", period);

      return NextResponse.json(
        {
          error: `Periodo non valido: ${String(
            period
          )}. Usa uno tra: ${VALID_PERIODS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // ================================
    // 3) Body JSON in arrivo dal frontend
    // ================================
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      console.error("[DYANA] Body JSON non valido in /api/oroscopo_ai:", e);
      return NextResponse.json(
        {
          error: "Body JSON non valido nella richiesta.",
        },
        { status: 400 }
      );
    }

    // ================================
    // 4) Chiamata al backend AstroBot
    // ================================
    const backendUrl = `${ASTROBOT_BASE_URL}/oroscopo_ai/${period}`;
    console.log("[DYANA] Chiamo AstroBot:", backendUrl);

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "X-Engine": "new", // se ti serve
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    // 5) Gestione errori HTTP dal backend (4xx / 5xx)
    if (!res.ok) {
      const text = await res.text();
      console.error(
        "[DYANA] Errore backend oroscopo_ai:",
        res.status,
        text.slice(0, 1000)
      );

      return NextResponse.json(
        {
          error: "Errore dal server AstroBot.",
          status: res.status,
          backendBody: text,
        },
        { status: res.status }
      );
    }

    // 6) Tutto ok: giro la risposta JSON al frontend
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    // 7) Errori di rete, DNS, ECONNREFUSED, variabili mancanti, ecc.
    console.error("[DYANA] Impossibile comunicare con AstroBot:", err);

    return NextResponse.json(
      {
        error:
          "Impossibile comunicare con il server AstroBot. Riprova più tardi.",
        details: String(err),
      },
      { status: 502 }
    );
  }
}

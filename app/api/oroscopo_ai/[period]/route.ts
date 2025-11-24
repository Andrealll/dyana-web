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
    // Così se ti dimentichi la variabile su Vercel lo vedi subito nei log
    throw new Error(
      "ASTROBOT_BASE_URL non configurata in produzione (Vercel)."
    );
  }

  // In dev posso usare il fallback a FastAPI locale
  return fromEnv || "http://127.0.0.1:8001";
})();

export async function POST(request, { params }) {
  try {
    // 1. Estraggo il periodo dalla rotta dinamica [period]
    const period = params?.period;

    // 2. Validazione periodo
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

    // 3. Leggo il body della richiesta in arrivo dal frontend DYANA
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

    // 4. Costruisco l'URL del backend AstroBot
    const backendUrl = `${ASTROBOT_BASE_URL}/oroscopo_ai/${period}`;
    console.log("[DYANA] Chiamo AstroBot:", backendUrl);

    // 5. Chiamo il backend AstroBot
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // qui puoi aggiungere header extra se servono:
        // "X-Engine": "new",
        // "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      // di solito per API conviene non cache-are
      cache: "no-store",
    });

    // 6. Gestione errori HTTP dal backend (4xx / 5xx)
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

    // 7. Tutto ok: giro la risposta JSON così com’è al frontend
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    // 8. Errori di rete, DNS, ECONNREFUSED, variabili mancanti, ecc.
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

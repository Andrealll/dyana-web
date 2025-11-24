// app/api/oroscopo_ai/[period]/route.js
import { NextResponse } from "next/server";

const ALLOWED_PERIODS = new Set(["daily", "weekly", "monthly", "yearly"]);

/**
 * Restituisce la base URL del backend AstroBot.
 * - In produzione: richiede ASTROBOT_API_BASE_URL o NEXT_PUBLIC_ASTROBOT_API_BASE_URL
 * - In sviluppo: fallback su http://127.0.0.1:8001
 */
function getAstrobotBaseUrl() {
  const fromEnv =
    process.env.ASTROBOT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ASTROBOT_API_BASE_URL;

  if (fromEnv) {
    // tolgo eventuale "/" finale
    return fromEnv.replace(/\/+$/, "");
  }

  // In dev, se non hai impostato niente, usa il backend locale
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:8001";
  }

  // In produzione senza env: errore esplicito (così sai cosa manca)
  throw new Error(
    "[DYANA] ASTROBOT_API_BASE_URL non impostata in produzione. " +
      "Configura la variabile d'ambiente su Vercel."
  );
}

export async function POST(req, { params }) {
  const period = params?.period;

  // Validazione periodo dalla URL: /api/oroscopo_ai/[period]
  if (!period || !ALLOWED_PERIODS.has(period)) {
    return NextResponse.json(
      {
        status: "error",
        error:
          `Periodo non valido: ${period ?? "undefined"}. ` +
          "Usa uno tra: daily, weekly, monthly, yearly.",
      },
      { status: 400 }
    );
  }

  // Legge il body JSON in ingresso (città, data, ora, nome, tier, ecc.)
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: "error",
        error: "Body JSON non valido.",
      },
      { status: 400 }
    );
  }

  try {
    const baseUrl = getAstrobotBaseUrl();
    const upstreamUrl = `${baseUrl}/oroscopo_ai/${period}`;

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Provo a leggere il JSON di risposta dal backend
    const data = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          status: "error",
          error:
            data?.error ||
            `Errore dal backend AstroBot (${upstreamRes.status})`,
        },
        { status: upstreamRes.status }
      );
    }

    // Pass-through trasparente verso il frontend DYANA
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[DYANA] Errore oroscopo_ai:", err);
    return NextResponse.json(
      {
        status: "error",
        error:
          "Impossibile comunicare con il server AstroBot. " +
          "Riprova più tardi.",
      },
      { status: 500 }
    );
  }
}

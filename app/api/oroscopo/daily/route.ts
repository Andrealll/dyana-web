// app/api/oroscopo_ai/daily/route.js

import { NextResponse } from "next/server";

// URL del backend AstroBot (chatbot-test)
const API_BASE =
  process.env.NEXT_PUBLIC_ASTROBOT_API_BASE ||
  process.env.ASTROBOT_API_BASE ||
  "http://127.0.0.1:8001";

export const dynamic = "force-dynamic";

/**
 * POST /api/oroscopo_ai/daily
 * Proxy verso: {API_BASE}/oroscopo_ai/daily
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (_err) {
    return NextResponse.json(
      { error: "Body JSON non valido nella richiesta." },
      { status: 400 }
    );
  }

  try {
    const backendRes = await fetch(`${API_BASE}/oroscopo_ai/daily`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Risposta non valida dal backend AstroBot (JSON non parsabile).",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[DYANA] Errore chiamando backend AstroBot:", err);
    return NextResponse.json(
      {
        error:
          "Impossibile comunicare con il backend AstroBot (oroscopo_ai). Controlla che sia avviato.",
      },
      { status: 502 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Usa POST su questa route." },
    { status: 405 }
  );
}

// app/api/oroscopo_ai/[periodo]/route.js

import { NextResponse } from "next/server";

/**
 * Base URL del backend AstroBot.
 * Priorità:
 * - ASTROBOT_API_BASE (server-side)
 * - NEXT_PUBLIC_ASTROBOT_API_BASE (se usato anche lato client/dev)
 * - fallback: URL di Render
 */
const ASTROBOT_API_BASE =
  process.env.ASTROBOT_API_BASE ||
  process.env.NEXT_PUBLIC_ASTROBOT_API_BASE ||
  "https://chatbot-test-0h4o.onrender.com";

/**
 * POST /api/oroscopo_ai/[periodo]
 * Esempi:
 * - /api/oroscopo_ai/daily
 * - /api/oroscopo_ai/weekly
 * - /api/oroscopo_ai/monthly
 * - /api/oroscopo_ai/yearly
 *
 * Proxy verso il backend AstroBot:
 * - /oroscopo_ai/{periodo}
 */
export async function POST(req, { params }) {
  const { periodo } = params;

  // ci aspettiamo già uno slug valido: daily, weekly, monthly, yearly
  const slug = periodo;

  if (!slug) {
    return NextResponse.json(
      { error: "Periodo mancante o non valido." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Body JSON non valido nella richiesta." },
      { status: 400 }
    );
  }

  // Costruisco URL backend
  const backendUrl = `${ASTROBOT_API_BASE}/oroscopo_ai/${slug}`;

  try {
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Se in futuro vuoi usare X-Engine:
        // "X-Engine": "new",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      console.error("[DYANA /api/oroscopo_ai] backend non OK:", res.status, data);
      return NextResponse.json(
        {
          error:
            (data && data.error) ||
            `Errore dal backend AstroBot (status ${res.status}).`,
          raw: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? {});
  } catch (err) {
    console.error("[DYANA /api/oroscopo_ai] ERRORE di rete/fetch:", err);
    return NextResponse.json(
      {
        error:
          "Impossibile contattare il backend AstroBot. Verifica ASTROBOT_API_BASE e la raggiungibilità di Render.",
        detail: String(err),
        backendUrl,
      },
      { status: 500 }
    );
  }
}

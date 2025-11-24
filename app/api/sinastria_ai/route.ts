// app/api/sinastria_ai/route.js

import { NextResponse } from "next/server";

const ASTROBOT_BASE_URL =
  process.env.ASTROBOT_BASE_URL || "http://127.0.0.1:8001";

export async function POST(request) {
  try {
    const payload = await request.json();

    // LOG per sicurezza: vediamo cosa parte dal frontend
    console.log("[DYANA] /api/sinastria_ai payload:", JSON.stringify(payload));

    const url = `${ASTROBOT_BASE_URL}/sinastria_ai/`; // NOTA: slash finale

    const backendResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Mando ESATTAMENTE {A,B,tier}
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      console.error(
        "[DYANA] Errore sinastria_ai backend:",
        backendResponse.status,
        data
      );

      return NextResponse.json(
        {
          error: "Errore dal motore AstroBot",
          status: backendResponse.status,
          backend: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[DYANA] Errore sinastria_ai API route:", err);
    return NextResponse.json(
      {
        error: "Errore interno nella route sinastria_ai",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

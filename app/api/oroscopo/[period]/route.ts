import { NextResponse } from "next/server";

const ASTROBOT_BASE = process.env.ASTROBOT_BASE_URL || "http://127.0.0.1:8001";

// Periodi validi supportati dal backend
const VALID_PERIODS = ["daily", "weekly", "monthly", "yearly"];

export async function POST(req: Request) {
  try {
    // Ricaviamo il "period" dall'URL, es: /api/oroscopo/daily
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean); // toglie stringhe vuote
    const period = segments[segments.length - 1]; // ultimo segmento: "daily", "weekly", ecc.

    // Validazione periodo
    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        {
          error: `Invalid period '${period}'. Must be one of ${VALID_PERIODS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Body dal frontend
    const body = await req.json();

    // Proxy verso AstroBot
    const backendUrl = `${ASTROBOT_BASE}/oroscopo/${period}`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Usa il motore nuovo di AstroBot
        "X-Engine": "new",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[OROSCOPO NEXT API ERROR]", err);

    return NextResponse.json(
      { error: "Internal Next.js proxy error", details: err?.message },
      { status: 500 }
    );
  }
}

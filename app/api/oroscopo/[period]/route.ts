import { NextResponse } from "next/server";

const ASTROBOT_BASE = process.env.ASTROBOT_BASE_URL || "http://127.0.0.1:8001";

// Periodi validi supportati dal backend
const VALID_PERIODS = ["daily", "weekly", "monthly", "yearly"];

export async function POST(req: Request) {
  try {
    // Ricaviamo il "period" dall'URL, es: /api/oroscopo/daily
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean); // ["api","oroscopo","daily"]
    const period = segments[segments.length - 1]; // "daily" | "weekly" | ...

    console.log("[NEXT OROSCOPO] pathname =", url.pathname);
    console.log("[NEXT OROSCOPO] segments =", segments);
    console.log("[NEXT OROSCOPO] period =", period);

    // Validazione periodo
    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        {
          error: `Invalid period '${period}'. Must be one of ${VALID_PERIODS.join(
            ", "
          )}`,
          debug: { pathname: url.pathname, segments, period },
        },
        { status: 400 }
      );
    }

    // Body dal frontend
    const body = await req.json();
    console.log("[NEXT OROSCOPO] body ricevuto =", body);

    // URL backend AstroBot
    const backendUrl = `${ASTROBOT_BASE}/oroscopo/${period}`;
    console.log("[NEXT OROSCOPO] ASTROBOT_BASE =", ASTROBOT_BASE);
    console.log("[NEXT OROSCOPO] backendUrl   =", backendUrl);

    // Proxy verso AstroBot
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Engine": "new",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    console.log("[NEXT OROSCOPO] backend status =", res.status);

    // Propaghiamo così com'è la risposta
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[OROSCOPO NEXT API ERROR]", err);

    return NextResponse.json(
      { error: "Internal Next.js proxy error", details: err?.message },
      { status: 500 }
    );
  }
}

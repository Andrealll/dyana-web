import { NextResponse } from "next/server";

const ASTROBOT_BASE_URL =
  process.env.NEXT_PUBLIC_ASTROBOT_API_BASE_URL ||
  process.env.ASTROBOT_API_BASE_URL ||
  "http://127.0.0.1:8001";

const ALLOWED_PERIODS = ["daily", "weekly", "monthly", "yearly"];

/**
 * Risolve il periodo dai params, gestendo sia:
 * - params: { period: string }
 * - params: Promise<{ period: string }>
 */
async function resolvePeriod(context) {
  try {
    const paramsMaybePromise = context?.params;

    let params = paramsMaybePromise || {};
    if (typeof paramsMaybePromise?.then === "function") {
      // è una Promise<{ period: string }>
      params = (await paramsMaybePromise) || {};
    }

    const raw = params.period || "";
    const candidate = String(raw).toLowerCase();

    if (ALLOWED_PERIODS.includes(candidate)) {
      return candidate;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function POST(req, context) {
  // ⚠️ Qui rispettiamo la firma che vuole Next:
  // (req: NextRequest, context: { params: Promise<{ period: string }> })
  const period = await resolvePeriod(context);

  if (!period) {
    let rawPeriod = "undefined";

    try {
      const paramsMaybePromise = context?.params;
      let params = paramsMaybePromise || {};
      if (typeof paramsMaybePromise?.then === "function") {
        params = (await paramsMaybePromise) || {};
      }
      if (params && params.period) {
        rawPeriod = params.period;
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json(
      {
        status: "error",
        error: `Periodo non valido: ${rawPeriod}. Usa uno tra: ${ALLOWED_PERIODS.join(
          ", "
        )}.`,
      },
      { status: 400 }
    );
  }

  // Body JSON dalla richiesta
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: "Body JSON non valido.",
      },
      { status: 400 }
    );
  }

  const astrobotUrl = `${ASTROBOT_BASE_URL}/oroscopo_ai/${period}`;

  try {
    const backendResp = await fetch(astrobotUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await backendResp.json();
    } catch (e) {
      return NextResponse.json(
        {
          status: "error",
          error: "Risposta non valida dal backend AstroBot (non JSON).",
          backend_status: backendResp.status,
        },
        { status: 502 }
      );
    }

    if (!backendResp.ok) {
      return NextResponse.json(
        {
          status: "error",
          error: "Errore dalla API AstroBot.",
          backend_status: backendResp.status,
          backend_data: data,
        },
        { status: backendResp.status }
      );
    }

    // Tutto ok: inoltro la risposta dell'engine
    return NextResponse.json(data);
  } catch (err) {
    console.error("[DYANA] Errore oroscopo_ai:", err);
    return NextResponse.json(
      {
        status: "error",
        error: "Impossibile contattare il backend AstroBot.",
        details: err?.message || String(err),
      },
      { status: 502 }
    );
  }
}

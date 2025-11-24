import { NextRequest, NextResponse } from "next/server";

const ASTROBOT_BASE_URL =
  process.env.NEXT_PUBLIC_ASTROBOT_API_BASE_URL ||
  process.env.ASTROBOT_API_BASE_URL ||
  "http://127.0.0.1:8001";

const ALLOWED_PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;
type PeriodCode = (typeof ALLOWED_PERIODS)[number];

// ------------------------------------------------------
// Helper: estrai il periodo dalla URL / contesto Next
// ------------------------------------------------------
function getPeriodFromRequest(
  req: NextRequest,
  context?: { params?: { period?: string } }
): PeriodCode | null {
  const fromParams = context?.params?.period;

  let fromPath: string | undefined;
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // es: ["api", "oroscopo_ai", "weekly"] → "weekly"
    fromPath = segments[segments.length - 1];
  } catch {
    fromPath = undefined;
  }

  const candidate = (fromParams || fromPath || "").toLowerCase();
  if (ALLOWED_PERIODS.includes(candidate as PeriodCode)) {
    return candidate as PeriodCode;
  }
  return null;
}

// ------------------------------------------------------
// Handler POST /api/oroscopo_ai/[period]
// ------------------------------------------------------
export async function POST(
  req: NextRequest,
  context: { params?: { period?: string } }
) {
  const period = getPeriodFromRequest(req, context);

  if (!period) {
    return NextResponse.json(
      {
        status: "error",
        error: `Periodo non valido: ${
          context?.params?.period ?? "undefined"
        }. Usa uno tra: ${ALLOWED_PERIODS.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  // Body JSON in ingresso da DYANA
  let body: any;
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

  const astrobotUrl = `${ASTROBOT_BASE_URL}/oroscopo_ai/${period}`;

  try {
    const backendResp = await fetch(astrobotUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Proviamo sempre a parsare il JSON del backend (anche in errore)
    const data = await backendResp.json().catch(() => null);

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

    // Pass-through della risposta di AstroBot
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[DYANA] Errore oroscopo_ai:", err);
    return NextResponse.json(
      {
        status: "error",
        error: "Impossibile contattare il backend AstroBot.",
        details: err?.message ?? String(err),
      },
      { status: 502 }
    );
  }
}

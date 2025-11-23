import { NextResponse } from "next/server";

// Periodi validi supportati dal backend
const VALID_PERIODS = ["daily", "weekly", "monthly", "yearly"];

export async function POST(req: Request) {
  try {
    // Ricaviamo il "period" dall'URL, es: /api/oroscopo/daily
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean); // ["api","oroscopo","daily"]
    const period = segments[segments.length - 1]; // "daily" | "weekly" | ...

    console.log("[NEXT OROSCOPO DEBUG] pathname =", url.pathname);
    console.log("[NEXT OROSCOPO DEBUG] segments =", segments);
    console.log("[NEXT OROSCOPO DEBUG] period =", period);

    // Validazione periodo
    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        {
          error: `Invalid period '${period}'. Must be one of ${VALID_PERIODS.join(
            ", "
          )}`,
          debug: {
            pathname: url.pathname,
            segments,
            period,
          },
        },
        { status: 400 }
      );
    }

    // Body dal frontend
    const body = await req.json();

    console.log("[NEXT OROSCOPO DEBUG] body =", body);

    // ⚠️ PER ORA NON CHIAMIAMO IL BACKEND
    // Torniamo solo un JSON di debug
    return NextResponse.json(
      {
        debug: true,
        message: "Next API /api/oroscopo/[period] raggiunta correttamente.",
        period,
        receivedBody: body,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[OROSCOPO NEXT API ERROR]", err);

    return NextResponse.json(
      { error: "Internal Next.js proxy error", details: err?.message },
      { status: 500 }
    );
  }
}

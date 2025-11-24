import { NextRequest, NextResponse } from "next/server";

const ASTROBOT_BASE_URL =
  process.env.ASTROBOT_BASE_URL || "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Qui chiamiamo il backend AstroBot
    const res = await fetch(`${ASTROBOT_BASE_URL}/sinastria_ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[DYANA] Errore sinastria_ai backend:", res.status, text);
      return NextResponse.json(
        {
          error: "Errore dal motore AstroBot",
          status: res.status,
          details: text,
        },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[DYANA] Errore sinastria_ai API route:", err);
    return NextResponse.json(
      {
        error: "Errore interno nella route sinastria_ai",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

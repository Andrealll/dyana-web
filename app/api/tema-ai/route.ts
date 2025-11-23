import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.ASTROBOT_BASE_URL ?? "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { citta, data, ora, nome, tier } = body || {};

    // --- VALIDAZIONE ---
    if (!citta || !data || !ora || !tier) {
      return NextResponse.json(
        {
          status: "error",
          message: "Campi obbligatori mancanti (città, data, ora, tier).",
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_BASE_URL.replace(/\/$/, "")}/tema_ai`;

    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citta,
        data,
        ora,
        nome: nome || null,
        tier,
      }),
    });

    // --- PARSE JSON SICURO ---
    let dataJson: any = null;
    try {
      dataJson = await resp.json();
    } catch (e) {
      const raw = await resp.text().catch(() => null);
      return NextResponse.json(
        {
          status: "error",
          message: `Il backend /tema_ai ha risposto con contenuto non JSON (HTTP ${resp.status}).`,
          backendRaw: raw,
        },
        { status: 500 }
      );
    }

    // --- HTTP NON OK ---
    if (!resp.ok) {
      return NextResponse.json(
        {
          status: "error",
          message:
            dataJson?.message ||
            `Backend /tema_ai ha risposto con HTTP ${resp.status}.`,
          backend: dataJson,
        },
        { status: resp.status }
      );
    }

    // --- PAYLOAD NON VALIDO ---
    if (!dataJson || dataJson.status !== "ok" || !dataJson.result) {
      return NextResponse.json(
        {
          status: "error",
          message:
            dataJson?.message ||
            "Il backend non ha restituito un risultato valido per il tema natale.",
          backend: dataJson,
        },
        { status: 500 }
      );
    }

    // --- OK ---
    return NextResponse.json(dataJson);

  } catch (error: any) {
    console.error("[/api/tema-ai] Errore di rete o runtime:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Errore di rete o server non raggiungibile.",
      },
      { status: 500 }
    );
  }
}

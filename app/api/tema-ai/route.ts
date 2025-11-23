// app/api/tema-ai/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.ASTROBOT_BACKEND_URL ?? "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { citta, data, ora, nome, tier } = body || {};

    // Validazione minima lato Next
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

    let dataJson: any = null;
    try {
      dataJson = await resp.json();
    } catch (e) {
      console.error("[/api/tema-ai] Errore nel parse JSON dal backend:", e);
      return NextResponse.json(
        {
          status: "error",
          message: `Il backend /tema_ai ha risposto con un contenuto non JSON (HTTP ${resp.status}).`,
          backendRaw: await resp.text().catch(() => null),
        },
        { status: 500 }
      );
    }

    // 🔍 Log lato server Next (vedi console di `npm run dev`)
    console.log("[/api/tema-ai] backend status:", resp.status);
    console.log("[/api/tema-ai] backend payload:", dataJson);

    // Caso: HTTP non ok (404, 500, ecc.)
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

    // Caso: payload non conforme al contratto atteso
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

    // ✅ Caso OK: ritorno tutto al frontend
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

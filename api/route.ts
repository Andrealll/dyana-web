// app/api/tema-ai/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.ASTROBOT_BACKEND_URL ?? "https://chatbot-test-0h4o.onrender.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validazione minima lato frontend
    const { citta, data, ora, nome, tier } = body;
    if (!citta || !data || !ora || !tier) {
      return NextResponse.json(
        { status: "error", message: "Campi obbligatori mancanti." },
        { status: 400 }
      );
    }

    const resp = await fetch(`${BACKEND_BASE_URL}/tema_ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const dataJson = await resp.json();

    if (!resp.ok || dataJson.status !== "ok" || !dataJson.result) {
      return NextResponse.json(
        {
          status: "error",
          message: "Impossibile generare il tema natale in questo momento.",
          backend: dataJson,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(dataJson);
  } catch (error: any) {
    console.error("Errore /api/tema-ai:", error);
    return NextResponse.json(
      { status: "error", message: "Errore di rete o server non raggiungibile." },
      { status: 500 }
    );
  }
}

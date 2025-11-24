// app/api/sinastria_ai/route.ts
import { NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.ASTROBOT_API_BASE ?? "http://127.0.0.1:8001"; 
// In produzione imposta ASTROBOT_API_BASE = https://chatbot-test-0h4o.onrender.com

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Chiamata al backend FastAPI
    const res = await fetch(`${BACKEND_BASE}/sinastria_ai/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("Backend /sinastria_ai NON OK:", res.status, text);
      return NextResponse.json(
        { error: "Errore dal backend sinastria_ai", detail: text },
        { status: 500 }
      );
    }

    // Se OK, ritrasmetti il JSON al client
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Errore route /api/sinastria_ai:", err);
    return NextResponse.json(
      { error: "Errore interno API sinastria_ai", detail: String(err) },
      { status: 500 }
    );
  }
}

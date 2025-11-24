import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://chatbot-test-0h4o.onrender.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/sinastria_ai/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Backend /sinastria_ai error:", res.status, data);
      return NextResponse.json(
        {
          error: "backend_error",
          status: res.status,
          detail: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy /api/sinastria_ai error:", err);
    return NextResponse.json(
      {
        error: "proxy_error",
      },
      { status: 500 }
    );
  }
}

// app/api/sinastria_ai/route.ts
export const runtime = "nodejs"; // opzionale ma consigliato

const BACKEND_BASE =
  process.env.DYANA_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8001"; // fallback solo per locale

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_BASE}/sinastria_ai/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      console.error("sinastria_ai backend error", backendRes.status, data);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "backend_error",
          httpStatus: backendRes.status,
          backend: data,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sinastria_ai API route error", err);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "api_route_error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const rsc = req.headers.get("rsc");
  const action = req.headers.get("next-action");

  // Se vuoi bloccare chiamate "RSC" sospette, fallo SOLO sulle API
  if (rsc === "1" && !action) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

// IMPORTANTISSIMO: limita il middleware alle sole API
export const config = {
  matcher: ["/api/:path*"],
};

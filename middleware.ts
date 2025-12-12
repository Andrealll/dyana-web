import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const rsc = req.headers.get("rsc");
  const action = req.headers.get("next-action");

  // Blocca richieste RSC sospette senza contesto Server Action
  if (rsc === "1" && !action) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

// Applica a tutte le route (incluso /api)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

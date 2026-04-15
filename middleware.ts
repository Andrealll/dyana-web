import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname || "/";
  const isApi = pathname.startsWith("/api/");
  const rsc = req.headers.get("rsc");
  const action = req.headers.get("next-action");

  // Blocca chiamate RSC sospette SOLO sulle API
  if (isApi && rsc === "1" && !action) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const response = NextResponse.next();

  // Header lingua per layout SSR
  const lang =
    pathname === "/en" || pathname.startsWith("/en/")
      ? "en"
      : "it";

  response.headers.set("x-dyana-lang", lang);

  return response;
}

// Applica il middleware a tutto, ma escludi statici interni
export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
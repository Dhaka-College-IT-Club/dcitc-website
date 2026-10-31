import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasUser = !!req.cookies.get("dcitc_at")?.value;
  const hasAdmin = !!req.cookies.get("dcitc_admin")?.value;

  if (pathname === "/dashboard" && !hasUser) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!hasAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/admin/:path*"],
};
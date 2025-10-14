import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedPaths = ["/dashboard", "/subscription"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Check for Auth.js session token cookie
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value; // Fallback for non-HTTPS

  console.log("SESSION TOKEN:", sessionToken ? "EXISTS" : "NULL");

  // No token - redirect to /login
  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in - prevent access to /login
  if (pathname === "/login" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*", "/login"],
};

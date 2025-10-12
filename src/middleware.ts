import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Pages that require authentication
  const protectedPaths = ["/dashboard", "/subscription"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Get JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If no token and visiting a protected route → redirect to /login
  if (isProtected && !token) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If visiting /login and already authenticated → redirect to /dashboard
  if (pathname === "/login" && token) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Otherwise, continue as usual
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/subscription", "/login"],
};

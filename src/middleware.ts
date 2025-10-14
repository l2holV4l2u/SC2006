import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedPaths = ["/dashboard", "/subscription"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Get JWT token from cookies
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  console.log("TOKEN CHECK:", token);
  console.log("SECRET CHECK:", process.env.NEXTAUTH_SECRET);

  // No token - redirect to /login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in - prevent access to /login
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/subscription"],
};

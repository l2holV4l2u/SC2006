import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  // Get session token from cookies (same as middleware)
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Decode the JWT to get user info
  let token;
  try {
    token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: "__Secure-authjs.session-token",
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  if (!["STANDARD", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { email: token.email as string },
      data: {
        role: plan,
        renewSubscription: new Date(),
      },
    });

    return NextResponse.json({ message: "Subscription updated" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

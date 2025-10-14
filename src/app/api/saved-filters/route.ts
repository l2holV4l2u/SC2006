import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await prisma.savedFilter.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(filters);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, filters } = body;

  if (!name || !filters) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const saved = await prisma.savedFilter.create({
    data: { name, filters, userId: user.id },
  });

  return NextResponse.json(saved);
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accept id from query string OR request JSON body (more robust)
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json().catch(() => null);
        if (body?.id) id = body.id;
      } catch (e) {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing filter id" }, { status: 400 });
    }

    // Find the user once
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete only if the filter belongs to this user — do it atomically
    const deleted = await prisma.savedFilter.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      // either it didn't exist or it didn't belong to this user
      return NextResponse.json(
        { error: "Filter not found or not owned by you" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("DELETE /api/saved-filters error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

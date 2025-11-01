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

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, filters } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing filter id" }, { status: 400 });
    }

    if (!name && !filters) {
      return NextResponse.json(
        { error: "Must provide name or filters to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if filter exists and belongs to user
    const existingFilter = await prisma.savedFilter.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingFilter) {
      return NextResponse.json(
        { error: "Filter not found or not owned by you" },
        { status: 404 }
      );
    }

    // Update the filter
    const updated = await prisma.savedFilter.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(filters && { filters }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/saved-filters error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deleted = await prisma.savedFilter.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
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

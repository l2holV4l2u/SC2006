import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, extendDays } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const renewDate = new Date(user.renewSubscription);
  renewDate.setDate(renewDate.getDate() + extendDays);

  await prisma.user.update({
    where: { email },
    data: { renewSubscription: renewDate },
  });

  return NextResponse.json({ message: "Subscription extended", renewDate });
}

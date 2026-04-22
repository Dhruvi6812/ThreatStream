import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();

  for (const t of data) {
    if (!t.ip) continue;

    await prisma.threat.upsert({
      where: { ip: t.ip },
      update: {
        abuse_score: t.abuse_score,
        country: t.country,
        isp: t.isp,
      },
      create: {
        ip: t.ip,
        abuse_score: t.abuse_score,
        country: t.country,
        isp: t.isp,
      },
    });
  }

  return NextResponse.json({ success: true });
}
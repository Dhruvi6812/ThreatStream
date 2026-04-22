import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { ip, domain, userId } = await req.json();

    if (!ip || !userId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    await prisma.iPSearch.create({
      data: {
        ip,
        domain,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SAVE IP ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
}
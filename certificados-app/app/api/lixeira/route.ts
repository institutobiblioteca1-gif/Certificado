import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [lotes, certificados] = await Promise.all([
    prisma.lote.findMany({
      where: { deletedAt: { not: null } },
      include: { curso: true, evento: true },
      orderBy: { deletedAt: "desc" }
    }),
    prisma.certificado.findMany({
      where: { deletedAt: { not: null }, lote: { deletedAt: null } },
      include: { lote: true },
      orderBy: { deletedAt: "desc" }
    })
  ]);
  return NextResponse.json({ lotes, certificados });
}

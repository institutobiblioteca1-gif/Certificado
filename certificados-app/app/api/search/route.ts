import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ certificados: [] });

  const certificados = await prisma.certificado.findMany({
    where: {
      deletedAt: null,
      OR: [
        { aluno: { contains: q, mode: "insensitive" } },
        { numero: { contains: q, mode: "insensitive" } },
        { lote: { nome: { contains: q, mode: "insensitive" } } },
        { lote: { curso: { nome: { contains: q, mode: "insensitive" } } } },
        { lote: { evento: { nome: { contains: q, mode: "insensitive" } } } },
        { lote: { turma: { contains: q, mode: "insensitive" } } },
        { lote: { ano: { contains: q, mode: "insensitive" } } }
      ]
    },
    include: { lote: { include: { curso: true, evento: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ certificados });
}

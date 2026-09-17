import { NextRequest, NextResponse } from "next/server";
import { apagarArquivo } from "@/lib/armazenamento";
import { prisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  if (!asset) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await apagarArquivo(asset.url);

  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

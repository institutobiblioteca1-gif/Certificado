import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  if (!asset) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  try {
    await del(asset.url);
  } catch {
    // segue mesmo se o blob já não existir
  }

  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

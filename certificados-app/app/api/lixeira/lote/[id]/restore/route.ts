import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await prisma.lote.update({ where: { id: params.id }, data: { deletedAt: null } });
  await prisma.certificado.updateMany({ where: { loteId: params.id }, data: { deletedAt: null } });
  return NextResponse.json({ ok: true });
}

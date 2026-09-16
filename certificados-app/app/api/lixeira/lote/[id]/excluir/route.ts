import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const certificados = await prisma.certificado.findMany({ where: { loteId: params.id } });
  for (const cert of certificados) {
    try { await del(cert.pdfUrl); } catch {}
  }
  await prisma.certificado.deleteMany({ where: { loteId: params.id } });
  await prisma.lote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

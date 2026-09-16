import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const cert = await prisma.certificado.findUnique({ where: { id: params.id } });
  if (cert) {
    try { await del(cert.pdfUrl); } catch {}
    await prisma.certificado.delete({ where: { id: params.id } });
  }
  return NextResponse.json({ ok: true });
}

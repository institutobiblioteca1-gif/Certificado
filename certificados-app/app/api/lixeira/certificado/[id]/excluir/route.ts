import { NextResponse } from "next/server";
import { apagarArquivo } from "@/lib/armazenamento";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const cert = await prisma.certificado.findUnique({ where: { id: params.id } });
  if (cert) {
    await apagarArquivo(cert.pdfUrl);
    await prisma.certificado.delete({ where: { id: params.id } });
  }
  return NextResponse.json({ ok: true });
}

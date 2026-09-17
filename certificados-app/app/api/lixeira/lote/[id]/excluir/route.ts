import { NextResponse } from "next/server";
import { apagarArquivo } from "@/lib/armazenamento";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const certificados = await prisma.certificado.findMany({ where: { loteId: params.id } });
  for (const cert of certificados) {
    await apagarArquivo(cert.pdfUrl);
  }
  await prisma.certificado.deleteMany({ where: { loteId: params.id } });
  await prisma.lote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

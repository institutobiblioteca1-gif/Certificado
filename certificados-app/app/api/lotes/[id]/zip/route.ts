import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lote = await prisma.lote.findUnique({
    where: { id: params.id },
    include: { certificados: { where: { deletedAt: null } } }
  });
  if (!lote) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const zip = new JSZip();
  for (const cert of lote.certificados) {
    const res = await fetch(cert.pdfUrl);
    const buffer = await res.arrayBuffer();
    zip.file(`${cert.numero} - ${cert.aluno}.pdf`, buffer);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const nomeArquivo = lote.nome.replace(/[^a-zA-Z0-9]+/g, "_") + ".zip";

  return new NextResponse(zipBytes, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`
    }
  });
}

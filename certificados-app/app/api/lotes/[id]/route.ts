import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lote = await prisma.lote.findUnique({
    where: { id: params.id },
    include: {
      curso: true,
      evento: true,
      modelo: true,
      certificados: { where: { deletedAt: null }, orderBy: { numero: "asc" } }
    }
  });
  if (!lote) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(lote);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const lote = await prisma.lote.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      turma: data.turma,
      ano: data.ano,
      dataRealizacao: data.dataRealizacao,
      cargaHoraria: data.cargaHoraria,
      local: data.local
    }
  });
  return NextResponse.json(lote);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const agora = new Date();
  await prisma.lote.update({ where: { id: params.id }, data: { deletedAt: agora } });
  await prisma.certificado.updateMany({ where: { loteId: params.id }, data: { deletedAt: agora } });
  return NextResponse.json({ ok: true });
}

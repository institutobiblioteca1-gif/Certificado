import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const evento = await prisma.evento.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      data: data.data || null,
      local: data.local || null,
      cargaHoraria: data.cargaHoraria || null,
      instituicao: data.instituicao || null,
      ano: data.ano || null
    }
  });
  return NextResponse.json(evento);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.evento.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

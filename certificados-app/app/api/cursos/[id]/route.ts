import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const curso = await prisma.curso.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      cargaHoraria: data.cargaHoraria || null,
      instituicao: data.instituicao || null,
      ano: data.ano || null,
      status: data.status || "Ativo"
    }
  });
  return NextResponse.json(curso);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.curso.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

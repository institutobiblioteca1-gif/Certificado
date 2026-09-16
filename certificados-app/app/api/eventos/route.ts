import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const eventos = await prisma.evento.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(eventos);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.nome) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  const evento = await prisma.evento.create({
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
  return NextResponse.json(evento, { status: 201 });
}

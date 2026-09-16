import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const cursos = await prisma.curso.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(cursos);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.nome) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  const curso = await prisma.curso.create({
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      cargaHoraria: data.cargaHoraria || null,
      instituicao: data.instituicao || null,
      ano: data.ano || null,
      status: data.status || "Ativo"
    }
  });
  return NextResponse.json(curso, { status: 201 });
}

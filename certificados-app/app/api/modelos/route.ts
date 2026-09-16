import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const modelos = await prisma.modelo.findMany({
    orderBy: { createdAt: "desc" },
    include: { planoFundo: true, cabecalho: true, assinatura: true }
  });
  return NextResponse.json(modelos);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.nome || !data.texto) {
    return NextResponse.json({ error: "Nome e texto são obrigatórios" }, { status: 400 });
  }
  const modelo = await prisma.modelo.create({
    data: {
      nome: data.nome,
      texto: data.texto,
      tamanhoFonte: data.tamanhoFonte ?? 20,
      alinhamento: data.alinhamento ?? "center",
      corTexto: data.corTexto ?? "#1a1a1a",
      nomeX: data.nomeX ?? 50,
      nomeY: data.nomeY ?? 45,
      cabecalhoX: data.cabecalhoX ?? 50,
      cabecalhoY: data.cabecalhoY ?? 12,
      cabecalhoLargura: data.cabecalhoLargura ?? 140,
      assinaturaX: data.assinaturaX ?? 50,
      assinaturaY: data.assinaturaY ?? 80,
      assinaturaLargura: data.assinaturaLargura ?? 160,
      planoFundoId: data.planoFundoId || null,
      cabecalhoId: data.cabecalhoId || null,
      assinaturaId: data.assinaturaId || null
    }
  });
  return NextResponse.json(modelo, { status: 201 });
}

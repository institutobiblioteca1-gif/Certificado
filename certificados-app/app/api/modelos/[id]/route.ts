import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const modelo = await prisma.modelo.findUnique({
    where: { id: params.id },
    include: { planoFundo: true, cabecalho: true, assinatura: true }
  });
  if (!modelo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(modelo);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const modelo = await prisma.modelo.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      texto: data.texto,
      tamanhoFonte: data.tamanhoFonte,
      alinhamento: data.alinhamento,
      corTexto: data.corTexto,
      nomeX: data.nomeX,
      nomeY: data.nomeY,
      cabecalhoX: data.cabecalhoX,
      cabecalhoY: data.cabecalhoY,
      cabecalhoLargura: data.cabecalhoLargura,
      assinaturaX: data.assinaturaX,
      assinaturaY: data.assinaturaY,
      assinaturaLargura: data.assinaturaLargura,
      planoFundoId: data.planoFundoId || null,
      cabecalhoId: data.cabecalhoId || null,
      assinaturaId: data.assinaturaId || null
    }
  });
  return NextResponse.json(modelo);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.modelo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

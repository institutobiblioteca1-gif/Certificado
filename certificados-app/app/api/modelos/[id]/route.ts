import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
  try {
    await prisma.modelo.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        // registro já não existe mais — trata como sucesso, já é o estado desejado
        return NextResponse.json({ ok: true });
      }
      if (err.code === "P2003") {
        // violação de chave estrangeira: existe(m) lote(s)/certificado(s) gerados
        // com este modelo, então o banco recusa a exclusão para não deixar
        // certificados já emitidos "órfãos"
        return NextResponse.json(
          {
            error:
              "Este modelo já foi usado para gerar certificados e não pode ser excluído. " +
              "Para remover, é preciso primeiro excluir os lotes/certificados que usam este modelo."
          },
          { status: 409 }
        );
      }
    }
    console.error("Falha ao excluir modelo:", err);
    return NextResponse.json({ error: "Não foi possível excluir o modelo." }, { status: 500 });
  }
}

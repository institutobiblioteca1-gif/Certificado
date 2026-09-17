import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { gerarCertificadoPDF } from "@/lib/pdf";
import { proximaSequencia } from "@/lib/numero";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search")?.trim();

  const lotes = await prisma.lote.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { turma: { contains: search, mode: "insensitive" } },
              { ano: { contains: search, mode: "insensitive" } },
              { curso: { nome: { contains: search, mode: "insensitive" } } },
              { evento: { nome: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: { curso: true, evento: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(lotes);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const {
    nome, cursoId, eventoId, turma, ano, dataRealizacao, cargaHoraria, local, modeloId, alunos
  } = data;

  if (!nome || !modeloId || !Array.isArray(alunos) || alunos.length === 0) {
    return NextResponse.json({ error: "Dados incompletos para gerar o lote" }, { status: 400 });
  }

  // Guarda o id do lote criado nesta chamada para poder desfazê-lo caso algo
  // falhe no meio da geração (ver o catch mais abaixo).
  let loteId: string | null = null;

  try {
    const modelo = await prisma.modelo.findUnique({
      where: { id: modeloId },
      include: { planoFundo: true, cabecalho: true, assinatura: true }
    });
    if (!modelo) return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });

    const cursoObj = cursoId ? await prisma.curso.findUnique({ where: { id: cursoId } }) : null;
    const eventoObj = eventoId ? await prisma.evento.findUnique({ where: { id: eventoId } }) : null;

    const lote = await prisma.lote.create({
      data: {
        nome, cursoId: cursoId || null, eventoId: eventoId || null,
        turma: turma || null, ano: ano || null, dataRealizacao: dataRealizacao || null,
        cargaHoraria: cargaHoraria || null, local: local || null, modeloId,
        quantidade: alunos.length
      }
    });
    loteId = lote.id;

    const anoParaNumero = ano || new Date().getFullYear().toString();

    // Calcula a sequência inicial UMA vez (a partir do maior número já
    // usado no banco) e depois só incrementa em memória a cada aluno, em vez
    // de recalcular a cada volta do laço — mais rápido e evita a colisão de
    // números descrita em lib/numero.ts.
    let sequencia = await proximaSequencia(anoParaNumero);
    const certificadosGerados = [];

    for (const aluno of alunos as string[]) {
      const numero = `CERT-${anoParaNumero}-${String(sequencia).padStart(6, "0")}`;
      sequencia++;

      const pdfBytes = await gerarCertificadoPDF({
        texto: modelo.texto,
        aluno,
        numero,
        variaveis: {
          CURSO: cursoObj?.nome || "",
          EVENTO: eventoObj?.nome || "",
          CARGA_HORARIA: cargaHoraria || "",
          DATA: dataRealizacao || "",
          LOCAL: local || "",
          ANO: anoParaNumero,
          INSTITUICAO: cursoObj?.instituicao || eventoObj?.instituicao || ""
        },
        tamanhoFonte: modelo.tamanhoFonte,
        corTexto: modelo.corTexto,
        alinhamento: modelo.alinhamento,
        nomeX: modelo.nomeX,
        nomeY: modelo.nomeY,
        planoFundoUrl: modelo.planoFundo?.url,
        cabecalhoUrl: modelo.cabecalho?.url,
        cabecalhoX: modelo.cabecalhoX,
        cabecalhoY: modelo.cabecalhoY,
        cabecalhoLargura: modelo.cabecalhoLargura,
        assinaturaUrl: modelo.assinatura?.url,
        assinaturaX: modelo.assinaturaX,
        assinaturaY: modelo.assinaturaY,
        assinaturaLargura: modelo.assinaturaLargura,
        assinaturaNome: modelo.assinatura?.nome,
        assinaturaCargo: modelo.assinatura?.cargo
      });

      const fileName = `certificados/${lote.id}/${numero}-${aluno.replace(/\s+/g, "-")}.pdf`;
      const blob = await put(fileName, Buffer.from(pdfBytes) as any, {
        access: "public",
        contentType: "application/pdf"
      });

      const cert = await prisma.certificado.create({
        data: { numero, aluno, loteId: lote.id, pdfUrl: blob.url }
      });
      certificadosGerados.push(cert);
    }

    return NextResponse.json({ lote, certificados: certificadosGerados }, { status: 201 });
  } catch (err) {
    // Antes não havia nenhum try/catch aqui: qualquer falha no meio da
    // geração (número de certificado duplicado, imagem que não baixa, Blob
    // fora do ar, etc.) derrubava a rota com um 500 sem corpo, e a tela só
    // mostrava "Erro ao gerar certificados. Verifique os dados informados."
    // sem nenhuma pista do motivo real.

    // Desfaz o lote criado nesta chamada (e os certificados que já tinham
    // sido gravados dele) para não deixar um lote "pela metade" no banco,
    // o que atrapalharia uma nova tentativa.
    if (loteId) {
      try {
        await prisma.certificado.deleteMany({ where: { loteId } });
        await prisma.lote.delete({ where: { id: loteId } });
      } catch (cleanupErr) {
        console.error("Falha ao desfazer lote parcial após erro:", cleanupErr);
      }
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "Não foi possível gerar os certificados: número de certificado duplicado. " +
              "Clique em \"Gerar certificados\" novamente — o próximo número disponível " +
              `será recalculado. (código: ${err.code})`
          },
          { status: 409 }
        );
      }
      console.error("Falha ao gerar lote de certificados:", err.code, err.message);
      return NextResponse.json(
        { error: `Não foi possível gerar os certificados. (código: ${err.code})` },
        { status: 500 }
      );
    }

    console.error("Falha ao gerar lote de certificados (erro não-Prisma):", err);
    return NextResponse.json(
      {
        error:
          `Não foi possível gerar os certificados. (${err instanceof Error ? err.message : "erro desconhecido"})`
      },
      { status: 500 }
    );
  }
}

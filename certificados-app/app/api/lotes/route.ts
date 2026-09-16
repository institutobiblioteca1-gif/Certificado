import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { gerarCertificadoPDF } from "@/lib/pdf";
import { proximoNumero } from "@/lib/numero";

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

  const anoParaNumero = ano || new Date().getFullYear().toString();
  const certificadosGerados = [];

  for (const aluno of alunos as string[]) {
    const numero = await proximoNumero(anoParaNumero);

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
    const blob = await put(fileName, new Blob([pdfBytes], { type: "application/pdf" }), {
      access: "public"
    });

    const cert = await prisma.certificado.create({
      data: { numero, aluno, loteId: lote.id, pdfUrl: blob.url }
    });
    certificadosGerados.push(cert);
  }

  return NextResponse.json({ lote, certificados: certificadosGerados }, { status: 201 });
}

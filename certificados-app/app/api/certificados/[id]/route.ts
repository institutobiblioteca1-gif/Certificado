import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { gerarCertificadoPDF } from "@/lib/pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cert = await prisma.certificado.findUnique({
    where: { id: params.id },
    include: { lote: { include: { modelo: { include: { planoFundo: true, cabecalho: true, assinatura: true } }, curso: true, evento: true } } }
  });
  if (!cert) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(cert);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const cert = await prisma.certificado.findUnique({
    where: { id: params.id },
    include: { lote: { include: { modelo: { include: { planoFundo: true, cabecalho: true, assinatura: true } }, curso: true, evento: true } } }
  });
  if (!cert) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const novoAluno = data.aluno ?? cert.aluno;
  const cargaHoraria = data.cargaHoraria ?? cert.lote.cargaHoraria ?? "";
  const modelo = cert.lote.modelo;

  const pdfBytes = await gerarCertificadoPDF({
    texto: modelo.texto,
    aluno: novoAluno,
    numero: cert.numero,
    variaveis: {
      CURSO: cert.lote.curso?.nome || "",
      EVENTO: cert.lote.evento?.nome || "",
      CARGA_HORARIA: cargaHoraria,
      DATA: cert.lote.dataRealizacao || "",
      LOCAL: cert.lote.local || "",
      ANO: cert.lote.ano || "",
      INSTITUICAO: cert.lote.curso?.instituicao || cert.lote.evento?.instituicao || ""
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

  const fileName = `certificados/${cert.loteId}/${cert.numero}-${novoAluno.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  const blob = await put(fileName, new Blob([pdfBytes], { type: "application/pdf" }), { access: "public" });

  const atualizado = await prisma.certificado.update({
    where: { id: params.id },
    data: { aluno: novoAluno, pdfUrl: blob.url, status: "Atualizado" }
  });

  if (data.cargaHoraria) {
    await prisma.lote.update({ where: { id: cert.loteId }, data: { cargaHoraria: data.cargaHoraria } });
  }

  return NextResponse.json(atualizado);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.certificado.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

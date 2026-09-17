import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { salvarArquivo } from "@/lib/armazenamento";
import { prisma } from "@/lib/db";
import { gerarCertificadoPDF, baixarImagem } from "@/lib/pdf";
import { proximaSequencia } from "@/lib/numero";

// Baixa uma imagem do modelo (plano de fundo, cabeçalho ou assinatura) UMA
// vez só para o lote inteiro — antes cada aluno baixava a mesma imagem de
// novo pela rede, e uma falha passageira em qualquer uma dessas tentativas
// fazia só AQUELE certificado sair sem a imagem, enquanto os outros do mesmo
// lote saíam normais (o que explicava alguns certificados com plano de
// fundo/assinatura e outros sem, dentro do mesmo lote). Se mesmo com as
// novas tentativas automáticas (lib/pdf.ts) o download continuar falhando,
// segue sem essa imagem para TODOS os certificados do lote — mais fácil de
// perceber e corrigir do que uma falha aleatória em alguns alunos.
async function baixarBytesOuNull(url: string | null | undefined, contexto: string) {
  if (!url) return null;
  try {
    return await baixarImagem(url);
  } catch (err) {
    console.error(`Falha ao baixar ${contexto} para o lote (após tentativas):`, err);
    return null;
  }
}

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

    // Baixa plano de fundo, cabeçalho e assinatura uma única vez, antes do
    // laço, em vez de uma vez por aluno (ver o comentário de
    // baixarBytesOuNull acima).
    const [planoFundoBytes, cabecalhoBytes, assinaturaBytes] = await Promise.all([
      baixarBytesOuNull(modelo.planoFundo?.url, "plano de fundo"),
      baixarBytesOuNull(modelo.cabecalho?.url, "cabeçalho/logo"),
      baixarBytesOuNull(modelo.assinatura?.url, "assinatura")
    ]);

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
        planoFundoBytes,
        cabecalhoBytes,
        cabecalhoX: modelo.cabecalhoX,
        cabecalhoY: modelo.cabecalhoY,
        cabecalhoLargura: modelo.cabecalhoLargura,
        assinaturaBytes,
        assinaturaX: modelo.assinaturaX,
        assinaturaY: modelo.assinaturaY,
        assinaturaLargura: modelo.assinaturaLargura,
        assinaturaNome: modelo.assinatura?.nome,
        assinaturaCargo: modelo.assinatura?.cargo
      });

      const fileName = `certificados/${lote.id}/${numero}-${aluno.replace(/\s+/g, "-")}.pdf`;
      const pdfUrl = await salvarArquivo(fileName, Buffer.from(pdfBytes), "application/pdf");

      const cert = await prisma.certificado.create({
        data: { numero, aluno, loteId: lote.id, pdfUrl }
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

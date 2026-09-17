import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

export type GerarCertificadoParams = {
  texto: string;
  aluno: string;
  numero: string;
  variaveis: Record<string, string>;
  tamanhoFonte: number;
  corTexto: string;
  alinhamento: string;
  nomeX: number;
  nomeY: number;
  planoFundoUrl?: string | null;
  cabecalhoUrl?: string | null;
  cabecalhoX: number;
  cabecalhoY: number;
  cabecalhoLargura: number;
  assinaturaUrl?: string | null;
  assinaturaX: number;
  assinaturaY: number;
  assinaturaLargura: number;
  assinaturaNome?: string | null;
  assinaturaCargo?: string | null;
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
}

async function embedImageFromUrl(pdfDoc: PDFDocument, url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar imagem (${res.status}): ${url}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());

  // Detecta o formato real pelos bytes do arquivo (assinatura/"magic number"),
  // em vez de confiar na extensão presente na URL — mais robusto e evita
  // tentar embutir como JPG algo que não é (ex.: WEBP), que falha silenciosamente.
  const isPng =
    bytes.length > 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;

  if (isPng) return pdfDoc.embedPng(bytes);
  if (isJpg) return pdfDoc.embedJpg(bytes);

  // pdf-lib só sabe embutir PNG e JPG. WEBP (e qualquer outro formato) não é
  // suportado — sem essa checagem explícita, a chamada abaixo lançava um erro
  // genérico do pdf-lib que era engolido pelo try/catch de quem chama esta
  // função, fazendo o plano de fundo/cabeçalho/assinatura sumir do certificado
  // sem nenhum aviso.
  throw new Error(
    `Formato de imagem não suportado para gerar o PDF (esperado PNG ou JPG): ${url}`
  );
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    lines.push(current);
  }
  return lines;
}

export async function gerarCertificadoPDF(params: GerarCertificadoParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 paisagem
  const { width, height } = page.getSize();

  if (params.planoFundoUrl) {
    try {
      const img = await embedImageFromUrl(pdfDoc, params.planoFundoUrl);
      page.drawImage(img, { x: 0, y: 0, width, height });
    } catch (err) {
      // segue sem plano de fundo em caso de falha, mas registra o motivo
      // (antes esse erro era descartado silenciosamente — era o que fazia o
      // plano de fundo "sumir" sem nenhuma pista do porquê)
      console.error("Falha ao embutir plano de fundo no certificado:", err);
    }
  }

  if (params.cabecalhoUrl) {
    try {
      const img = await embedImageFromUrl(pdfDoc, params.cabecalhoUrl);
      const logoWidth = params.cabecalhoLargura;
      const scale = logoWidth / img.width;
      const logoHeight = img.height * scale;
      const x = (params.cabecalhoX / 100) * width - logoWidth / 2;
      const y = height - (params.cabecalhoY / 100) * height - logoHeight / 2;
      page.drawImage(img, { x, y, width: logoWidth, height: logoHeight });
    } catch (err) {
      console.error("Falha ao embutir cabeçalho/logo no certificado:", err);
    }
  }

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let texto = params.texto;
  const allVars: Record<string, string> = {
    NOME_ALUNO: params.aluno,
    NUMERO_CERTIFICADO: params.numero,
    ...params.variaveis
  };
  for (const [k, v] of Object.entries(allVars)) {
    texto = texto.split(`{${k}}`).join(v ?? "");
  }

  const fontSize = params.tamanhoFonte;
  const maxWidth = width * 0.8;
  const lines = wrapText(texto, fontBold, fontSize, maxWidth);
  const lineHeight = fontSize * 1.45;
  const totalHeight = lines.length * lineHeight;
  const centerY = height - (params.nomeY / 100) * height;
  let y = centerY + totalHeight / 2 - lineHeight;

  for (const line of lines) {
    const lineWidth = fontBold.widthOfTextAtSize(line, fontSize);
    let x: number;
    if (params.alinhamento === "left") x = width * 0.1;
    else if (params.alinhamento === "right") x = width * 0.9 - lineWidth;
    else x = width / 2 - lineWidth / 2;
    page.drawText(line, { x, y, size: fontSize, font: fontBold, color: hexToRgb(params.corTexto) });
    y -= lineHeight;
  }

  if (params.assinaturaUrl) {
    try {
      const img = await embedImageFromUrl(pdfDoc, params.assinaturaUrl);
      const sigWidth = params.assinaturaLargura;
      const scale = sigWidth / img.width;
      const sigHeight = img.height * scale;
      const x = (params.assinaturaX / 100) * width - sigWidth / 2;
      const y0 = height - (params.assinaturaY / 100) * height;
      page.drawImage(img, { x, y: y0, width: sigWidth, height: sigHeight });

      if (params.assinaturaNome) {
        const w = fontRegular.widthOfTextAtSize(params.assinaturaNome, 11);
        page.drawText(params.assinaturaNome, {
          x: x + sigWidth / 2 - w / 2,
          y: y0 - 16,
          size: 11,
          font: fontRegular,
          color: rgb(0, 0, 0)
        });
      }
      if (params.assinaturaCargo) {
        const w = fontRegular.widthOfTextAtSize(params.assinaturaCargo, 9);
        page.drawText(params.assinaturaCargo, {
          x: x + sigWidth / 2 - w / 2,
          y: y0 - 29,
          size: 9,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3)
        });
      }
    } catch (err) {
      console.error("Falha ao embutir assinatura no certificado:", err);
    }
  }

  page.drawText(params.numero, {
    x: 20,
    y: 15,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  });

  return pdfDoc.save();
}

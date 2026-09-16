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
  const bytes = await res.arrayBuffer();
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return pdfDoc.embedPng(bytes);
  return pdfDoc.embedJpg(bytes);
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
    } catch {
      // segue sem plano de fundo em caso de falha
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
    } catch {
      // ignora falha de imagem
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
    } catch {
      // ignora falha de imagem
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

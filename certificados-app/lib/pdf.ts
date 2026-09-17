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
  assinaturaNome?:

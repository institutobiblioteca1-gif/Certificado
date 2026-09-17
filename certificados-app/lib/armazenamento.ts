import { put as blobPut, del as blobDel } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

// Este arquivo decide ONDE os arquivos (imagens de modelo e PDFs de
// certificados) são salvos: no Vercel Blob (quando o sistema está rodando
// publicado na Vercel, com a variável BLOB_READ_WRITE_TOKEN configurada) ou
// direto numa pasta dentro do projeto (quando está rodando no computador
// local, sem essa variável). Assim o mesmo código funciona nos dois lugares
// sem precisar de nenhuma alteração manual — e rodar localmente deixa de
// depender do armazenamento da Vercel, útil por exemplo se ele estiver com
// o limite de uso excedido.
const USAR_ARMAZENAMENTO_LOCAL = !process.env.BLOB_READ_WRITE_TOKEN;
const PASTA_ARMAZENAMENTO_LOCAL = path.join(process.cwd(), "public", "arquivos");

export async function salvarArquivo(
  nomeArquivo: string,
  dados: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  if (USAR_ARMAZENAMENTO_LOCAL) {
    const destino = path.join(PASTA_ARMAZENAMENTO_LOCAL, nomeArquivo);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, dados);
    // Tudo que fica dentro de "public/" é servido automaticamente pelo
    // Next.js a partir da raiz do site (ex.: public/arquivos/foo.jpg fica
    // acessível em http://localhost:3000/arquivos/foo.jpg).
    return `/arquivos/${nomeArquivo}`;
  }

  const blob = await blobPut(nomeArquivo, dados as any, {
    access: "public",
    contentType
  });
  return blob.url;
}

export async function apagarArquivo(url: string): Promise<void> {
  // Uma URL "/arquivos/..." só pode ter sido criada pelo armazenamento
  // local (mesmo que o sistema esteja rodando na Vercel no momento), então
  // sempre tenta apagar do jeito certo para cada caso.
  if (url.startsWith("/arquivos/")) {
    const destino = path.join(PASTA_ARMAZENAMENTO_LOCAL, url.replace("/arquivos/", ""));
    try {
      await fs.unlink(destino);
    } catch {
      // segue mesmo se o arquivo já não existir
    }
    return;
  }

  try {
    await blobDel(url);
  } catch {
    // segue mesmo se o blob já não existir (ou se o armazenamento da
    // Vercel estiver bloqueado/indisponível no momento)
  }
}

import { prisma } from "./db";

export async function proximoNumero(ano: string): Promise<string> {
  const prefixo = `CERT-${ano}-`;
  const count = await prisma.certificado.count({
    where: { numero: { startsWith: prefixo } }
  });
  const seq = String(count + 1).padStart(6, "0");
  return `${prefixo}${seq}`;
}

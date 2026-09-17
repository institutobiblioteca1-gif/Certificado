import { prisma } from "./db";

// Calcula a próxima sequência disponível para o ano com base no MAIOR número
// já usado (e não em COUNT() de registros, como era antes). Usar COUNT()
// fazia o número colidir com um certificado já existente sempre que algum
// certificado era apagado no meio do caminho (por exemplo, durante testes):
// a contagem cai, mas os números mais altos continuam ocupados no banco, e o
// próximo "count + 1" calculado podia já pertencer a um certificado
// existente. Na hora de salvar, isso disparava um erro de restrição única
// (P2002) no campo "numero", que a rota de geração de lotes não tratava —
// e é a causa mais provável do "Erro ao gerar certificados. Verifique os
// dados informados." mostrado na tela.
export async function proximaSequencia(ano: string): Promise<number> {
  const prefixo = `CERT-${ano}-`;
  const ultimo = await prisma.certificado.findFirst({
    where: { numero: { startsWith: prefixo } },
    orderBy: { numero: "desc" },
    select: { numero: true }
  });
  if (!ultimo) return 1;
  const seqTexto = ultimo.numero.slice(prefixo.length);
  const seq = parseInt(seqTexto, 10);
  return Number.isFinite(seq) ? seq + 1 : 1;
}

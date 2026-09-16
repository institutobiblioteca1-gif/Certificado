export type ValidacaoLista = {
  alunos: string[];
  duplicados: string[];
  vazias: number;
};

export function validarListaAlunos(textoBruto: string): ValidacaoLista {
  const linhas = textoBruto.split("\n").map(l => l.trim());
  const vazias = linhas.filter(l => l.length === 0).length;
  const nomesValidos = linhas.filter(l => l.length > 0);

  const vistos = new Map<string, number>();
  for (const nome of nomesValidos) {
    const chave = nome.toLowerCase();
    vistos.set(chave, (vistos.get(chave) || 0) + 1);
  }
  const duplicados = [...vistos.entries()].filter(([, c]) => c > 1).map(([nome]) => nome);

  // remove duplicados mantendo a primeira ocorrência
  const jaAdicionados = new Set<string>();
  const alunos: string[] = [];
  for (const nome of nomesValidos) {
    const chave = nome.toLowerCase();
    if (!jaAdicionados.has(chave)) {
      jaAdicionados.add(chave);
      alunos.push(nome);
    }
  }

  return { alunos, duplicados, vazias };
}

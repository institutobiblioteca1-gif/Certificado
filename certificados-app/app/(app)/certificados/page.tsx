"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lote = {
  id: string; nome: string; quantidade: number; ano?: string; turma?: string;
  curso?: { nome: string } | null; evento?: { nome: string } | null;
};
type CertResult = {
  id: string; numero: string; aluno: string;
  lote: { id: string; nome: string; curso?: { nome: string } | null; evento?: { nome: string } | null };
};

export default function CertificadosPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<CertResult[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function carregarLotes() {
    const res = await fetch("/api/lotes");
    setLotes(await res.json());
  }
  useEffect(() => { carregarLotes(); }, []);

  useEffect(() => {
    const termo = q.trim();
    if (!termo) { setResultados(null); return; }
    setBuscando(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setResultados(data.certificados);
      setBuscando(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <div className="page-header">
        <h2>Certificados</h2>
        <Link className="btn" href="/certificados/novo">+ Nova geração</Link>
      </div>

      <div className="search-box">
        <input
          placeholder="Pesquisar certificados, alunos, cursos, pastas..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {resultados ? (
        <div className="card">
          {buscando && <p className="helper-text">Buscando...</p>}
          <table>
            <thead><tr><th>Número</th><th>Aluno</th><th>Curso / Evento</th><th>Pasta</th><th></th></tr></thead>
            <tbody>
              {resultados.map(c => (
                <tr key={c.id}>
                  <td>{c.numero}</td>
                  <td>{c.aluno}</td>
                  <td>{c.lote.curso?.nome || c.lote.evento?.nome || "—"}</td>
                  <td>{c.lote.nome}</td>
                  <td className="actions">
                    <Link className="btn-link" href={`/certificados/${c.lote.id}`}>Abrir pasta</Link>
                  </td>
                </tr>
              ))}
              {resultados.length === 0 && !buscando && <tr><td colSpan={5} className="empty-state">Nenhum resultado encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid-cards">
          {lotes.map(l => (
            <Link key={l.id} href={`/certificados/${l.id}`} className="card folder-card">
              <div className="icon">📁</div>
              <h3>{l.nome}</h3>
              <p>{l.quantidade} certificado{l.quantidade === 1 ? "" : "s"}</p>
            </Link>
          ))}
          {lotes.length === 0 && (
            <p className="empty-state">Nenhuma pasta gerada ainda. Clique em "Nova geração" para começar.</p>
          )}
        </div>
      )}
    </div>
  );
}

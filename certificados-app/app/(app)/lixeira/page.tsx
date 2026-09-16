"use client";

import { useEffect, useState } from "react";

type LoteLixo = { id: string; nome: string; deletedAt: string; curso?: { nome: string } | null; evento?: { nome: string } | null };
type CertLixo = { id: string; numero: string; aluno: string; deletedAt: string; lote: { nome: string } };

export default function LixeiraPage() {
  const [lotes, setLotes] = useState<LoteLixo[]>([]);
  const [certificados, setCertificados] = useState<CertLixo[]>([]);

  async function carregar() {
    const res = await fetch("/api/lixeira");
    const data = await res.json();
    setLotes(data.lotes);
    setCertificados(data.certificados);
  }
  useEffect(() => { carregar(); }, []);

  async function restaurarLote(id: string) {
    await fetch(`/api/lixeira/lote/${id}/restore`, { method: "POST" });
    carregar();
  }
  async function excluirLote(id: string) {
    if (!confirm("Excluir definitivamente esta pasta e todos os seus certificados? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/lixeira/lote/${id}/excluir`, { method: "POST" });
    carregar();
  }
  async function restaurarCert(id: string) {
    await fetch(`/api/lixeira/certificado/${id}/restore`, { method: "POST" });
    carregar();
  }
  async function excluirCert(id: string) {
    if (!confirm("Excluir definitivamente este certificado? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/lixeira/certificado/${id}/excluir`, { method: "POST" });
    carregar();
  }

  return (
    <div>
      <div className="page-header"><h2>Lixeira</h2></div>

      <h3 style={{ fontSize: 15 }}>Pastas excluídas</h3>
      <div className="card" style={{ marginBottom: 24 }}>
        <table>
          <thead><tr><th>Pasta</th><th>Curso/Evento</th><th>Excluído em</th><th></th></tr></thead>
          <tbody>
            {lotes.map(l => (
              <tr key={l.id}>
                <td>{l.nome}</td><td>{l.curso?.nome || l.evento?.nome || "—"}</td>
                <td>{new Date(l.deletedAt).toLocaleDateString("pt-BR")}</td>
                <td className="actions">
                  <button onClick={() => restaurarLote(l.id)}>Restaurar</button>
                  <button className="danger" onClick={() => excluirLote(l.id)}>Excluir definitivamente</button>
                </td>
              </tr>
            ))}
            {lotes.length === 0 && <tr><td colSpan={4} className="empty-state">Nenhuma pasta na lixeira</td></tr>}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 15 }}>Certificados excluídos</h3>
      <div className="card">
        <table>
          <thead><tr><th>Número</th><th>Aluno</th><th>Pasta</th><th>Excluído em</th><th></th></tr></thead>
          <tbody>
            {certificados.map(c => (
              <tr key={c.id}>
                <td>{c.numero}</td><td>{c.aluno}</td><td>{c.lote.nome}</td>
                <td>{new Date(c.deletedAt).toLocaleDateString("pt-BR")}</td>
                <td className="actions">
                  <button onClick={() => restaurarCert(c.id)}>Restaurar</button>
                  <button className="danger" onClick={() => excluirCert(c.id)}>Excluir definitivamente</button>
                </td>
              </tr>
            ))}
            {certificados.length === 0 && <tr><td colSpan={5} className="empty-state">Nenhum certificado na lixeira</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

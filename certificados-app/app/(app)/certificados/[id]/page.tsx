"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Certificado = { id: string; numero: string; aluno: string; pdfUrl: string; status: string };
type Lote = {
  id: string; nome: string; ano?: string; turma?: string; cargaHoraria?: string; local?: string;
  dataRealizacao?: string; curso?: { nome: string } | null; evento?: { nome: string } | null;
  certificados: Certificado[];
};

export default function LoteDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lote, setLote] = useState<Lote | null>(null);
  const [editandoCert, setEditandoCert] = useState<Certificado | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [baixandoZip, setBaixandoZip] = useState(false);

  async function carregar() {
    const res = await fetch(`/api/lotes/${id}`);
    if (res.ok) setLote(await res.json());
  }
  useEffect(() => { carregar(); }, [id]);

  async function excluirCertificado(certId: string) {
    if (!confirm("Excluir este certificado? Ele irá para a lixeira.")) return;
    await fetch(`/api/certificados/${certId}`, { method: "DELETE" });
    carregar();
  }

  async function excluirPasta() {
    if (!confirm("Excluir esta pasta inteira? Os certificados irão para a lixeira.")) return;
    await fetch(`/api/lotes/${id}`, { method: "DELETE" });
    router.push("/certificados");
  }

  async function baixarTodos() {
    setBaixandoZip(true);
    const res = await fetch(`/api/lotes/${id}/zip`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lote?.nome || "certificados"}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setBaixandoZip(false);
  }

  function abrirEdicao(c: Certificado) {
    setEditandoCert(c);
    setNovoNome(c.aluno);
  }

  async function salvarEdicao() {
    if (!editandoCert) return;
    await fetch(`/api/certificados/${editandoCert.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aluno: novoNome })
    });
    setEditandoCert(null);
    carregar();
  }

  if (!lote) return <p className="empty-state">Carregando...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{lote.nome}</h2>
          <p className="helper-text">
            {lote.curso?.nome || lote.evento?.nome || "—"} · {lote.certificados.length} certificado{lote.certificados.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={baixarTodos} disabled={baixandoZip}>
            {baixandoZip ? "Preparando ZIP..." : "Baixar todos (ZIP)"}
          </button>
          <button className="btn danger" onClick={excluirPasta}>Excluir pasta</button>
        </div>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Número</th><th>Aluno</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lote.certificados.map(c => (
              <tr key={c.id}>
                <td>{c.numero}</td>
                <td>{editandoCert?.id === c.id ? (
                  <input value={novoNome} onChange={e => setNovoNome(e.target.value)} />
                ) : c.aluno}</td>
                <td><span className="badge ativo">{c.status}</span></td>
                <td className="actions">
                  {editandoCert?.id === c.id ? (
                    <>
                      <button onClick={salvarEdicao}>Salvar</button>
                      <button onClick={() => setEditandoCert(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <a className="btn-link" href={c.pdfUrl} target="_blank" rel="noreferrer">Visualizar</a>
                      <a className="btn-link" href={c.pdfUrl} download>Baixar</a>
                      <button onClick={() => abrirEdicao(c)}>Editar</button>
                      <button className="danger" onClick={() => excluirCertificado(c.id)}>Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {lote.certificados.length === 0 && <tr><td colSpan={4} className="empty-state">Nenhum certificado nesta pasta</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Curso = {
  id: string; nome: string; descricao?: string; cargaHoraria?: string;
  instituicao?: string; ano?: string; status: string;
};

const VAZIO = { nome: "", descricao: "", cargaHoraria: "", instituicao: "", ano: "", status: "Ativo" };

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [form, setForm] = useState<any>(VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function carregar() {
    const res = await fetch("/api/cursos");
    setCursos(await res.json());
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (editandoId) {
      await fetch(`/api/cursos/${editandoId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
      });
    } else {
      await fetch("/api/cursos", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
      });
    }
    setForm(VAZIO);
    setEditandoId(null);
    setMostrarForm(false);
    carregar();
  }

  function editar(c: Curso) {
    setForm({ nome: c.nome, descricao: c.descricao || "", cargaHoraria: c.cargaHoraria || "", instituicao: c.instituicao || "", ano: c.ano || "", status: c.status });
    setEditandoId(c.id);
    setMostrarForm(true);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este curso?")) return;
    await fetch(`/api/cursos/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Cursos</h2>
        <button className="btn" onClick={() => { setForm(VAZIO); setEditandoId(null); setMostrarForm(!mostrarForm); }}>
          + Novo curso
        </button>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={salvar} style={{ marginBottom: 20 }}>
          <div className="field-row">
            <div className="field"><label>Nome</label><input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="field"><label>Instituição</label><input value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} /></div>
          </div>
          <div className="field-row-3">
            <div className="field"><label>Carga horária</label><input value={form.cargaHoraria} onChange={e => setForm({ ...form, cargaHoraria: e.target.value })} /></div>
            <div className="field"><label>Ano</label><input value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} /></div>
            <div className="field"><label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>Ativo</option><option>Inativo</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Descrição</label><textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
          <button className="btn" type="submit">Salvar</button>
        </form>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Nome</th><th>Instituição</th><th>Carga horária</th><th>Ano</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {cursos.map(c => (
              <tr key={c.id}>
                <td>{c.nome}</td><td>{c.instituicao}</td><td>{c.cargaHoraria}</td><td>{c.ano}</td>
                <td><span className={`badge ${c.status === "Ativo" ? "ativo" : ""}`}>{c.status}</span></td>
                <td className="actions">
                  <button onClick={() => editar(c)}>Editar</button>
                  <button className="danger" onClick={() => excluir(c.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {cursos.length === 0 && <tr><td colSpan={6} className="empty-state">Nenhum curso cadastrado</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

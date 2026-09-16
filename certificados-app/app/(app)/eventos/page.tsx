"use client";

import { useEffect, useState } from "react";

type Evento = {
  id: string; nome: string; descricao?: string; data?: string; local?: string;
  cargaHoraria?: string; instituicao?: string; ano?: string;
};

const VAZIO = { nome: "", descricao: "", data: "", local: "", cargaHoraria: "", instituicao: "", ano: "" };

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [form, setForm] = useState<any>(VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function carregar() {
    const res = await fetch("/api/eventos");
    setEventos(await res.json());
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (editandoId) {
      await fetch(`/api/eventos/${editandoId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setForm(VAZIO); setEditandoId(null); setMostrarForm(false); carregar();
  }

  function editar(ev: Evento) {
    setForm({ nome: ev.nome, descricao: ev.descricao || "", data: ev.data || "", local: ev.local || "", cargaHoraria: ev.cargaHoraria || "", instituicao: ev.instituicao || "", ano: ev.ano || "" });
    setEditandoId(ev.id); setMostrarForm(true);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este evento?")) return;
    await fetch(`/api/eventos/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Eventos</h2>
        <button className="btn" onClick={() => { setForm(VAZIO); setEditandoId(null); setMostrarForm(!mostrarForm); }}>+ Novo evento</button>
      </div>

      {mostrarForm && (
        <form className="card" onSubmit={salvar} style={{ marginBottom: 20 }}>
          <div className="field-row">
            <div className="field"><label>Nome</label><input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="field"><label>Instituição</label><input value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} /></div>
          </div>
          <div className="field-row-3">
            <div className="field"><label>Data</label><input value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} placeholder="dd/mm/aaaa" /></div>
            <div className="field"><label>Local</label><input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} /></div>
            <div className="field"><label>Carga horária</label><input value={form.cargaHoraria} onChange={e => setForm({ ...form, cargaHoraria: e.target.value })} /></div>
          </div>
          <div className="field"><label>Ano</label><input value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} /></div>
          <div className="field"><label>Descrição</label><textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
          <button className="btn" type="submit">Salvar</button>
        </form>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Nome</th><th>Data</th><th>Local</th><th>Ano</th><th></th></tr></thead>
          <tbody>
            {eventos.map(ev => (
              <tr key={ev.id}>
                <td>{ev.nome}</td><td>{ev.data}</td><td>{ev.local}</td><td>{ev.ano}</td>
                <td className="actions">
                  <button onClick={() => editar(ev)}>Editar</button>
                  <button className="danger" onClick={() => excluir(ev.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {eventos.length === 0 && <tr><td colSpan={5} className="empty-state">Nenhum evento cadastrado</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

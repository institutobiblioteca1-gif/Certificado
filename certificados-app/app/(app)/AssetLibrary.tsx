"use client";

import { useEffect, useState } from "react";

type Asset = { id: string; nome: string; cargo?: string; url: string; type: string };

export default function AssetLibrary({
  type, titulo, comCargo, dica
}: { type: "PLANO_FUNDO" | "CABECALHO" | "ASSINATURA"; titulo: string; comCargo?: boolean; dica?: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function carregar() {
    const res = await fetch(`/api/assets?type=${type}`);
    setAssets(await res.json());
  }
  useEffect(() => { carregar(); }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !nome) return;
    setEnviando(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("nome", nome);
    if (comCargo) fd.append("cargo", cargo);
    await fetch("/api/assets", { method: "POST", body: fd });
    setEnviando(false);
    setNome(""); setCargo(""); setFile(null); setMostrarForm(false);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div>
      <div className="page-header">
        <h2>{titulo}</h2>
        <button className="btn" onClick={() => setMostrarForm(!mostrarForm)}>+ Cadastrar novo</button>
      </div>
      {dica && <p className="helper-text" style={{ marginBottom: 16 }}>{dica}</p>}

      {mostrarForm && (
        <form className="card" onSubmit={enviar} style={{ marginBottom: 20 }}>
          <div className="field-row">
            <div className="field"><label>Nome</label><input required value={nome} onChange={e => setNome(e.target.value)} /></div>
            {comCargo && (
              <div className="field"><label>Cargo</label><input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex.: Diretor" /></div>
            )}
          </div>
          <div className="field">
            <label>Imagem (PNG ou JPG)</label>
            <input type="file" accept="image/png,image/jpeg" required onChange={e => setFile(e.target.files?.[0] || null)} />
            <p className="helper-text" style={{ marginTop: 4 }}>
              WEBP não é aceito: o gerador de PDF não consegue embutir esse formato, e o
              plano de fundo/cabeçalho/assinatura ficaria faltando no certificado gerado.
            </p>
          </div>
          <button className="btn" type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Salvar"}</button>
        </form>
      )}

      <div className="grid-cards">
        {assets.map(a => (
          <div key={a.id} className="card">
            <img src={a.url} alt={a.nome} style={{ width: "100%", height: 120, objectFit: "contain", background: "#f4f5f7", borderRadius: 6 }} />
            <h3 style={{ fontSize: 14, marginTop: 8 }}>{a.nome}</h3>
            {a.cargo && <p style={{ color: "#6b7280", fontSize: 12, margin: "2px 0" }}>{a.cargo}</p>}
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="danger" onClick={() => excluir(a.id)}>Excluir</button>
            </div>
          </div>
        ))}
        {assets.length === 0 && <p className="empty-state">Nada cadastrado ainda</p>}
      </div>
    </div>
  );
}

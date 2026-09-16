"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Asset = { id: string; nome: string; cargo?: string; url: string };

const VARS = ["NOME_ALUNO", "CURSO", "EVENTO", "CARGA_HORARIA", "DATA", "LOCAL", "ANO", "INSTITUICAO", "NUMERO_CERTIFICADO"];

export default function ModeloEditor({ modeloExistente }: { modeloExistente?: any }) {
  const router = useRouter();
  const [planosFundo, setPlanosFundo] = useState<Asset[]>([]);
  const [cabecalhos, setCabecalhos] = useState<Asset[]>([]);
  const [assinaturas, setAssinaturas] = useState<Asset[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState<any>(
    modeloExistente || {
      nome: "",
      texto: "Certificamos que {NOME_ALUNO} participou do {EVENTO}, promovido pelo {INSTITUICAO}, realizado em {LOCAL}, com carga horária de {CARGA_HORARIA}.",
      tamanhoFonte: 20,
      alinhamento: "center",
      corTexto: "#1a1a1a",
      nomeX: 50, nomeY: 45,
      cabecalhoX: 50, cabecalhoY: 12, cabecalhoLargura: 140,
      assinaturaX: 50, assinaturaY: 80, assinaturaLargura: 160,
      planoFundoId: "", cabecalhoId: "", assinaturaId: ""
    }
  );

  useEffect(() => {
    fetch("/api/assets?type=PLANO_FUNDO").then(r => r.json()).then(setPlanosFundo);
    fetch("/api/assets?type=CABECALHO").then(r => r.json()).then(setCabecalhos);
    fetch("/api/assets?type=ASSINATURA").then(r => r.json()).then(setAssinaturas);
  }, []);

  function inserirVariavel(v: string) {
    setForm({ ...form, texto: form.texto + `{${v}}` });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const url = modeloExistente ? `/api/modelos/${modeloExistente.id}` : "/api/modelos";
    const method = modeloExistente ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSalvando(false);
    if (res.ok) router.push("/modelos");
  }

  async function excluir() {
    if (!modeloExistente || !confirm("Excluir este modelo?")) return;
    await fetch(`/api/modelos/${modeloExistente.id}`, { method: "DELETE" });
    router.push("/modelos");
  }

  const planoFundo = planosFundo.find(p => p.id === form.planoFundoId);
  const cabecalho = cabecalhos.find(p => p.id === form.cabecalhoId);
  const assinatura = assinaturas.find(p => p.id === form.assinaturaId);
  const textoPreview = form.texto.replace(/\{[A-Z_]+\}/g, (m: string) => (m === "{NOME_ALUNO}" ? "João da Silva" : m.replace(/[{}]/g, "").replace(/_/g, " ")));

  return (
    <div>
      <div className="page-header">
        <h2>{modeloExistente ? "Editar modelo" : "Novo modelo"}</h2>
        {modeloExistente && <button className="btn danger" onClick={excluir}>Excluir modelo</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <form className="card" onSubmit={salvar}>
          <div className="field">
            <label>Nome do modelo</label>
            <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div className="field">
            <label>Texto do certificado</label>
            <textarea rows={5} value={form.texto} onChange={e => setForm({ ...form, texto: e.target.value })} />
            <div style={{ marginTop: 6 }}>
              {VARS.map(v => (
                <button type="button" key={v} className="var-chip" onClick={() => inserirVariavel(v)}>{`{${v}}`}</button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Plano de fundo</label>
              <select value={form.planoFundoId} onChange={e => setForm({ ...form, planoFundoId: e.target.value })}>
                <option value="">Nenhum</option>
                {planosFundo.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Cabeçalho / logo</label>
              <select value={form.cabecalhoId} onChange={e => setForm({ ...form, cabecalhoId: e.target.value })}>
                <option value="">Nenhum</option>
                {cabecalhos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Assinatura</label>
            <select value={form.assinaturaId} onChange={e => setForm({ ...form, assinaturaId: e.target.value })}>
              <option value="">Nenhuma</option>
              {assinaturas.map(p => <option key={p.id} value={p.id}>{p.nome}{p.cargo ? ` — ${p.cargo}` : ""}</option>)}
            </select>
          </div>

          <div className="field-row-3">
            <div className="field"><label>Tamanho da fonte</label><input type="number" value={form.tamanhoFonte} onChange={e => setForm({ ...form, tamanhoFonte: Number(e.target.value) })} /></div>
            <div className="field">
              <label>Alinhamento</label>
              <select value={form.alinhamento} onChange={e => setForm({ ...form, alinhamento: e.target.value })}>
                <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
              </select>
            </div>
            <div className="field"><label>Cor do texto</label><input type="color" value={form.corTexto} onChange={e => setForm({ ...form, corTexto: e.target.value })} /></div>
          </div>

          <p className="helper-text" style={{ margin: "12px 0 6px" }}>Posição do nome do aluno (% da página)</p>
          <div className="field-row">
            <div className="field"><label>Horizontal (X)</label><input type="number" value={form.nomeX} onChange={e => setForm({ ...form, nomeX: Number(e.target.value) })} /></div>
            <div className="field"><label>Vertical (Y)</label><input type="number" value={form.nomeY} onChange={e => setForm({ ...form, nomeY: Number(e.target.value) })} /></div>
          </div>

          <p className="helper-text" style={{ margin: "12px 0 6px" }}>Posição do cabeçalho/logo</p>
          <div className="field-row-3">
            <div className="field"><label>X</label><input type="number" value={form.cabecalhoX} onChange={e => setForm({ ...form, cabecalhoX: Number(e.target.value) })} /></div>
            <div className="field"><label>Y</label><input type="number" value={form.cabecalhoY} onChange={e => setForm({ ...form, cabecalhoY: Number(e.target.value) })} /></div>
            <div className="field"><label>Largura (pt)</label><input type="number" value={form.cabecalhoLargura} onChange={e => setForm({ ...form, cabecalhoLargura: Number(e.target.value) })} /></div>
          </div>

          <p className="helper-text" style={{ margin: "12px 0 6px" }}>Posição da assinatura</p>
          <div className="field-row-3">
            <div className="field"><label>X</label><input type="number" value={form.assinaturaX} onChange={e => setForm({ ...form, assinaturaX: Number(e.target.value) })} /></div>
            <div className="field"><label>Y</label><input type="number" value={form.assinaturaY} onChange={e => setForm({ ...form, assinaturaY: Number(e.target.value) })} /></div>
            <div className="field"><label>Largura (pt)</label><input type="number" value={form.assinaturaLargura} onChange={e => setForm({ ...form, assinaturaLargura: Number(e.target.value) })} /></div>
          </div>

          <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar modelo"}</button>
        </form>

        <div>
          <p className="helper-text" style={{ marginBottom: 8 }}>Pré-visualização aproximada</p>
          <div className="preview-canvas" style={{ backgroundImage: planoFundo ? `url(${planoFundo.url})` : undefined, background: planoFundo ? undefined : "#fff" }}>
            {cabecalho && (
              <img src={cabecalho.url} alt="" className="layer" style={{ left: `${form.cabecalhoX}%`, top: `${form.cabecalhoY}%`, width: form.cabecalhoLargura * 0.55 }} />
            )}
            <div className="layer" style={{ left: `${form.nomeX}%`, top: `${form.nomeY}%`, width: "80%", fontSize: form.tamanhoFonte * 0.55, color: form.corTexto, fontWeight: 700, textAlign: form.alinhamento }}>
              {textoPreview}
            </div>
            {assinatura && (
              <img src={assinatura.url} alt="" className="layer" style={{ left: `${form.assinaturaX}%`, top: `${form.assinaturaY}%`, width: form.assinaturaLargura * 0.55 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

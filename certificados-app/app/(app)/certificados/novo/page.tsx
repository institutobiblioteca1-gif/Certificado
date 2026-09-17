"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Opcao = { id: string; nome: string };
type Modelo = { id: string; nome: string; texto: string };

const PASSOS = ["Identificação", "Modelo", "Lista de alunos", "Prévia", "Gerar"];

export default function NovaGeracaoPage() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);

  const [cursos, setCursos] = useState<Opcao[]>([]);
  const [eventos, setEventos] = useState<Opcao[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);

  const [dados, setDados] = useState({
    nome: "", cursoId: "", eventoId: "", turma: "", ano: new Date().getFullYear().toString(),
    dataRealizacao: "", cargaHoraria: "", local: "", modeloId: ""
  });

  const [listaTexto, setListaTexto] = useState("");
  const [validacao, setValidacao] = useState<{ alunos: string[]; duplicados: string[]; vazias: number } | null>(null);
  const [confirmarDuplicados, setConfirmarDuplicados] = useState(false);

  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<{ quantidade: number; loteId: string } | null>(null);

  useEffect(() => {
    fetch("/api/cursos").then(r => r.json()).then(setCursos);
    fetch("/api/eventos").then(r => r.json()).then(setEventos);
    fetch("/api/modelos").then(r => r.json()).then(setModelos);
  }, []);

  function validarLista() {
    const linhas = listaTexto.split("\n").map(l => l.trim());
    const vazias = linhas.filter(l => l.length === 0).length;
    const validos = linhas.filter(l => l.length > 0);
    const vistos = new Map<string, number>();
    for (const n of validos) vistos.set(n.toLowerCase(), (vistos.get(n.toLowerCase()) || 0) + 1);
    const duplicados = [...vistos.entries()].filter(([, c]) => c > 1).map(([n]) => n);
    const jaAdd = new Set<string>();
    const alunos: string[] = [];
    for (const n of validos) {
      if (!jaAdd.has(n.toLowerCase())) { jaAdd.add(n.toLowerCase()); alunos.push(n); }
    }
    setValidacao({ alunos, duplicados, vazias });
    setConfirmarDuplicados(false);
  }

  async function gerar() {
    if (!validacao) return;
    setGerando(true);
    const res = await fetch("/api/lotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dados, alunos: validacao.alunos })
    });
    setGerando(false);
    if (res.ok) {
      const data = await res.json();
      setResultado({ quantidade: data.certificados.length, loteId: data.lote.id });
      setPasso(4);
    } else {
      // Antes a mensagem do servidor era descartada e sempre aparecia esse
      // texto genérico, mesmo quando a causa real era outra (ex.: número de
      // certificado duplicado) — por isso não dava pra saber o que corrigir.
      const data = await res.json().catch(() => null);
      alert(data?.error || "Erro ao gerar certificados. Verifique os dados informados.");
    }
  }

  const modeloSelecionado = modelos.find(m => m.id === dados.modeloId);

  return (
    <div>
      <div className="page-header"><h2>Nova geração de certificados</h2></div>

      <div className="wizard-steps">
        {PASSOS.map((p, i) => (
          <span key={p} className={i === passo ? "active" : i < passo ? "done" : ""}>{i + 1}. {p}</span>
        ))}
      </div>

      {passo === 0 && (
        <div className="card">
          <div className="field"><label>Nome da pasta/lote</label>
            <input value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} placeholder="Ex.: Curso Livre de Teologia – Turma 01 – 2026" />
          </div>
          <div className="field-row">
            <div className="field"><label>Curso (opcional)</label>
              <select value={dados.cursoId} onChange={e => setDados({ ...dados, cursoId: e.target.value })}>
                <option value="">Nenhum</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="field"><label>Evento (opcional)</label>
              <select value={dados.eventoId} onChange={e => setDados({ ...dados, eventoId: e.target.value })}>
                <option value="">Nenhum</option>
                {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row-3">
            <div className="field"><label>Turma</label><input value={dados.turma} onChange={e => setDados({ ...dados, turma: e.target.value })} /></div>
            <div className="field"><label>Ano</label><input value={dados.ano} onChange={e => setDados({ ...dados, ano: e.target.value })} /></div>
            <div className="field"><label>Data de realização</label><input value={dados.dataRealizacao} onChange={e => setDados({ ...dados, dataRealizacao: e.target.value })} placeholder="dd/mm/aaaa" /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Carga horária</label><input value={dados.cargaHoraria} onChange={e => setDados({ ...dados, cargaHoraria: e.target.value })} placeholder="Ex.: 40 horas" /></div>
            <div className="field"><label>Local</label><input value={dados.local} onChange={e => setDados({ ...dados, local: e.target.value })} /></div>
          </div>
          <button className="btn" disabled={!dados.nome} onClick={() => setPasso(1)}>Continuar</button>
        </div>
      )}

      {passo === 1 && (
        <div className="card">
          <div className="field">
            <label>Selecione um modelo</label>
            <select value={dados.modeloId} onChange={e => setDados({ ...dados, modeloId: e.target.value })}>
              <option value="">Selecione...</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          {modelos.length === 0 && <p className="helper-text">Nenhum modelo cadastrado. Crie um em "Modelos" antes de continuar.</p>}
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn secondary" onClick={() => setPasso(0)}>Voltar</button>
            <button className="btn" disabled={!dados.modeloId} onClick={() => setPasso(2)}>Continuar</button>
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="card">
          <div className="field">
            <label>Cole a lista de alunos (um nome por linha)</label>
            <textarea rows={10} value={listaTexto} onChange={e => setListaTexto(e.target.value)} placeholder={"João da Silva\nMaria de Souza\nPedro Oliveira"} />
          </div>
          <button type="button" className="btn secondary" onClick={validarLista}>Validar lista</button>

          {validacao && (
            <div style={{ marginTop: 14 }}>
              <p><strong>{validacao.alunos.length}</strong> aluno{validacao.alunos.length === 1 ? "" : "s"} encontrado{validacao.alunos.length === 1 ? "" : "s"}</p>
              {validacao.vazias > 0 && <p className="helper-text">{validacao.vazias} linha(s) vazia(s) ignorada(s).</p>}
              {validacao.duplicados.length > 0 && (
                <div className="card" style={{ background: "#fff8e6", borderColor: "#f0d18a" }}>
                  <p>Foram encontrados {validacao.duplicados.length} nome(s) duplicado(s): {validacao.duplicados.join(", ")}. Apenas uma ocorrência de cada será usada.</p>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
                    <input type="checkbox" style={{ width: "auto" }} checked={confirmarDuplicados} onChange={e => setConfirmarDuplicados(e.target.checked)} />
                    Estou ciente e desejo continuar
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn secondary" onClick={() => setPasso(1)}>Voltar</button>
            <button
              className="btn"
              disabled={!validacao || validacao.alunos.length === 0 || (validacao.duplicados.length > 0 && !confirmarDuplicados)}
              onClick={() => setPasso(3)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {passo === 3 && validacao && (
        <div className="card">
          <p className="helper-text">Pré-visualização (exemplo com o primeiro aluno da lista)</p>
          <div className="card" style={{ background: "#f9fafb" }}>
            <p><strong>Aluno:</strong> {validacao.alunos[0]}</p>
            <p><strong>Modelo:</strong> {modeloSelecionado?.nome}</p>
            <p style={{ whiteSpace: "pre-line" }}>
              {modeloSelecionado?.texto
                .split("{NOME_ALUNO}").join(validacao.alunos[0])
                .split("{CARGA_HORARIA}").join(dados.cargaHoraria)
                .split("{LOCAL}").join(dados.local)
                .split("{DATA}").join(dados.dataRealizacao)
                .split("{ANO}").join(dados.ano)}
            </p>
          </div>
          <p className="helper-text" style={{ marginTop: 10 }}>
            Serão gerados {validacao.alunos.length} certificados em PDF na pasta "{dados.nome}".
          </p>
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn secondary" onClick={() => setPasso(2)} disabled={gerando}>Voltar</button>
            <button className="btn" onClick={gerar} disabled={gerando}>
              {gerando ? "Gerando certificados..." : "Gerar certificados"}
            </button>
          </div>
        </div>
      )}

      {passo === 4 && resultado && (
        <div className="card">
          <h3>✅ {resultado.quantidade} certificados gerados com sucesso!</h3>
          <p className="helper-text">Eles já estão salvos na pasta "{dados.nome}".</p>
          <button className="btn" onClick={() => router.push(`/certificados/${resultado.loteId}`)}>Abrir pasta</button>
        </div>
      )}
    </div>
  );
}

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
        <button className="btn" onClick={() =>

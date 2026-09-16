"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });
    setCarregando(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErro(data.error || "Falha no login");
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Sistema de Certificados</h1>
        <div className="field">
          <label>Usuário</label>
          <input value={usuario} onChange={e => setUsuario(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
        </div>
        {erro && <p className="error-msg">{erro}</p>}
        <button className="btn" type="submit" disabled={carregando} style={{ width: "100%" }}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

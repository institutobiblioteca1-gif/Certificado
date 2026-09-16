import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function ModelosPage() {
  const modelos = await prisma.modelo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="page-header">
        <h2>Modelos</h2>
        <Link className="btn" href="/modelos/novo">+ Novo modelo</Link>
      </div>

      <div className="grid-cards">
        {modelos.map(m => (
          <Link key={m.id} href={`/modelos/${m.id}`} className="card folder-card">
            <div className="icon">🎨</div>
            <h3>{m.nome}</h3>
            <p>Criado em {new Date(m.createdAt).toLocaleDateString("pt-BR")}</p>
          </Link>
        ))}
        {modelos.length === 0 && <p className="empty-state">Nenhum modelo cadastrado ainda. Crie o primeiro para poder gerar certificados.</p>}
      </div>
    </div>
  );
}

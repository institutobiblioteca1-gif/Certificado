import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function InicioPage() {
  const [totalLotes, totalCertificados, totalModelos] = await Promise.all([
    prisma.lote.count({ where: { deletedAt: null } }),
    prisma.certificado.count({ where: { deletedAt: null } }),
    prisma.modelo.count()
  ]);

  return (
    <div>
      <div className="page-header">
        <h2>Início</h2>
      </div>

      <div className="grid-cards" style={{ marginBottom: 28 }}>
        <div className="card">
          <p className="helper-text">Certificados emitidos</p>
          <h3 style={{ fontSize: 28, margin: "4px 0" }}>{totalCertificados}</h3>
        </div>
        <div className="card">
          <p className="helper-text">Lotes / pastas</p>
          <h3 style={{ fontSize: 28, margin: "4px 0" }}>{totalLotes}</h3>
        </div>
        <div className="card">
          <p className="helper-text">Modelos cadastrados</p>
          <h3 style={{ fontSize: 28, margin: "4px 0" }}>{totalModelos}</h3>
        </div>
      </div>

      <div className="grid-cards">
        <Link href="/certificados/novo" className="card folder-card">
          <div className="icon">📄</div>
          <h3>Gerar certificados</h3>
          <p>Iniciar uma nova geração em lote</p>
        </Link>
        <Link href="/certificados" className="card folder-card">
          <div className="icon">📁</div>
          <h3>Certificados</h3>
          <p>Abrir pastas e pesquisar certificados</p>
        </Link>
        <Link href="/modelos" className="card folder-card">
          <div className="icon">🎨</div>
          <h3>Modelos</h3>
          <p>Gerenciar modelos de certificado</p>
        </Link>
        <Link href="/cursos" className="card folder-card">
          <div className="icon">🎓</div>
          <h3>Cursos</h3>
          <p>Gerenciar cursos cadastrados</p>
        </Link>
      </div>
    </div>
  );
}

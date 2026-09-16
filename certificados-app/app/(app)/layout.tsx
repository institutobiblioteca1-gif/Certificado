import type { ReactNode } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

const MENU = [
  { href: "/", label: "🏠 Início" },
  { href: "/certificados/novo", label: "📄 Gerar certificados" },
  { href: "/certificados", label: "📁 Certificados" },
  { href: "/modelos", label: "🎨 Modelos" },
  { href: "/planos-de-fundo", label: "🖼️ Planos de fundo" },
  { href: "/cabecalhos", label: "🏛️ Cabeçalhos e logos" },
  { href: "/assinaturas", label: "✍️ Assinaturas" },
  { href: "/cursos", label: "🎓 Cursos" },
  { href: "/eventos", label: "📅 Eventos" },
  { href: "/lixeira", label: "🗑️ Lixeira" }
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Certificados</h1>
        <nav>
          {MENU.map(item => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="logout-form">
          <LogoutButton />
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

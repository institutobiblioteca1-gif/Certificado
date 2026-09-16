import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Sistema de Certificados",
  description: "Geração, armazenamento e gerenciamento de certificados"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

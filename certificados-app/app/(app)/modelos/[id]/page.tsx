import { prisma } from "@/lib/db";
import ModeloEditor from "../ModeloEditor";

export const dynamic = "force-dynamic";

export default async function EditarModeloPage({ params }: { params: { id: string } }) {
  const modelo = await prisma.modelo.findUnique({ where: { id: params.id } });
  if (!modelo) return <p>Modelo não encontrado.</p>;
  return <ModeloEditor modeloExistente={modelo} />;
}

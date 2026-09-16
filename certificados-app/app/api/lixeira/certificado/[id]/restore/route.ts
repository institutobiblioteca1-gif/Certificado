import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await prisma.certificado.update({ where: { id: params.id }, data: { deletedAt: null } });
  return NextResponse.json({ ok: true });
}

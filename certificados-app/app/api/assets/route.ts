import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const assets = await prisma.asset.findMany({
    where: type ? { type: type as any } : undefined,
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const nome = formData.get("nome") as string;
  const cargo = (formData.get("cargo") as string) || null;

  if (!file || !type || !nome) {
    return NextResponse.json({ error: "Arquivo, tipo e nome são obrigatórios" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const blob = await put(`${type.toLowerCase()}/${Date.now()}-${nome.replace(/\s+/g, "-")}.${ext}`, file, {
    access: "public"
  });

  const asset = await prisma.asset.create({
    data: { type: type as any, nome, cargo, url: blob.url }
  });

  return NextResponse.json(asset, { status: 201 });
}

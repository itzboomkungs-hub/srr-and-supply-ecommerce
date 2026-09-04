import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/require-admin";


export const runtime = "nodejs";
const MAX = 10;
const MAX_SIZE = 5 * 1024 * 1024;
const types = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]);


export async function POST(request: Request) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ ok: false, message: "กรุณาเข้าสู่ระบบผู้ดูแล" }, { status: 401 }); }


  const form = await request.formData();
  const files = form.getAll("images").filter((v): v is File => v instanceof File).slice(0, MAX);
  if (!files.length) return NextResponse.json({ ok: true, images: [] });


  const folder = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(folder, { recursive: true });
  const urls: string[] = [];


  for (const file of files) {
    const ext = types.get(file.type);
    if (!ext) return NextResponse.json({ ok: false, message: "รองรับเฉพาะ JPG, PNG และ WEBP" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, message: "รูปภาพต้องไม่เกิน 5 MB ต่อรูป" }, { status: 400 });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/products/${filename}`);
  }
  return NextResponse.json({ ok: true, images: urls });
}
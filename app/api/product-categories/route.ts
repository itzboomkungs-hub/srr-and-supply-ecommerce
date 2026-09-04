import { NextResponse } from "next/server";
import { listProductCategories } from "../../../lib/products/product-categories-db";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const categories = await listProductCategories(false);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    console.error("List public categories error:", error);
    return NextResponse.json(
      { ok: false, message: "โหลดหมวดหมู่สินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
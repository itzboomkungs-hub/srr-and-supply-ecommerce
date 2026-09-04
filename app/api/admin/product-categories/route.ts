import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "../../../../lib/auth/require-admin";
import {
  createProductCategory,
  listProductCategories,
  type ProductCategoryStatus,
} from "../../../../lib/products/product-categories-db";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, message: error.publicMessage },
      { status: error.status }
    );
  }
  return null;
}


function duplicateResponse(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "ER_DUP_ENTRY") {
    return NextResponse.json(
      { ok: false, message: "ชื่อหรือรหัสหมวดหมู่นี้มีอยู่แล้ว" },
      { status: 409 }
    );
  }
  return null;
}


export async function GET() {
  try {
    await requireAdmin();
    const categories = await listProductCategories(true);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("List categories error:", error);
    return NextResponse.json(
      { ok: false, message: "โหลดหมวดหมู่สินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = await createProductCategory({
      name: String(body?.name || "").trim(),
      code: String(body?.code || "").trim(),
      description: String(body?.description || "").trim(),
      status: (body?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as ProductCategoryStatus,
    });
    return NextResponse.json({ ok: true, id, message: "เพิ่มหมวดหมู่เรียบร้อย" }, { status: 201 });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    const duplicate = duplicateResponse(error);
    if (duplicate) return duplicate;
    if (error instanceof Error && error.message === "CATEGORY_NAME_REQUIRED") {
      return NextResponse.json({ ok: false, message: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 });
    }
    console.error("Create category error:", error);
    return NextResponse.json({ ok: false, message: "เพิ่มหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}
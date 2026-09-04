import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "../../../../../lib/auth/require-admin";
import {
  deleteProductCategory,
  updateProductCategory,
  type ProductCategoryStatus,
} from "../../../../../lib/products/product-categories-db";


export const runtime = "nodejs";


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, message: error.publicMessage },
      { status: error.status }
    );
  }
  return null;
}


function commonError(error: unknown) {
  const mysqlCode = (error as { code?: string } | null)?.code;
  if (mysqlCode === "ER_DUP_ENTRY") {
    return NextResponse.json(
      { ok: false, message: "ชื่อหรือรหัสหมวดหมู่นี้มีอยู่แล้ว" },
      { status: 409 }
    );
  }
  if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
    return NextResponse.json({ ok: false, message: "ไม่พบหมวดหมู่" }, { status: 404 });
  }
  if (error instanceof Error && error.message === "CATEGORY_HAS_PRODUCTS") {
    return NextResponse.json(
      { ok: false, message: "ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้" },
      { status: 409 }
    );
  }
  return null;
}


type Context = { params: Promise<{ id: string }> };


export async function PUT(request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ ok: false, message: "รหัสหมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    }
    const body = await request.json();
    await updateProductCategory(numericId, {
      name: String(body?.name || "").trim(),
      code: String(body?.code || "").trim(),
      description: String(body?.description || "").trim(),
      status: (body?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as ProductCategoryStatus,
    });
    return NextResponse.json({ ok: true, message: "บันทึกหมวดหมู่เรียบร้อย" });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    const common = commonError(error);
    if (common) return common;
    console.error("Update category error:", error);
    return NextResponse.json({ ok: false, message: "แก้ไขหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}


export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ ok: false, message: "รหัสหมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    }
    await deleteProductCategory(numericId);
    return NextResponse.json({ ok: true, message: "ลบหมวดหมู่เรียบร้อย" });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    const common = commonError(error);
    if (common) return common;
    console.error("Delete category error:", error);
    return NextResponse.json({ ok: false, message: "ลบหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}
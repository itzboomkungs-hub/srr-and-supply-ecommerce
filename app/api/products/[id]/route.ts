import { NextResponse } from "next/server";

import { getPublicProductById } from "../../../../lib/products/product-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_ID", message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const product = await getPublicProductById(productId);
    if (!product) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error("GET PRODUCT API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "โหลดข้อมูลสินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { getCurrentAuthUser } from "../../../../lib/auth/current-user";
import {
  addMemberCartItem,
  removeMemberCartItem,
  setMemberCartItemQuantity,
} from "../../../../lib/cart/cart-db";

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" },
    { status: 401 }
  );
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const items = await addMemberCartItem(user.id, body.item);

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("ADD CART ITEM API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถเพิ่มสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", message: "ข้อมูลจำนวนสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const items = await setMemberCartItemQuantity(
      user.id,
      productId,
      quantity
    );

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("UPDATE CART ITEM API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถแก้ไขจำนวนสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const productId = Number(url.searchParams.get("productId"));

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const items = await removeMemberCartItem(user.id, productId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("REMOVE CART ITEM API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถลบสินค้าได้" },
      { status: 500 }
    );
  }
}

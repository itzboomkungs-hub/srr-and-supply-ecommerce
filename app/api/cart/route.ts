import { NextResponse } from "next/server";

import { getCurrentAuthUser } from "../../../lib/auth/current-user";
import {
  clearMemberCart,
  getMemberCart,
} from "../../../lib/cart/cart-db";

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" },
    { status: 401 }
  );
}

export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return unauthorized();

    const items = await getMemberCart(user.id);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("GET CART API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถโหลดตะกร้าสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return unauthorized();

    const items = await clearMemberCart(user.id);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("CLEAR CART API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถล้างตะกร้าสินค้าได้" },
      { status: 500 }
    );
  }
}

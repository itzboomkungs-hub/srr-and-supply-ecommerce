import { NextResponse } from "next/server";

import { getCurrentAuthUser } from "../../../../lib/auth/current-user";
import {
  mergeMemberCart,
  replaceMemberCart,
} from "../../../../lib/cart/cart-db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const mode = body.mode === "replace" ? "replace" : "merge";

    const items =
      mode === "replace"
        ? await replaceMemberCart(user.id, body.items)
        : await mergeMemberCart(user.id, body.items);

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("SYNC CART API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถซิงก์ตะกร้าสินค้าได้" },
      { status: 500 }
    );
  }
}

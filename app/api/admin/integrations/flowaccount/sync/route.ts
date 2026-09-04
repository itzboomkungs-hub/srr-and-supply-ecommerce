import { NextResponse } from "next/server";

import {
  AdminAuthError,
  requireAdminUser,
} from "../../../../../../lib/auth/require-admin";
import { syncFlowAccountProducts } from "../../../../../../lib/integrations/flowaccount-sync";

export async function POST() {
  try {
    await requireAdminUser();
    const result = await syncFlowAccountProducts();

    return NextResponse.json({
      ok: true,
      message: "Sync FlowAccount สำเร็จ",
      result,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    const code = error instanceof Error ? error.message : "FLOWACCOUNT_SYNC_ERROR";
    const message =
      code === "FLOWACCOUNT_NOT_CONFIGURED"
        ? "กรุณาตั้งค่า FlowAccount ก่อน Sync"
        : code === "FLOWACCOUNT_INVALID_CLIENT"
          ? "Client ID หรือ Client Secret ไม่ถูกต้อง"
          : "Sync สินค้าจาก FlowAccount ไม่สำเร็จ";

    console.error("FLOWACCOUNT SYNC ERROR:", code);
    return NextResponse.json(
      { ok: false, error: code, message },
      { status: 500 }
    );
  }
}

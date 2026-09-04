import { NextResponse } from "next/server";

import {
  AdminAuthError,
  requireAdminUser,
} from "../../../../../../lib/auth/require-admin";
import { testFlowAccountConnection } from "../../../../../../lib/integrations/flowaccount";
import { markFlowAccountConnection } from "../../../../../../lib/integrations/flowaccount-settings-db";

export async function POST() {
  try {
    await requireAdminUser();
    const token = await testFlowAccountConnection();

    return NextResponse.json({
      ok: true,
      message: "เชื่อมต่อ FlowAccount สำเร็จ",
      tokenExpiresAt: token.expiresAt,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    const code = error instanceof Error ? error.message : "FLOWACCOUNT_ERROR";

    try {
      await markFlowAccountConnection({
        status: "ERROR",
        error: code.slice(0, 1000),
        tested: true,
      });
    } catch {
      // ไม่ให้ error ตอนบันทึกสถานะบัง error หลักของการเชื่อมต่อ
    }

    const message =
      code === "FLOWACCOUNT_INVALID_CLIENT"
        ? "Client ID หรือ Client Secret ไม่ถูกต้อง"
        : code === "FLOWACCOUNT_NOT_CONFIGURED"
          ? "กรุณาบันทึก Client ID และ Client Secret ก่อน"
          : "ทดสอบการเชื่อมต่อ FlowAccount ไม่สำเร็จ";

    console.error("TEST FLOWACCOUNT ERROR:", code);
    return NextResponse.json(
      { ok: false, error: code, message },
      { status: 400 }
    );
  }
}

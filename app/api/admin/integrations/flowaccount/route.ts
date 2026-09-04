import { NextResponse } from "next/server";

import {
  AdminAuthError,
  requireAdminUser,
} from "../../../../../lib/auth/require-admin";
import {
  getFlowAccountSettingsRaw,
  saveFlowAccountSettings,
  toPublicFlowAccountSettings,
} from "../../../../../lib/integrations/flowaccount-settings-db";
import { validateFlowAccountSettingsInput } from "../../../../../lib/integrations/flowaccount-settings-validation.mjs";

function authError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, error: error.code, message: error.message },
      { status: error.status }
    );
  }
  return null;
}

export async function GET() {
  try {
    await requireAdminUser();
    const settings = await getFlowAccountSettingsRaw();
    return NextResponse.json({
      ok: true,
      settings: toPublicFlowAccountSettings(settings),
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;

    console.error("GET FLOWACCOUNT SETTINGS ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "โหลดการตั้งค่า FlowAccount ไม่สำเร็จ กรุณารัน SQL ชุด FlowAccount ก่อน",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminUser();
    const body = await request.json();
    const input = validateFlowAccountSettingsInput(body);

    const settings = await saveFlowAccountSettings({
      environment: input.environment,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      syncProducts: input.syncProducts,
      syncPrices: input.syncPrices,
      syncStock: input.syncStock,
    });

    return NextResponse.json({
      ok: true,
      settings: toPublicFlowAccountSettings(settings),
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;

    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("environment")) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", message: "Environment ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (message.includes("SRR_SETTINGS_ENCRYPTION_KEY")) {
      return NextResponse.json(
        {
          ok: false,
          error: "ENCRYPTION_KEY_REQUIRED",
          message: "กรุณาตั้งค่า SRR_SETTINGS_ENCRYPTION_KEY ใน .env.local ก่อนบันทึก Client Secret",
        },
        { status: 500 }
      );
    }

    console.error("SAVE FLOWACCOUNT SETTINGS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "บันทึกการตั้งค่า FlowAccount ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

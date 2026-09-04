import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "../../../../lib/db/mysql";
import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from "../../../../lib/auth/crypto.mjs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (rawToken) {
      const tokenHash = hashSessionToken(rawToken);

      await db.execute(
        `DELETE FROM \`AuthSession\` WHERE tokenHash = ?`,
        [tokenHash]
      );
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LOGOUT API ERROR:", error);

    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถออกจากระบบได้" },
      { status: 500 }
    );
  }
}

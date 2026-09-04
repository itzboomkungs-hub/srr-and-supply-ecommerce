import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { db } from "../../../../lib/db/mysql";
import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from "../../../../lib/auth/crypto.mjs";

type SessionUserRow = RowDataPacket & {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  customerId: string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "ยังไม่ได้เข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const tokenHash = hashSessionToken(rawToken);

    const [rows] = await db.execute<SessionUserRow[]>(
      `SELECT
         u.id,
         u.fullName,
         u.email,
         u.phone,
         u.role,
         u.customerId
       FROM \`AuthSession\` s
       INNER JOIN \`User\` u ON u.id = s.userId
       WHERE s.tokenHash = ?
         AND s.expiresAt > NOW(3)
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      [tokenHash]
    );

    const user = rows[0];

    if (!user) {
      cookieStore.delete(SESSION_COOKIE_NAME);

      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED", message: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("ME API ERROR:", error);

    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้" },
      { status: 500 }
    );
  }
}

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { db } from "../../../../lib/db/mysql";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  hashSessionToken,
  normalizeEmail,
  normalizePhone,
  verifyPassword,
} from "../../../../lib/auth/crypto.mjs";

type UserRow = RowDataPacket & {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
};

function jsonError(
  status: number,
  error: string,
  message: string
) {
  return NextResponse.json(
    { ok: false, error, message },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawIdentity = String(body.identity || "").trim();
    const password = String(body.password || "");
    const remember = Boolean(body.remember);

    if (!rawIdentity || !password) {
      return jsonError(400, "INVALID_INPUT", "กรุณากรอกอีเมล/เบอร์โทรและรหัสผ่าน");
    }

    const isEmail = rawIdentity.includes("@");
    const identity = isEmail
      ? normalizeEmail(rawIdentity)
      : normalizePhone(rawIdentity);

    const field = isEmail ? "email" : "phone";

    const [rows] = await db.execute<UserRow[]>(
      `SELECT id, fullName, email, phone, passwordHash, role, status
       FROM \`User\`
       WHERE ${field} = ?
       LIMIT 1`,
      [identity]
    );

    const user = rows[0];

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return jsonError(401, "INVALID_CREDENTIALS", "อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง");
    }

    if (user.status !== "ACTIVE") {
      return jsonError(403, "ACCOUNT_DISABLED", "บัญชีนี้ถูกระงับการใช้งาน");
    }

    const sessionDays = remember ? 30 : 1;
    const expiresAt = new Date(
      Date.now() + sessionDays * 24 * 60 * 60 * 1000
    );

    const rawToken = createSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    await db.execute(
      `DELETE FROM \`AuthSession\`
       WHERE userId = ? AND expiresAt <= NOW(3)`,
      [user.id]
    );

    await db.execute(
      `INSERT INTO \`AuthSession\`
        (id, userId, tokenHash, expiresAt)
       VALUES (?, ?, ?, ?)`,
      [randomUUID(), user.id, tokenHash, expiresAt]
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN API ERROR:", error);

    return jsonError(
      500,
      "INTERNAL_ERROR",
      "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบว่า MySQL เปิดอยู่แล้วลองใหม่"
    );
  }
}

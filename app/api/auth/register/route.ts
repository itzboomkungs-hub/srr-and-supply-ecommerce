import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { db } from "../../../../lib/db/mysql";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  normalizePhone,
} from "../../../../lib/auth/crypto.mjs";

type ExistingUserRow = RowDataPacket & {
  id: string;
  email: string;
  phone: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_DAYS = 30;

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
  let connection;

  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!fullName) {
      return jsonError(400, "INVALID_INPUT", "กรุณากรอกชื่อ-นามสกุล");
    }

    if (!EMAIL_PATTERN.test(email)) {
      return jsonError(400, "INVALID_INPUT", "รูปแบบอีเมลไม่ถูกต้อง");
    }

    if (phone.length < 9 || phone.length > 15) {
      return jsonError(400, "INVALID_INPUT", "เบอร์โทรศัพท์ไม่ถูกต้อง");
    }

    if (password.length < 8) {
      return jsonError(400, "INVALID_INPUT", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    }

    if (password !== confirmPassword) {
      return jsonError(400, "INVALID_INPUT", "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
    }

    const [existingRows] = await db.execute<ExistingUserRow[]>(
      `SELECT id, email, phone
       FROM \`User\`
       WHERE email = ? OR phone = ?
       LIMIT 1`,
      [email, phone]
    );

    const existing = existingRows[0];

    if (existing?.email === email) {
      return jsonError(409, "EMAIL_ALREADY_USED", "อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว");
    }

    if (existing?.phone === phone) {
      return jsonError(409, "PHONE_ALREADY_USED", "เบอร์โทรศัพท์นี้ถูกใช้สมัครสมาชิกแล้ว");
    }

    const userId = randomUUID();
    const passwordHash = hashPassword(password);

    const rawToken = createSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const sessionId = randomUUID();
    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    );

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO \`User\`
        (id, fullName, email, phone, passwordHash, role, status)
       VALUES (?, ?, ?, ?, ?, 'MEMBER', 'ACTIVE')`,
      [userId, fullName, email, phone, passwordHash]
    );

    await connection.execute(
      `INSERT INTO \`AuthSession\`
        (id, userId, tokenHash, expiresAt)
       VALUES (?, ?, ?, ?)`,
      [sessionId, userId, tokenHash, expiresAt]
    );

    await connection.commit();

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: userId,
          fullName,
          email,
          phone,
          role: "MEMBER",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error("REGISTER API ERROR:", error);

    return jsonError(
      500,
      "INTERNAL_ERROR",
      "ไม่สามารถสมัครสมาชิกได้ กรุณาตรวจสอบว่า MySQL เปิดอยู่แล้วลองใหม่"
    );
  } finally {
    connection?.release();
  }
}

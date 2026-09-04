import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { srrAdminDb } from "../../../../lib/db/srr-admin-db";
import {
  createCompatiblePasswordHash,
  describePasswordHash,
  verifyStoredPassword,
} from "../../../../lib/auth/password-compat.mjs";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const SESSION_COOKIE = "srr_session";


type UserRow = RowDataPacket & {
  id: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED";
};


export async function POST(request: Request) {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;


    if (!token) {
      return NextResponse.json({ ok: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }


    let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
    }


    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");


    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ ok: false, message: "กรุณากรอกรหัสผ่านให้ครบ" }, { status: 400 });
    }


    if (newPassword.length < 8) {
      return NextResponse.json({ ok: false, message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }


    if (newPassword.length > 128) {
      return NextResponse.json({ ok: false, message: "รหัสผ่านใหม่ยาวเกินไป" }, { status: 400 });
    }


    if (newPassword !== confirmPassword) {
      return NextResponse.json({ ok: false, message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" }, { status: 400 });
    }


    if (newPassword === currentPassword) {
      return NextResponse.json({ ok: false, message: "รหัสผ่านใหม่ต้องต่างจากรหัสผ่านปัจจุบัน" }, { status: 400 });
    }


    const tokenHash = createHash("sha256").update(token).digest("hex");
    const [rows] = await srrAdminDb.query<UserRow[]>(
      "SELECT u.id, u.passwordHash, u.status " +
        "FROM AuthSession s " +
        "INNER JOIN User u ON u.id = s.userId " +
        "WHERE s.tokenHash = ? " +
        "AND s.expiresAt > CURRENT_TIMESTAMP(3) " +
        "LIMIT 1",
      [tokenHash]
    );


    const user = rows[0];
    if (!user) {
      return NextResponse.json({ ok: false, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }


    if (user.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, message: "บัญชีนี้ถูกปิดการใช้งาน" }, { status: 403 });
    }


    const hashKind = describePasswordHash(user.passwordHash);
    if (hashKind === "unknown" || hashKind === "bcrypt") {
      return NextResponse.json(
        {
          ok: false,
          error: "UNSUPPORTED_PASSWORD_HASH",
          message: "รูปแบบรหัสผ่านเดิมของระบบยังไม่ตรงกับตัวเปลี่ยนรหัสผ่าน กรุณาส่ง app/api/auth/login/route.ts และ register/route.ts มาให้ผมปรับให้ตรงกัน",
        },
        { status: 409 }
      );
    }


    if (!verifyStoredPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ ok: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
    }


    const newHash = createCompatiblePasswordHash(newPassword, user.passwordHash);
    await srrAdminDb.execute(
      "UPDATE User SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [newHash, user.id]
    );


    return NextResponse.json({ ok: true, message: "เปลี่ยนรหัสผ่านเรียบร้อย" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ ok: false, message: "เปลี่ยนรหัสผ่านไม่สำเร็จ" }, { status: 500 });
  }
}

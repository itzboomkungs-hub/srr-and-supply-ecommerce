import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";


const root = process.cwd();
if (!fs.existsSync(path.join(root, "package.json"))) {
  throw new Error("กรุณาวางไฟล์นี้ที่ ROOT ของ srr-and-supply-ecommerce แล้วรันใหม่");
}


const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const backupRoot = path.join(path.dirname(root), "_backup_account_menu_change_password_" + stamp);


function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}


function backup(relativePath) {
  const src = path.join(root, relativePath);
  if (!fs.existsSync(src)) return;
  const dst = path.join(backupRoot, relativePath);
  ensureDir(dst);
  fs.copyFileSync(src, dst);
  console.log("BACKUP", relativePath);
}


function write(relativePath, content) {
  const target = path.join(root, relativePath);
  ensureDir(target);
  fs.writeFileSync(target, content.replace(/^\n/, ""), "utf8");
  console.log("WRITE ", relativePath);
}


console.log("============================================================");
console.log("SRR Account Menu + Change Password V1");
console.log("Backup outside project:", backupRoot);
console.log("============================================================");


const accountMenuTsx = String.raw`
"use client";


import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./AccountMenu.module.css";


type AccountRole = "MEMBER" | "STAFF" | "ADMIN";


type AccountUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AccountRole;
};


type Props = {
  user: AccountUser;
  roleLabel: string;
};


function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20C5.3 16.1 8.1 14 12 14C15.9 14 18.7 16.1 19.5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


export default function AccountMenu({ user, roleLabel }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (!open) return;


    function handleMouseDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }


    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }


    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);


    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);


  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={"เมนูบัญชี " + user.fullName}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.icon}><UserIcon /></span>
        <span className={styles.text}>
          <strong title={user.fullName}>{user.fullName}</strong>
          <small><i />{roleLabel}</small>
        </span>
        <span className={open ? styles.caretOpen : styles.caret} aria-hidden="true">⌄</span>
      </button>


      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.header}>
            <strong title={user.fullName}>{user.fullName}</strong>
            <span>{user.email || user.phone}</span>
            <small>{roleLabel}</small>
          </div>


          {user.role === "ADMIN" && (
            <Link href="/admin/products" className={styles.item} role="menuitem" onClick={() => setOpen(false)}>
              <span className={styles.itemIcon}>⚙</span>
              <span>
                <strong>เข้าหลังบ้าน</strong>
                <small>จัดการสินค้าและระบบ</small>
              </span>
            </Link>
          )}


          <Link href="/account/change-password" className={styles.item} role="menuitem" onClick={() => setOpen(false)}>
            <span className={styles.itemIcon}>⌘</span>
            <span>
              <strong>เปลี่ยนรหัสผ่าน</strong>
              <small>อัปเดตรหัสผ่านบัญชี</small>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
`;


const accountMenuCss = String.raw`
.root {
  position: relative;
  flex: 0 0 auto;
}


.trigger {
  min-height: 44px;
  padding: 4px 7px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #075bb7;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}


.trigger:hover,
.trigger[aria-expanded="true"] {
  background: #f2f7fc;
}


.icon {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eaf5ff;
  color: #075bb7;
}


.text {
  max-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}


.text strong {
  max-width: 150px;
  overflow: hidden;
  color: #173e6d;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.text small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8494a7;
  font-size: 10px;
}


.text small i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22a06b;
}


.caret,
.caretOpen {
  margin-left: 1px;
  color: #7890a8;
  font-size: 13px;
  line-height: 1;
  transition: transform 0.15s ease;
}


.caretOpen {
  transform: rotate(180deg);
}


.dropdown {
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 5000;
  width: 245px;
  padding: 8px;
  border: 1px solid #dce5ee;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(17, 51, 84, 0.19);
}


.header {
  padding: 9px 10px 11px;
  margin-bottom: 6px;
  border-bottom: 1px solid #edf1f5;
}


.header strong,
.header span,
.header small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.header strong {
  color: #173e6d;
  font-size: 12px;
}


.header span {
  margin-top: 3px;
  color: #71869b;
  font-size: 9px;
}


.header small {
  margin-top: 5px;
  width: max-content;
  padding: 3px 6px;
  border-radius: 999px;
  background: #eaf5ff;
  color: #075bb7;
  font-size: 8px;
  font-weight: 700;
}


.item {
  min-height: 48px;
  padding: 6px 8px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border-radius: 7px;
  color: #31516f;
  text-decoration: none;
}


.item:hover {
  background: #f2f7fc;
  color: #075bb7;
}


.itemIcon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #eaf4ff;
  color: #075bb7;
  font-size: 13px;
  font-weight: 800;
}


.item > span:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}


.item strong {
  color: inherit;
  font-size: 10px;
}


.item small {
  color: #8a9aaa;
  font-size: 8px;
}


@media (max-width: 620px) {
  .text,
  .caret,
  .caretOpen {
    display: none;
  }


  .trigger {
    width: 34px;
    height: 38px;
    min-height: 38px;
    padding: 0;
    justify-content: center;
  }


  .dropdown {
    position: fixed;
    top: 68px;
    right: 12px;
    width: min(260px, calc(100vw - 24px));
  }
}
`;


const passwordCompat = String.raw`
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";


function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}


function decodeHash(value) {
  const text = String(value || "").trim();
  if (/^[0-9a-f]+$/i.test(text) && text.length % 2 === 0) {
    return { buffer: Buffer.from(text, "hex"), encoding: "hex" };
  }
  try {
    return { buffer: Buffer.from(text, "base64"), encoding: "base64" };
  } catch {
    return { buffer: Buffer.alloc(0), encoding: "hex" };
  }
}


function parseStoredHash(storedHash) {
  const value = String(storedHash || "").trim();
  if (!value) return { kind: "unknown" };


  if (/^\$2[aby]\$/.test(value)) {
    return { kind: "bcrypt" };
  }


  if (/^[0-9a-f]{64}$/i.test(value)) {
    return { kind: "sha256", prefix: "" };
  }


  if (/^sha256:[0-9a-f]{64}$/i.test(value)) {
    return { kind: "sha256", prefix: "sha256:" };
  }


  const colon = value.split(":");
  if (colon.length === 3 && colon[0].toLowerCase() === "scrypt") {
    const decoded = decodeHash(colon[2]);
    return { kind: "scrypt", prefix: "scrypt:", separator: ":", salt: colon[1], decoded };
  }


  if (colon.length === 2 && colon[0] && colon[1]) {
    const decoded = decodeHash(colon[1]);
    if (decoded.buffer.length >= 16) {
      return { kind: "scrypt", prefix: "", separator: ":", salt: colon[0], decoded };
    }
  }


  const dollar = value.split("$");
  if (dollar.length === 3 && dollar[0].toLowerCase() === "scrypt") {
    const decoded = decodeHash(dollar[2]);
    return { kind: "scrypt", prefix: "scrypt$", separator: "$", salt: dollar[1], decoded };
  }


  if (dollar.length === 2 && dollar[0] && dollar[1]) {
    const decoded = decodeHash(dollar[1]);
    if (decoded.buffer.length >= 16) {
      return { kind: "scrypt", prefix: "", separator: "$", salt: dollar[0], decoded };
    }
  }


  return { kind: "unknown" };
}


export function describePasswordHash(storedHash) {
  return parseStoredHash(storedHash).kind;
}


export function verifyStoredPassword(password, storedHash) {
  const parsed = parseStoredHash(storedHash);


  if (parsed.kind === "sha256") {
    const digest = createHash("sha256").update(String(password)).digest("hex");
    const expected = String(storedHash).replace(/^sha256:/i, "");
    return safeEqual(Buffer.from(digest, "hex"), Buffer.from(expected, "hex"));
  }


  if (parsed.kind === "scrypt") {
    const expected = parsed.decoded.buffer;
    if (!expected.length) return false;
    const actual = scryptSync(String(password), parsed.salt, expected.length);
    return safeEqual(actual, expected);
  }


  return false;
}


export function createCompatiblePasswordHash(password, storedHash) {
  const parsed = parseStoredHash(storedHash);


  if (parsed.kind === "sha256") {
    const digest = createHash("sha256").update(String(password)).digest("hex");
    return parsed.prefix + digest;
  }


  if (parsed.kind === "scrypt") {
    const salt = randomBytes(16).toString("hex");
    const bytes = parsed.decoded.buffer.length || 64;
    const encoded = scryptSync(String(password), salt, bytes).toString(parsed.decoded.encoding);
    if (parsed.prefix === "scrypt:") return "scrypt:" + salt + ":" + encoded;
    if (parsed.prefix === "scrypt$") return "scrypt$" + salt + "$" + encoded;
    return salt + parsed.separator + encoded;
  }


  throw new Error("UNSUPPORTED_PASSWORD_HASH");
}
`;


const passwordCompatDts = String.raw`
export function describePasswordHash(storedHash: string): string;
export function verifyStoredPassword(password: string, storedHash: string): boolean;
export function createCompatiblePasswordHash(password: string, storedHash: string): string;
`;


const passwordTest = String.raw`
import test from "node:test";
import assert from "node:assert/strict";
import { createHash, scryptSync } from "node:crypto";
import {
  createCompatiblePasswordHash,
  describePasswordHash,
  verifyStoredPassword,
} from "../lib/auth/password-compat.mjs";


test("legacy salt:hex scrypt verifies and can be replaced", () => {
  const salt = "00112233445566778899aabbccddeeff";
  const stored = salt + ":" + scryptSync("old-password", salt, 64).toString("hex");
  assert.equal(describePasswordHash(stored), "scrypt");
  assert.equal(verifyStoredPassword("old-password", stored), true);
  assert.equal(verifyStoredPassword("wrong", stored), false);
  const next = createCompatiblePasswordHash("new-password", stored);
  assert.equal(verifyStoredPassword("new-password", next), true);
});


test("prefixed scrypt format round trips", () => {
  const salt = "abc123";
  const stored = "scrypt:" + salt + ":" + scryptSync("hello-123", salt, 64).toString("hex");
  assert.equal(verifyStoredPassword("hello-123", stored), true);
  const next = createCompatiblePasswordHash("hello-456", stored);
  assert.equal(next.startsWith("scrypt:"), true);
  assert.equal(verifyStoredPassword("hello-456", next), true);
});


test("sha256 legacy format remains compatible", () => {
  const stored = createHash("sha256").update("abc12345").digest("hex");
  assert.equal(verifyStoredPassword("abc12345", stored), true);
  const next = createCompatiblePasswordHash("xyz12345", stored);
  assert.equal(verifyStoredPassword("xyz12345", next), true);
});


test("unsupported hashes are never overwritten", () => {
  assert.equal(describePasswordHash("not-a-known-format"), "unknown");
  assert.throws(() => createCompatiblePasswordHash("new-password", "not-a-known-format"));
});
`;


const passwordRoute = String.raw`
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
`;


const changePasswordPage = String.raw`
"use client";


import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import SiteHeader from "../../../components/layout/SiteHeader";
import styles from "./ChangePasswordPage.module.css";


type AuthUser = {
  id: string;
  fullName: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
};


export default function ChangePasswordPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  useEffect(() => {
    let cancelled = false;


    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);


        if (!response.ok || !data?.ok || !data?.user) {
          window.location.replace("/login?tab=login");
          return;
        }


        if (!cancelled) setUser(data.user as AuthUser);
      } catch {
        if (!cancelled) setError("ไม่สามารถตรวจสอบบัญชีได้");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }


    void loadUser();
    return () => { cancelled = true; };
  }, []);


  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");


    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }
    if (newPassword.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }


    setSaving(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();


      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }


      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(data.message || "เปลี่ยนรหัสผ่านเรียบร้อย");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className={styles.pageShell}>
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}><Link href="/">หน้าหลัก</Link><span>/</span>เปลี่ยนรหัสผ่าน</div>


          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.lockIcon}>⌘</span>
              <div>
                <h1>เปลี่ยนรหัสผ่าน</h1>
                <p>{checking ? "กำลังตรวจสอบบัญชี..." : user ? "บัญชี: " + user.fullName : "จัดการรหัสผ่านบัญชี"}</p>
              </div>
            </div>


            {error && <div className={styles.alertError}>{error}</div>}
            {success && <div className={styles.alertSuccess}>{success}</div>}


            <form className={styles.form} onSubmit={submit}>
              <label>
                <span>รหัสผ่านปัจจุบัน</span>
                <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={checking || saving} />
              </label>


              <label>
                <span>รหัสผ่านใหม่</span>
                <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={checking || saving} />
                <small>อย่างน้อย 8 ตัวอักษร</small>
              </label>


              <label>
                <span>ยืนยันรหัสผ่านใหม่</span>
                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={checking || saving} />
              </label>


              <div className={styles.actions}>
                <Link href="/" className={styles.cancel}>ยกเลิก</Link>
                <button type="submit" className={styles.submit} disabled={checking || saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
`;


const changePasswordCss = String.raw`
.pageShell {
  min-height: 100vh;
  background: #f4f7fb;
  color: #29445f;
}


.main {
  padding: 42px 20px 70px;
}


.container {
  width: min(620px, 100%);
  margin: 0 auto;
}


.breadcrumb {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  color: #8293a4;
  font-size: 11px;
}


.breadcrumb a {
  color: #075bb7;
  text-decoration: none;
}


.card {
  overflow: hidden;
  border: 1px solid #dfe7ef;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 32px rgba(24, 57, 86, 0.08);
}


.cardHeader {
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 13px;
  border-bottom: 1px solid #e9eef3;
}


.lockIcon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #eaf4ff;
  color: #075bb7;
  font-size: 18px;
  font-weight: 800;
}


.cardHeader h1 {
  margin: 0;
  color: #173e6d;
  font-size: 21px;
}


.cardHeader p {
  margin: 5px 0 0;
  color: #8293a4;
  font-size: 10px;
}


.alertError,
.alertSuccess {
  margin: 18px 24px 0;
  padding: 11px 12px;
  border-radius: 8px;
  font-size: 10px;
  line-height: 1.5;
}


.alertError {
  border: 1px solid #efc6ca;
  background: #fff3f4;
  color: #bd3f4a;
}


.alertSuccess {
  border: 1px solid #bde5d1;
  background: #effbf5;
  color: #16825d;
}


.form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 17px;
}


.form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}


.form label > span {
  color: #456079;
  font-size: 11px;
  font-weight: 700;
}


.form input {
  width: 100%;
  height: 43px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #d3dee8;
  border-radius: 8px;
  outline: 0;
  background: #ffffff;
  color: #29445f;
  font: inherit;
  font-size: 12px;
}


.form input:focus {
  border-color: #1677d2;
  box-shadow: 0 0 0 3px rgba(22, 119, 210, 0.08);
}


.form input:disabled {
  background: #f5f7f9;
  cursor: not-allowed;
}


.form small {
  color: #8b9aaa;
  font-size: 9px;
}


.actions {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}


.cancel,
.submit {
  min-height: 40px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
}


.cancel {
  border: 1px solid #d7e1ea;
  background: #ffffff;
  color: #647a8f;
}


.submit {
  border: 1px solid #075bb7;
  background: #075bb7;
  color: #ffffff;
  cursor: pointer;
}


.submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}


@media (max-width: 620px) {
  .main { padding: 26px 12px 50px; }
  .cardHeader, .form { padding: 18px; }
  .alertError, .alertSuccess { margin-left: 18px; margin-right: 18px; }
  .actions { flex-direction: column-reverse; }
  .cancel, .submit { width: 100%; box-sizing: border-box; }
}
`;


// 1) Tests first.
write("tests/password-compat.test.mjs", passwordTest);


// 2) Password compatibility helper.
write("lib/auth/password-compat.mjs", passwordCompat);
write("lib/auth/password-compat.d.ts", passwordCompatDts);


console.log("Running password compatibility tests...");
execFileSync(process.execPath, ["--test", "tests/password-compat.test.mjs"], {
  cwd: root,
  stdio: "inherit",
});


// 3) New isolated account menu component.
write("components/layout/AccountMenu.tsx", accountMenuTsx);
write("components/layout/AccountMenu.module.css", accountMenuCss);


// 4) Real change-password page/API.
write("app/account/change-password/page.tsx", changePasswordPage);
write("app/account/change-password/ChangePasswordPage.module.css", changePasswordCss);
write("app/api/account/change-password/route.ts", passwordRoute);


// 5) Patch current SiteHeader only at the logged-in account block.
const headerRelative = "components/layout/SiteHeader.tsx";
const headerPath = path.join(root, headerRelative);
if (!fs.existsSync(headerPath)) {
  throw new Error("ไม่พบ components/layout/SiteHeader.tsx");
}


backup(headerRelative);
let header = fs.readFileSync(headerPath, "utf8");


if (!header.includes('import AccountMenu from "./AccountMenu";')) {
  const importNeedle = 'import styles from "./SiteHeader.module.css";';
  if (!header.includes(importNeedle)) {
    throw new Error("ไม่พบ import SiteHeader.module.css ใน SiteHeader.tsx");
  }
  header = header.replace(importNeedle, importNeedle + '\nimport AccountMenu from "./AccountMenu";');
}


if (!header.includes("<AccountMenu user={authUser}")) {
  const startNeedle = [
    "                  <div",
    '                    className={`${styles.account} ${styles.accountStatus}`}',
    '                    aria-label={`เข้าสู่ระบบแล้วในชื่อ ${authUser.fullName}`}',
    "                  >",
  ].join("\n");


  const endNeedle = [
    "                  <button",
    '                    type="button"',
    '                    className={`${styles.account} ${styles.logoutButton}`}',
  ].join("\n");


  const startIndex = header.indexOf(startNeedle);
  const endIndex = header.indexOf(endNeedle, startIndex + 1);


  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error("แพตเทิร์นบัญชีใน SiteHeader.tsx ไม่ตรงกับรุ่นที่ส่งมา จึงหยุดก่อนแก้เพื่อไม่ให้ไฟล์พัง");
  }


  header =
    header.slice(0, startIndex) +
    "                  <AccountMenu user={authUser} roleLabel={authRoleLabel} />\n\n" +
    header.slice(endIndex);
}


fs.writeFileSync(headerPath, header, "utf8");
console.log("PATCH ", headerRelative);


console.log("");
console.log("============================================================");
console.log("INSTALL COMPLETE");
console.log("============================================================");
console.log("สิ่งที่เพิ่ม:");
console.log("- MEMBER / STAFF: เมนู เปลี่ยนรหัสผ่าน");
console.log("- ADMIN: เข้าหลังบ้าน + เปลี่ยนรหัสผ่าน");
console.log("- /account/change-password");
console.log("- /api/account/change-password");
console.log("- ไม่แก้ logic Logout / Cart / Mega Menu");
console.log("Backup:", backupRoot);
console.log("");
console.log("ขั้นต่อไป:");
console.log("1) npm run build");
console.log("2) npm run dev");
console.log("3) Login แล้วกดชื่อผู้ใช้ด้านบน");
console.log("");
console.log("ถ้าหน้าเปลี่ยนรหัสผ่านแจ้ง UNSUPPORTED_PASSWORD_HASH ให้ส่ง");
console.log("app/api/auth/login/route.ts และ app/api/auth/register/route.ts มาให้ปรับตรงกับ hash เดิม");
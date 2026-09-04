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

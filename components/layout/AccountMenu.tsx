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

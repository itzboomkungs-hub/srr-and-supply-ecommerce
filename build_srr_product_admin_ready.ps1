# SRR Product Admin ZIP Builder
# Run in PowerShell: powershell -ExecutionPolicy Bypass -File .\build_srr_product_admin_ready.ps1


$ErrorActionPreference = "Stop"
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $base "srr_product_admin_ready"
$zip = Join-Path $base "srr_product_admin_ready.zip"


if (Test-Path $out) { Remove-Item $out -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }
New-Item -ItemType Directory -Path $out -Force | Out-Null


function Write-Utf8File([string]$RelativePath, [string]$Content) {
  $target = Join-Path $out $RelativePath
  $dir = Split-Path -Parent $target
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($target, $Content, [System.Text.UTF8Encoding]::new($false))
}


Write-Utf8File "README-TH.txt" @'
SRR AND SUPPLY — PRODUCT ADMIN READY
=====================================


ชุดนี้เพิ่มหน้า Admin สำหรับสร้างสินค้าโดยใช้ MySQL ก่อน และเตรียม field สำหรับ FlowAccount ในอนาคต


หลักการ:
- ตอนนี้เพิ่มสินค้าในเว็บ -> MySQL -> /api/products -> หน้า Products
- สินค้าใหม่เริ่มด้วย syncStatus=LOCAL_ONLY และ stockSource=LOCAL
- เมื่อได้ FlowAccount API แล้ว Sync จะจับคู่ด้วย flowProductMasterId ก่อน และ fallback ด้วย code
- ชื่อสินค้าเว็บ websiteName ไม่จำเป็นต้องตรงกับ FlowAccount
- ถ้า code ตรงกัน ให้ผูก flowProductMasterId กับสินค้าเดิม ไม่สร้างซ้ำ


ติดตั้ง:
1) แตก ZIP แล้ว merge ที่ ROOT โปรเจกต์
2) ถ้ายังไม่มี mysql2: npm install mysql2
3) รัน database/srr_product_admin_upgrade.sql ใน HeidiSQL ที่ฐาน srr_auth_local
4) Restart: npm run dev
5) เปิด http://localhost:3000/admin/products/new
6) ต้อง Login ด้วย role=ADMIN และ status=ACTIVE


รูปสินค้า:
- Local/Laragon: บันทึกที่ public/uploads/products
- ก่อนขึ้น Vercel จริงควรย้ายไป Blob/S3/Cloudinary เพราะ filesystem บน deployment ไม่ใช่ที่เก็บถาวร


Sidebar:
เปิด components/Sidebar.tsx แล้วเพิ่มเมนูตามไฟล์ SIDEBAR-PATCH.txt


หน้า Products ปัจจุบันของคุณอ่าน /api/products จาก MySQL อยู่แล้ว ดังนั้นสินค้าที่สร้างจะโผล่บนหน้าเว็บโดยไม่ใช้ const demo
'@


Write-Utf8File "SIDEBAR-PATCH.txt" @'
ใน components/Sidebar.tsx ให้เพิ่ม item นี้ในกลุ่ม "จัดการสินค้า":


{
  label: "เพิ่มสินค้า",
  href: "/admin/products/new",
},


ตัวอย่าง:
{
  title: "จัดการสินค้า",
  icon: "▣",
  items: [
    { label: "สินค้า", href: "/products" },
    { label: "เพิ่มสินค้า", href: "/admin/products/new" },
    { label: "หมวดหมู่สินค้า", href: "/admin/product-categories" },
  ],
},


ถ้าเมนู FlowAccount อยู่ใน app/admin/settings/flowaccount ให้ href เป็น:
/admin/settings/flowaccount
'@


Write-Utf8File "database/srr_product_admin_upgrade.sql" @'
USE `srr_auth_local`;


CREATE TABLE IF NOT EXISTS `Product` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `websiteName` VARCHAR(255) NOT NULL,
  `websiteDescription` TEXT NULL,
  `category` VARCHAR(150) NOT NULL DEFAULT '',
  `material` VARCHAR(150) NOT NULL DEFAULT '',
  `image` VARCHAR(500) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `flowProductMasterId` BIGINT NULL,
  `flowName` VARCHAR(255) NULL,
  `flowCategoryName` VARCHAR(255) NULL,
  `flowType` INT NULL,
  `unitName` VARCHAR(100) NULL,
  `sellPrice` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `stock` DECIMAL(15,3) NOT NULL DEFAULT 0,
  `stockSource` VARCHAR(30) NOT NULL DEFAULT 'LOCAL',
  `lastSyncedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP PROCEDURE IF EXISTS `srr_add_product_column`;
DELIMITER $$
CREATE PROCEDURE `srr_add_product_column`(IN p_column VARCHAR(100), IN p_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Product'
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql_text = CONCAT('ALTER TABLE `Product` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;


CALL `srr_add_product_column`('websiteName', 'VARCHAR(255) NOT NULL DEFAULT ''''');
CALL `srr_add_product_column`('websiteDescription', 'TEXT NULL');
CALL `srr_add_product_column`('category', 'VARCHAR(150) NOT NULL DEFAULT ''''');
CALL `srr_add_product_column`('material', 'VARCHAR(150) NOT NULL DEFAULT ''''');
CALL `srr_add_product_column`('image', 'VARCHAR(500) NULL');
CALL `srr_add_product_column`('active', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL `srr_add_product_column`('flowProductMasterId', 'BIGINT NULL');
CALL `srr_add_product_column`('flowName', 'VARCHAR(255) NULL');
CALL `srr_add_product_column`('flowCategoryName', 'VARCHAR(255) NULL');
CALL `srr_add_product_column`('flowType', 'INT NULL');
CALL `srr_add_product_column`('unitName', 'VARCHAR(100) NULL');
CALL `srr_add_product_column`('sellPrice', 'DECIMAL(15,2) NOT NULL DEFAULT 0');
CALL `srr_add_product_column`('stock', 'DECIMAL(15,3) NOT NULL DEFAULT 0');
CALL `srr_add_product_column`('stockSource', 'VARCHAR(30) NOT NULL DEFAULT ''LOCAL''');
CALL `srr_add_product_column`('productType', 'VARCHAR(30) NOT NULL DEFAULT ''STOCK''');
CALL `srr_add_product_column`('barcode', 'VARCHAR(150) NULL');
CALL `srr_add_product_column`('taxType', 'VARCHAR(30) NOT NULL DEFAULT ''EXCLUDE_VAT''');
CALL `srr_add_product_column`('lowStockThreshold', 'DECIMAL(15,3) NOT NULL DEFAULT 0');
CALL `srr_add_product_column`('incomeAccountCode', 'VARCHAR(50) NULL');
CALL `srr_add_product_column`('syncStatus', 'VARCHAR(30) NOT NULL DEFAULT ''LOCAL_ONLY''');
CALL `srr_add_product_column`('flowMatchedAt', 'DATETIME(3) NULL');
CALL `srr_add_product_column`('lastSyncedAt', 'DATETIME(3) NULL');
CALL `srr_add_product_column`('createdAt', 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');
CALL `srr_add_product_column`('updatedAt', 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
DROP PROCEDURE IF EXISTS `srr_add_product_column`;


CREATE TABLE IF NOT EXISTS `ProductImage` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `productId` BIGINT NOT NULL,
  `imageUrl` VARCHAR(500) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductImage_productId_idx` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DESCRIBE `Product`;
SELECT COUNT(*) AS totalProducts FROM `Product`;
'@


Write-Utf8File "lib/db/srr-admin-db.ts" @'
import { createPool, type Pool } from "mysql2/promise";


type GlobalDb = typeof globalThis & { __srrAdminPool?: Pool };
const g = globalThis as GlobalDb;


function makePool() {
  return createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || "root",
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "srr_auth_local",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
}


export const srrAdminDb = g.__srrAdminPool ?? makePool();
if (process.env.NODE_ENV !== "production") g.__srrAdminPool = srrAdminDb;
'@


Write-Utf8File "lib/auth/require-admin.ts" @'
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { srrAdminDb } from "../db/srr-admin-db";


const SESSION_COOKIE = "srr_session";


type AdminRow = RowDataPacket & {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
};


export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHORIZED");


  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [rows] = await srrAdminDb.query<AdminRow[]>(`
    SELECT u.id, u.fullName, u.email, u.phone, u.role, u.status
    FROM AuthSession s
    INNER JOIN User u ON u.id = s.userId
    WHERE s.tokenHash = ?
      AND s.expiresAt > CURRENT_TIMESTAMP(3)
    LIMIT 1
  `, [tokenHash]);


  const user = rows[0];
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.status !== "ACTIVE") throw new Error("ACCOUNT_DISABLED");
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
'@


Write-Utf8File "app/api/products/route.ts" @'
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { srrAdminDb } from "../../../lib/db/srr-admin-db";


export const runtime = "nodejs";


type ProductRow = RowDataPacket & {
  id: number;
  code: string;
  websiteName: string;
  category: string;
  material: string;
  image: string | null;
  sellPrice: string | number;
  stock: string | number;
  active: number;
};


export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  try {
    const [rows] = await srrAdminDb.query<ProductRow[]>(`
      SELECT id, code, websiteName, category, material, image, sellPrice, stock, active
      FROM Product
      ${includeInactive ? "" : "WHERE active = 1"}
      ORDER BY id DESC
    `);


    return NextResponse.json({
      ok: true,
      products: rows.map((row) => ({
        id: Number(row.id),
        name: row.websiteName || row.code,
        code: row.code || "",
        category: row.category || "",
        material: row.material || "",
        image: row.image || null,
        price: Number(row.sellPrice || 0),
        stock: Number(row.stock || 0),
        reserved: 0,
        active: Boolean(row.active),
      })),
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ ok: false, message: "โหลดสินค้าไม่สำเร็จ" }, { status: 500 });
  }
}
'@


Write-Utf8File "lib/products/product-normalize.mjs" @'
export function normalizeApiProduct(item) {
  const value = item && typeof item === "object" ? item : {};
  return {
    id: Number(value.id || 0),
    name: String(value.name || value.websiteName || ""),
    code: String(value.code || ""),
    category: String(value.category || ""),
    material: String(value.material || ""),
    image: value.image || null,
    price: Number(value.price ?? value.sellPrice ?? 0),
    stock: Number(value.stock ?? 0),
    reserved: Number(value.reserved ?? 0),
    active: value.active !== false && value.active !== 0,
  };
}
'@


Write-Utf8File "app/api/admin/products/route.ts" @'
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireAdmin } from "../../../../lib/auth/require-admin";
import { srrAdminDb } from "../../../../lib/db/srr-admin-db";


export const runtime = "nodejs";


type ExistsRow = RowDataPacket & { id: number };
type Body = {
  productType?: string;
  websiteName?: string;
  code?: string;
  category?: string;
  material?: string;
  unitName?: string;
  barcode?: string;
  sellPrice?: number;
  taxType?: string;
  websiteDescription?: string;
  stock?: number;
  lowStockThreshold?: number;
  incomeAccountCode?: string;
  images?: string[];
};


const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const codeOf = (v: unknown) => text(v).toUpperCase().replace(/\s+/g, "-");


function authError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return NextResponse.json({
    ok: false,
    error: code === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHORIZED",
    message: code === "FORBIDDEN" ? "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ" : "กรุณาเข้าสู่ระบบ",
  }, { status: code === "FORBIDDEN" ? 403 : 401 });
}


export async function POST(request: Request) {
  try { await requireAdmin(); } catch (error) { return authError(error); }


  let body: Body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 }); }


  const websiteName = text(body.websiteName);
  const code = codeOf(body.code);
  const productType = ["SERVICE", "NON_STOCK", "STOCK"].includes(text(body.productType)) ? text(body.productType) : "STOCK";
  if (!websiteName) return NextResponse.json({ ok: false, message: "กรุณากรอกชื่อสินค้า" }, { status: 400 });
  if (!code) return NextResponse.json({ ok: false, message: "กรุณากรอกรหัสสินค้า" }, { status: 400 });


  const [exists] = await srrAdminDb.query<ExistsRow[]>("SELECT id FROM Product WHERE UPPER(code)=UPPER(?) LIMIT 1", [code]);
  if (exists.length) return NextResponse.json({ ok: false, error: "PRODUCT_CODE_ALREADY_EXISTS", message: `มีสินค้ารหัส ${code} อยู่แล้ว` }, { status: 409 });


  const images = Array.isArray(body.images) ? body.images.map(text).filter(Boolean).slice(0, 10) : [];
  const sellPrice = Math.max(0, num(body.sellPrice));
  const stock = productType === "STOCK" ? Math.max(0, num(body.stock)) : 0;
  const lowStockThreshold = Math.max(0, num(body.lowStockThreshold));
  const db = await srrAdminDb.getConnection();


  try {
    await db.beginTransaction();
    const [result] = await db.execute<ResultSetHeader>(`
      INSERT INTO Product (
        code, websiteName, websiteDescription, category, material, image, active,
        flowProductMasterId, flowName, flowCategoryName, flowType,
        unitName, sellPrice, stock, stockSource,
        productType, barcode, taxType, lowStockThreshold, incomeAccountCode,
        syncStatus, lastSyncedAt, flowMatchedAt, createdAt, updatedAt
      ) VALUES (
        ?,?,?,?,?,?,1,
        NULL,NULL,NULL,NULL,
        ?,?,?,'LOCAL',
        ?,?,?,?,?,
        'LOCAL_ONLY',NULL,NULL,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)
      )
    `, [
      code, websiteName, text(body.websiteDescription), text(body.category), text(body.material), images[0] || null,
      text(body.unitName), sellPrice, stock, productType, text(body.barcode) || null,
      text(body.taxType) || "EXCLUDE_VAT", lowStockThreshold, text(body.incomeAccountCode) || null,
    ]);


    const productId = Number(result.insertId);
    for (let i = 0; i < images.length; i += 1) {
      await db.execute("INSERT INTO ProductImage (productId,imageUrl,sortOrder,createdAt) VALUES (?,?,?,CURRENT_TIMESTAMP(3))", [productId, images[i], i]);
    }
    await db.commit();
    return NextResponse.json({ ok: true, product: { id: productId, code, name: websiteName, syncStatus: "LOCAL_ONLY", flowProductMasterId: null }, message: "เพิ่มสินค้าเรียบร้อย" }, { status: 201 });
  } catch (error) {
    await db.rollback();
    console.error("Create product error:", error);
    return NextResponse.json({ ok: false, message: "ไม่สามารถเพิ่มสินค้าได้" }, { status: 500 });
  } finally { db.release(); }
}
'@


Write-Utf8File "app/api/admin/products/upload/route.ts" @'
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/require-admin";


export const runtime = "nodejs";
const MAX = 10;
const MAX_SIZE = 5 * 1024 * 1024;
const types = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]);


export async function POST(request: Request) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ ok: false, message: "กรุณาเข้าสู่ระบบผู้ดูแล" }, { status: 401 }); }


  const form = await request.formData();
  const files = form.getAll("images").filter((v): v is File => v instanceof File).slice(0, MAX);
  if (!files.length) return NextResponse.json({ ok: true, images: [] });


  const folder = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(folder, { recursive: true });
  const urls: string[] = [];


  for (const file of files) {
    const ext = types.get(file.type);
    if (!ext) return NextResponse.json({ ok: false, message: "รองรับเฉพาะ JPG, PNG และ WEBP" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, message: "รูปภาพต้องไม่เกิน 5 MB ต่อรูป" }, { status: 400 });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/products/${filename}`);
  }
  return NextResponse.json({ ok: true, images: urls });
}
'@


Write-Utf8File "app/admin/products/new/page.tsx" @'
"use client";


import { useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProductCreatePage.module.css";


type ProductType = "SERVICE" | "NON_STOCK" | "STOCK";
type TaxType = "EXCLUDE_VAT" | "INCLUDE_VAT" | "NO_VAT";
const categories = ["O-Ring","Oil Seal","Hydraulic Seal","Pneumatic Seal","Rotary Seal","Gasket","Pump Parts","Valve","Industrial Parts","Repair Kit","อื่น ๆ"];
const units = ["ชิ้น","ชุด","กล่อง","แพ็ค","ม้วน","เส้น","ตัว","อัน","เมตร","กิโลกรัม"];


export default function ProductCreatePage() {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>("STOCK");
  const [websiteName, setWebsiteName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [unitName, setUnitName] = useState("ชิ้น");
  const [barcode, setBarcode] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("EXCLUDE_VAT");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [incomeAccountCode, setIncomeAccountCode] = useState("41210");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  const previews = useMemo(() => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [imageFiles]);


  function addImages(files: FileList | File[]) {
    const accepted = Array.from(files).filter((f) => ["image/jpeg","image/png","image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024);
    setImageFiles((current) => [...current, ...accepted].slice(0, 10));
  }


  function imageInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addImages(event.target.files);
    event.target.value = "";
  }


  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addImages(event.dataTransfer.files);
  }


  async function uploadImages() {
    if (!imageFiles.length) return [];
    const form = new FormData();
    imageFiles.forEach((file) => form.append("images", file));
    const response = await fetch("/api/admin/products/upload", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.message || "อัปโหลดรูปไม่สำเร็จ");
    return Array.isArray(data.images) ? data.images : [];
  }


  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(""); setMessage("");
    if (!websiteName.trim()) return setError("กรุณากรอกชื่อสินค้า");
    if (!code.trim()) return setError("กรุณากรอกรหัสสินค้า");
    setSaving(true);
    try {
      const images = await uploadImages();
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType, websiteName: websiteName.trim(), code: code.trim(), category, material: material.trim(), unitName,
          barcode: barcode.trim(), sellPrice: Number(sellPrice || 0), taxType, websiteDescription: description.trim(),
          stock: productType === "STOCK" ? Number(stock || 0) : 0, lowStockThreshold: Number(lowStockThreshold || 0),
          incomeAccountCode: incomeAccountCode.trim(), images,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "เพิ่มสินค้าไม่สำเร็จ");
      setMessage("เพิ่มสินค้าเรียบร้อย");
      setTimeout(() => { router.push("/admin/products"); router.refresh(); }, 500);
    } catch (e) { setError(e instanceof Error ? e.message : "เพิ่มสินค้าไม่สำเร็จ"); }
    finally { setSaving(false); }
  }


  return <main className={styles.page}>
    <form onSubmit={submit}>
      <header className={styles.header}>
        <div><div className={styles.breadcrumb}>จัดการสินค้า <span>/</span> สร้างสินค้า</div><h1>สร้างบริการหรือสินค้า</h1><p>เพิ่มสินค้าเข้าสู่ SRR และเตรียมพร้อมสำหรับเชื่อม FlowAccount</p></div>
        <div className={styles.actions}><button type="button" className={styles.cancel} onClick={() => router.back()}>ยกเลิก</button><button className={styles.save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div>
      </header>


      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}


      <section className={styles.card}><h2>ประเภทสินค้า</h2><div className={styles.types}>
        {([ ["SERVICE","☁","บริการ","ไม่มีการนับสต๊อก"], ["NON_STOCK","▣","สินค้าไม่นับสต๊อก","ขายสินค้าแต่ไม่ควบคุมจำนวน"], ["STOCK","▥","สินค้านับสต๊อก","ใช้จำนวนคงเหลือกับหน้าเว็บและตะกร้า"] ] as const).map(([value,icon,title,sub]) =>
          <button key={value} type="button" className={`${styles.typeButton} ${productType===value ? styles.active : ""}`} onClick={() => setProductType(value)}><b>{icon}</b><span><strong>{title}</strong><small>{sub}</small></span></button>
        )}
      </div></section>


      <section className={styles.card}><h2>ข้อมูลสินค้า</h2>
        <label className={styles.upload} onDragOver={(e)=>e.preventDefault()} onDrop={drop}><input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={imageInput}/><b>⊞</b><strong>เลือกไฟล์ หรือลากไฟล์วางที่นี่</strong><small>สูงสุด 10 รูป · JPG, PNG, WEBP · ไม่เกิน 5 MB ต่อรูป</small></label>
        {!!previews.length && <div className={styles.images}>{previews.map((p,i)=><div className={styles.preview} key={`${p.file.name}-${i}`}><img src={p.url} alt=""/><button type="button" onClick={()=>setImageFiles((c)=>c.filter((_,x)=>x!==i))}>×</button>{i===0 && <span>รูปหลัก</span>}</div>)}</div>}
        <div className={styles.grid}>
          <label><span>ชื่อสินค้า *</span><input value={websiteName} onChange={(e)=>setWebsiteName(e.target.value)} placeholder="ระบุชื่อสินค้า"/></label>
          <label><span>รหัสสินค้า *</span><input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="เช่น OR-VITON-M40"/><small>ใช้รหัสนี้จับคู่กับ FlowAccount ในอนาคต</small></label>
          <label><span>หมวดสินค้า</span><select value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">ระบุหมวดสินค้า</option>{categories.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label><span>หน่วยสินค้าหลัก</span><select value={unitName} onChange={(e)=>setUnitName(e.target.value)}>{units.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label><span>วัสดุ</span><input value={material} onChange={(e)=>setMaterial(e.target.value)} placeholder="NBR, Viton, EPDM"/></label>
          <label><span>เลขบาร์โค้ด</span><input value={barcode} onChange={(e)=>setBarcode(e.target.value)} placeholder="ระบุเลขบาร์โค้ด"/></label>
        </div>
      </section>


      <section className={styles.card}><h2>ข้อมูลการขาย</h2><div className={styles.grid}>
        <label><span>ราคาขาย</span><input type="number" min="0" step="0.01" value={sellPrice} onChange={(e)=>setSellPrice(e.target.value)} placeholder="0.00"/></label>
        <label><span>ภาษีมูลค่าเพิ่ม</span><select value={taxType} onChange={(e)=>setTaxType(e.target.value as TaxType)}><option value="EXCLUDE_VAT">ราคายังไม่รวม VAT</option><option value="INCLUDE_VAT">ราคารวม VAT</option><option value="NO_VAT">ไม่มี VAT</option></select></label>
      </div><label className={styles.full}><span>รายละเอียดสินค้า</span><textarea rows={5} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="รายละเอียดสินค้า คุณสมบัติ การใช้งาน ขนาด หรือข้อมูลเพิ่มเติม"/></label></section>


      {productType === "STOCK" && <section className={styles.card}><h2>ข้อมูลสต๊อก</h2><div className={styles.grid}>
        <label><span>จำนวนเริ่มต้น</span><input type="number" min="0" step="1" value={stock} onChange={(e)=>setStock(e.target.value)} placeholder="0"/></label>
        <label><span>แจ้งเตือนเมื่อเหลือ</span><input type="number" min="0" step="1" value={lowStockThreshold} onChange={(e)=>setLowStockThreshold(e.target.value)}/></label>
      </div><div className={styles.notice}><strong>Stock source: SRR MySQL</strong><span>เมื่อเปิด FlowAccount Sync สินค้าที่จับคู่สำเร็จสามารถเปลี่ยนไปใช้สต๊อกจาก FlowAccount ได้</span></div></section>}


      <section className={styles.card}><h2>กำหนดการลงบัญชี</h2><label className={styles.full}><span>บัญชีรายได้</span><select value={incomeAccountCode} onChange={(e)=>setIncomeAccountCode(e.target.value)}><option value="41210">41210 / รายได้จากการขายสินค้า</option><option value="41220">41220 / รายได้จากการให้บริการ</option></select></label></section>


      <section className={`${styles.card} ${styles.flow}`}><div><h2>FlowAccount</h2><p>สินค้านี้จะถูกสร้างใน SRR ก่อน และยังไม่ส่งเข้า FlowAccount จนกว่าจะเปิดการเชื่อมต่อ</p></div><div className={styles.flowStatus}><span>LOCAL ONLY</span><strong>ตอน Sync ระบบจะค้นหารหัสสินค้าเดียวกันก่อน</strong><small>ถ้าพบรหัสตรงกัน จะเก็บ Flow Product Master ID และไม่สร้างรายการซ้ำ</small></div></section>
    </form>
  </main>;
}
'@


Write-Utf8File "app/admin/products/new/ProductCreatePage.module.css" @'
.page{width:100%;min-height:100%;padding:30px 38px 60px;box-sizing:border-box;background:#f4f7fb;color:#28445f}.page form{width:min(1500px,100%);margin:0 auto}.header{margin-bottom:22px;display:flex;align-items:flex-end;justify-content:space-between;gap:25px}.breadcrumb{margin-bottom:8px;display:flex;gap:8px;color:#8396aa;font-size:11px}.header h1{margin:0;color:#123d65;font-size:28px}.header p{margin:7px 0 0;color:#8194a8;font-size:12px}.actions{display:flex;gap:9px}.cancel,.save{min-width:108px;height:41px;padding:0 17px;border-radius:6px;font:700 11px inherit;cursor:pointer}.cancel{border:1px solid #9baabd;background:#fff;color:#65798e}.save{border:1px solid #7cbd1d;background:#83c522;color:#fff}.save:hover{background:#73b018}.error,.success{margin-bottom:15px;padding:12px 15px;border-radius:7px;font-size:11px}.error{border:1px solid #efc2c7;background:#fff2f3;color:#c84955}.success{border:1px solid #bde6d1;background:#effbf5;color:#16825d}.card{margin-bottom:13px;padding:22px;border:1px solid #e0e8f0;border-radius:8px;background:#fff;box-shadow:0 3px 12px rgba(28,54,79,.04)}.card h2{margin:0 0 20px;color:#2196d2;font-size:13px}.types{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.typeButton{min-height:58px;padding:0 18px;display:flex;align-items:center;gap:14px;border:1px solid #cfd9e5;border-radius:5px;background:#fff;color:#49617a;text-align:left;cursor:pointer}.typeButton>b{font-size:20px;color:#239ed9}.typeButton span{display:flex;flex-direction:column;gap:3px}.typeButton strong{font-size:11px;color:#263f59}.typeButton small{font-size:9px;color:#95a5b5}.active{border-color:#209bd8;background:#effaff}.upload{min-height:110px;margin-bottom:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1px dashed #becbd8;background:#fff;color:#71869b;cursor:pointer}.upload>b{font-size:27px}.upload strong{font-size:10px}.upload small{font-size:9px;color:#9aa9b7}.images{margin-bottom:20px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}.preview{position:relative;aspect-ratio:1;overflow:hidden;border:1px solid #e0e6ed;border-radius:6px}.preview img{width:100%;height:100%;object-fit:contain}.preview button{position:absolute;top:5px;right:5px;width:24px;height:24px;border:0;border-radius:50%;background:rgba(28,43,58,.75);color:#fff}.preview>span{position:absolute;left:5px;bottom:5px;padding:4px 7px;border-radius:4px;background:#075bb7;color:#fff;font-size:8px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 22px}.grid label,.full{display:flex;flex-direction:column;gap:7px}.grid label>span,.full>span{color:#263f59;font-size:10px;font-weight:700}.grid label>small{margin-top:-2px;color:#8ea0b1;font-size:8px}.grid input,.grid select,.full select,.full textarea{width:100%;box-sizing:border-box;border:1px solid #cdd8e4;border-radius:4px;outline:none;background:#fff;color:#2c455e;font-family:inherit;font-size:11px}.grid input,.grid select,.full select{height:39px;padding:0 10px}.full{margin-top:18px}.full textarea{min-height:90px;padding:10px;resize:vertical}.grid input:focus,.grid select:focus,.full select:focus,.full textarea:focus{border-color:#229bd7;box-shadow:0 0 0 2px rgba(34,155,215,.06)}.notice{margin-top:18px;padding:12px 14px;display:flex;flex-direction:column;gap:4px;border:1px solid #d9e9f6;border-radius:5px;background:#f5faff}.notice strong{font-size:10px;color:#176eab}.notice span{font-size:9px;color:#75899d}.flow{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.8fr);gap:25px;align-items:center}.flow h2{margin-bottom:6px}.flow p{margin:0;color:#8193a5;font-size:10px}.flowStatus{padding:14px;display:flex;flex-direction:column;gap:5px;border:1px solid #dce5ee;border-radius:7px;background:#f8fafc}.flowStatus>span{width:max-content;padding:4px 7px;border-radius:4px;background:#fff3d8;color:#b6780b;font-size:8px;font-weight:800}.flowStatus strong{font-size:10px}.flowStatus small{font-size:9px;color:#8a9bac}@media(max-width:1050px){.page{padding:25px 24px 50px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.images{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:720px){.page{padding:20px 14px 40px}.header{align-items:flex-start;flex-direction:column}.actions{width:100%}.actions button{flex:1}.types,.grid,.flow{grid-template-columns:1fr}.images{grid-template-columns:repeat(3,minmax(0,1fr))}}
'@


Write-Utf8File "VERIFY.ps1" @'
$ErrorActionPreference = "Stop"
Write-Host "Checking package files..."
$required = @(
  "database/srr_product_admin_upgrade.sql",
  "app/admin/products/new/page.tsx",
  "app/admin/products/new/ProductCreatePage.module.css",
  "app/api/admin/products/route.ts",
  "app/api/admin/products/upload/route.ts",
  "app/api/products/route.ts",
  "lib/db/srr-admin-db.ts",
  "lib/auth/require-admin.ts",
  "lib/products/product-normalize.mjs"
)
foreach($f in $required){ if(-not (Test-Path (Join-Path $PSScriptRoot $f))){ throw "Missing: $f" } }
Write-Host "OK: package structure complete" -ForegroundColor Green
'@


Compress-Archive -Path (Join-Path $out "*") -DestinationPath $zip -CompressionLevel Optimal
Write-Host "DONE" -ForegroundColor Green
Write-Host "ZIP: $zip"
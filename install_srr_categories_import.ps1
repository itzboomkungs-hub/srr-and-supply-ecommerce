# SRR AND SUPPLY - Product Categories + Customer File Import Installer
# Run from PROJECT ROOT:
# powershell -ExecutionPolicy Bypass -File .\install_srr_categories_import.ps1


$ErrorActionPreference = "Stop"
$Root = (Get-Location).Path


if (-not (Test-Path (Join-Path $Root "package.json"))) {
  throw "กรุณาวางไฟล์นี้ที่ ROOT ของ srr-and-supply-ecommerce แล้วรันใหม่"
}


$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $Root "_backup_categories_import_$stamp"
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null


function Ensure-Parent([string]$Path) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
}


function Backup-File([string]$RelativePath) {
  $src = Join-Path $Root $RelativePath
  if (-not (Test-Path $src)) { return }
  $dst = Join-Path $BackupRoot $RelativePath
  Ensure-Parent $dst
  Copy-Item $src $dst -Force
}


function Write-Utf8File([string]$RelativePath, [string]$Content) {
  $target = Join-Path $Root $RelativePath
  Ensure-Parent $target
  [System.IO.File]::WriteAllText($target, $Content, [System.Text.UTF8Encoding]::new($false))
  Write-Host "WRITE  $RelativePath" -ForegroundColor Cyan
}


Write-Host "SRR Categories + Import installer" -ForegroundColor Green
Write-Host "Backup: $BackupRoot"


# =========================================================
# 1) SQL
# =========================================================
Write-Utf8File "database/srr_product_categories_import.sql" @'
USE `srr_auth_local`;


CREATE TABLE IF NOT EXISTS `ProductCategory` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductCategory_name_key` (`name`),
  UNIQUE KEY `ProductCategory_code_key` (`code`),
  KEY `ProductCategory_status_idx` (`status`),
  KEY `ProductCategory_sort_idx` (`sortOrder`, `name`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `ProductImportLog` (
  `id` VARCHAR(64) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `duplicateMode` ENUM('SKIP','UPDATE') NOT NULL DEFAULT 'SKIP',
  `totalRows` INT NOT NULL DEFAULT 0,
  `createdProducts` INT NOT NULL DEFAULT 0,
  `updatedProducts` INT NOT NULL DEFAULT 0,
  `skippedRows` INT NOT NULL DEFAULT 0,
  `invalidRows` INT NOT NULL DEFAULT 0,
  `newCategories` INT NOT NULL DEFAULT 0,
  `createdByUserId` VARCHAR(64) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ProductImportLog_createdAt_idx` (`createdAt`),
  KEY `ProductImportLog_createdByUserId_idx` (`createdByUserId`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


DROP PROCEDURE IF EXISTS `srr_add_product_import_column`;
DELIMITER $$
CREATE PROCEDURE `srr_add_product_import_column`(
  IN p_column VARCHAR(100),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Product'
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `Product` ADD COLUMN `',
      p_column,
      '` ',
      p_definition
    );
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;


CALL `srr_add_product_import_column`('sourceItem', 'VARCHAR(120) NULL');
CALL `srr_add_product_import_column`('sourceSizeMaterial', 'VARCHAR(255) NULL');
CALL `srr_add_product_import_column`('importSource', 'VARCHAR(50) NULL');
CALL `srr_add_product_import_column`('importedAt', 'DATETIME(3) NULL');
DROP PROCEDURE IF EXISTS `srr_add_product_import_column`;


INSERT IGNORE INTO `ProductCategory`
(`name`,`code`,`description`,`status`,`sortOrder`)
VALUES
('O-Ring','O-RING','ซีลยางโอริงสำหรับงานอุตสาหกรรม','ACTIVE',10),
('Oil Seal','OIL-SEAL','ซีลน้ำมันสำหรับเครื่องจักร','ACTIVE',20),
('Mechanical Seal','MECH-SEAL','ซีลสำหรับระบบปั๊มและเครื่องจักร','ACTIVE',30),
('Bearing','BEARING','ตลับลูกปืนและอุปกรณ์ที่เกี่ยวข้อง','ACTIVE',40),
('อะไหล่อื่นๆ','OTHER','สินค้าและอะไหล่ประเภทอื่น','INACTIVE',999);


INSERT IGNORE INTO `ProductCategory`
(`name`,`code`,`description`,`status`,`sortOrder`)
SELECT DISTINCT
  TRIM(`category`) AS `name`,
  UPPER(
    TRIM(BOTH '-' FROM
      REPLACE(
        REPLACE(
          REPLACE(TRIM(`category`), ' ', '-'),
          '/', '-'
        ),
        '--', '-'
      )
    )
  ) AS `code`,
  CONCAT('หมวดหมู่จากสินค้าที่มีอยู่: ', TRIM(`category`)),
  'ACTIVE',
  500
FROM `Product`
WHERE TRIM(COALESCE(`category`, '')) <> '';


SELECT
  c.id,
  c.name,
  c.code,
  c.status,
  COUNT(p.id) AS productCount
FROM ProductCategory c
LEFT JOIN Product p ON p.category = c.name
GROUP BY c.id, c.name, c.code, c.status
ORDER BY c.sortOrder, c.name;
'@


# =========================================================
# 2) Import parser
# =========================================================
Write-Utf8File "lib/products/category-import.mjs" @'
function text(value) {
  return String(value ?? "").trim();
}


function normalizeHeader(value) {
  return text(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[._-]/g, "")
    .replace(/&/g, "AND");
}


function normalizedRowMap(row) {
  const result = new Map();
  if (!row || typeof row !== "object") return result;
  for (const [key, value] of Object.entries(row)) {
    result.set(normalizeHeader(key), value);
  }
  return result;
}


function pick(map, aliases) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (map.has(key)) return map.get(key);
  }
  return "";
}


export function parsePrice(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = raw
    .replace(/,/g, "")
    .replace(/[^0-9.+-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}


export function extractMaterial(sizeMaterial) {
  const value = text(sizeMaterial);
  if (!value) return "";
  const parts = value.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}


export function normalizeImportRow(row, index = 0) {
  const map = normalizedRowMap(row);
  const no = text(pick(map, ["NO", "NO."]));
  const sourceItem = text(pick(map, ["ITEM"]));
  const code = text(pick(map, ["TG_NO", "TG NO", "TGNO"])).toUpperCase();
  const category = text(pick(map, ["TYPE", "CATEGORY"])) || "อื่น ๆ";
  const sizeMaterial = text(
    pick(map, ["SIZE & MAT.", "SIZE & MAT", "SIZE&MAT", "SIZE MAT", "SIZEMAT"])
  );
  const price = parsePrice(pick(map, ["ราคา", "PRICE", "SELL PRICE"]));
  const material = extractMaterial(sizeMaterial);
  const websiteName = [category, sizeMaterial].filter(Boolean).join(" ").trim() || code;
  const allBlank = !no && !sourceItem && !code && !sizeMaterial && category === "อื่น ๆ" && price === 0;


  return {
    sourceRow: index + 2,
    no,
    sourceItem,
    code,
    category,
    sizeMaterial,
    material,
    price,
    websiteName,
    valid: !allBlank && Boolean(code),
    error: allBlank ? "แถวว่าง" : code ? "" : "ไม่มี TG_NO",
  };
}


export function normalizeImportRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => normalizeImportRow(row, index))
    .filter((row) => row.error !== "แถวว่าง");
}
'@


# =========================================================
# 3) Parser tests (written before server wiring)
# =========================================================
Write-Utf8File "tests/category-import.test.mjs" @'
import test from "node:test";
import assert from "node:assert/strict";
import {
  extractMaterial,
  normalizeImportRow,
  normalizeImportRows,
  parsePrice,
} from "../lib/products/category-import.mjs";


test("maps customer G02580V row", () => {
  const row = normalizeImportRow({
    "NO.": 3,
    ITEM: "",
    TG_NO: "G02580V",
    TYPE: "O-Ring",
    "SIZE & MAT.": "3.68*1.78 VK9",
    "ราคา": 1,
  }, 1);
  assert.equal(row.code, "G02580V");
  assert.equal(row.category, "O-Ring");
  assert.equal(row.sizeMaterial, "3.68*1.78 VK9");
  assert.equal(row.material, "VK9");
  assert.equal(row.websiteName, "O-Ring 3.68*1.78 VK9");
  assert.equal(row.price, 1);
  assert.equal(row.valid, true);
});


test("blank TG_NO is invalid", () => {
  const row = normalizeImportRow({ TYPE: "O-Ring", "SIZE & MAT.": "9.5*1.5 VK9d" }, 0);
  assert.equal(row.valid, false);
  assert.equal(row.error, "ไม่มี TG_NO");
});


test("parses decimal and comma price", () => {
  assert.equal(parsePrice("1.90"), 1.9);
  assert.equal(parsePrice("1,250.50 บาท"), 1250.5);
});


test("extracts final material token", () => {
  assert.equal(extractMaterial("7.65*1.78 VK9d"), "VK9d");
});


test("missing TYPE falls back to other category", () => {
  const [row] = normalizeImportRows([{ TG_NO: "ABC001", "SIZE & MAT.": "10*2 NBR" }]);
  assert.equal(row.category, "อื่น ๆ");
  assert.equal(row.material, "NBR");
});
'@


# =========================================================
# 4) Product category DB
# =========================================================
Write-Utf8File "lib/products/product-categories-db.ts" @'
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { srrAdminDb } from "../db/srr-admin-db";


export type ProductCategoryStatus = "ACTIVE" | "INACTIVE";


export type ProductCategory = {
  id: number;
  name: string;
  code: string;
  description: string;
  status: ProductCategoryStatus;
  sortOrder: number;
  productCount: number;
  updatedAt: Date | string;
};


type CategoryRow = RowDataPacket & {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: ProductCategoryStatus;
  sortOrder: number;
  productCount: string | number;
  updatedAt: Date | string;
};


type NameRow = RowDataPacket & {
  id: number;
  name: string;
  code: string;
};


type CountRow = RowDataPacket & { total: string | number };


const clean = (value: unknown) => String(value ?? "").trim();


export function makeCategoryCode(name: string) {
  const base = clean(name)
    .toUpperCase()
    .normalize("NFKC")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "CATEGORY";
}


function mapRow(row: CategoryRow): ProductCategory {
  return {
    id: Number(row.id),
    name: row.name,
    code: row.code,
    description: row.description || "",
    status: row.status,
    sortOrder: Number(row.sortOrder || 0),
    productCount: Number(row.productCount || 0),
    updatedAt: row.updatedAt,
  };
}


export async function listProductCategories(includeInactive = false) {
  const where = includeInactive ? "" : "WHERE c.status = 'ACTIVE'";
  const [rows] = await srrAdminDb.query<CategoryRow[]>(
    `SELECT
       c.id,
       c.name,
       c.code,
       c.description,
       c.status,
       c.sortOrder,
       c.updatedAt,
       COUNT(p.id) AS productCount
     FROM ProductCategory c
     LEFT JOIN Product p
       ON p.category = c.name
     ${where}
     GROUP BY
       c.id, c.name, c.code, c.description,
       c.status, c.sortOrder, c.updatedAt
     ORDER BY c.sortOrder ASC, c.name ASC`
  );
  return rows.map(mapRow);
}


export async function createProductCategory(input: {
  name: string;
  code?: string;
  description?: string;
  status?: ProductCategoryStatus;
}) {
  const name = clean(input.name);
  const code = (clean(input.code) || makeCategoryCode(name)).toUpperCase();
  const description = clean(input.description);
  const status: ProductCategoryStatus = input.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  if (!name) throw new Error("CATEGORY_NAME_REQUIRED");
  if (!code) throw new Error("CATEGORY_CODE_REQUIRED");


  const [result] = await srrAdminDb.execute<ResultSetHeader>(
    `INSERT INTO ProductCategory
       (name, code, description, status, sortOrder, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
    [name, code, description || null, status]
  );
  return Number(result.insertId);
}


export async function updateProductCategory(
  id: number,
  input: {
    name: string;
    code?: string;
    description?: string;
    status?: ProductCategoryStatus;
  }
) {
  const name = clean(input.name);
  const code = (clean(input.code) || makeCategoryCode(name)).toUpperCase();
  const description = clean(input.description);
  const status: ProductCategoryStatus = input.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  if (!name) throw new Error("CATEGORY_NAME_REQUIRED");
  if (!code) throw new Error("CATEGORY_CODE_REQUIRED");


  const connection = await srrAdminDb.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<NameRow[]>(
      `SELECT id, name, code
       FROM ProductCategory
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );
    const current = rows[0];
    if (!current) throw new Error("CATEGORY_NOT_FOUND");


    await connection.execute(
      `UPDATE ProductCategory
       SET name = ?, code = ?, description = ?, status = ?, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [name, code, description || null, status, id]
    );


    if (current.name !== name) {
      await connection.execute(
        `UPDATE Product
         SET category = ?, updatedAt = CURRENT_TIMESTAMP(3)
         WHERE category = ?`,
        [name, current.name]
      );
    }


    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


export async function deleteProductCategory(id: number) {
  const connection = await srrAdminDb.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<NameRow[]>(
      `SELECT id, name, code
       FROM ProductCategory
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );
    const category = rows[0];
    if (!category) throw new Error("CATEGORY_NOT_FOUND");


    const [countRows] = await connection.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM Product WHERE category = ?`,
      [category.name]
    );
    if (Number(countRows[0]?.total || 0) > 0) {
      throw new Error("CATEGORY_HAS_PRODUCTS");
    }


    await connection.execute(`DELETE FROM ProductCategory WHERE id = ?`, [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
'@


# =========================================================
# 5) Public category API
# =========================================================
Write-Utf8File "app/api/product-categories/route.ts" @'
import { NextResponse } from "next/server";
import { listProductCategories } from "../../../lib/products/product-categories-db";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const categories = await listProductCategories(false);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    console.error("List public categories error:", error);
    return NextResponse.json(
      { ok: false, message: "โหลดหมวดหมู่สินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
'@


# =========================================================
# 6) Admin category APIs
# =========================================================
Write-Utf8File "app/api/admin/product-categories/route.ts" @'
import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "../../../../lib/auth/require-admin";
import {
  createProductCategory,
  listProductCategories,
  type ProductCategoryStatus,
} from "../../../../lib/products/product-categories-db";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, message: error.publicMessage },
      { status: error.status }
    );
  }
  return null;
}


function duplicateResponse(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "ER_DUP_ENTRY") {
    return NextResponse.json(
      { ok: false, message: "ชื่อหรือรหัสหมวดหมู่นี้มีอยู่แล้ว" },
      { status: 409 }
    );
  }
  return null;
}


export async function GET() {
  try {
    await requireAdmin();
    const categories = await listProductCategories(true);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("List categories error:", error);
    return NextResponse.json(
      { ok: false, message: "โหลดหมวดหมู่สินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = await createProductCategory({
      name: String(body?.name || "").trim(),
      code: String(body?.code || "").trim(),
      description: String(body?.description || "").trim(),
      status: (body?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as ProductCategoryStatus,
    });
    return NextResponse.json({ ok: true, id, message: "เพิ่มหมวดหมู่เรียบร้อย" }, { status: 201 });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    const duplicate = duplicateResponse(error);
    if (duplicate) return duplicate;
    if (error instanceof Error && error.message === "CATEGORY_NAME_REQUIRED") {
      return NextResponse.json({ ok: false, message: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 });
    }
    console.error("Create category error:", error);
    return NextResponse.json({ ok: false, message: "เพิ่มหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}
'@


Write-Utf8File "app/api/admin/product-categories/[id]/route.ts" @'
import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "../../../../../lib/auth/require-admin";
import {
  deleteProductCategory,
  updateProductCategory,
  type ProductCategoryStatus,
} from "../../../../../lib/products/product-categories-db";


export const runtime = "nodejs";


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, message: error.publicMessage },
      { status: error.status }
    );
  }
  return null;
}


function commonError(error: unknown) {
  const mysqlCode = (error as { code?: string } | null)?.code;
  if (mysqlCode === "ER_DUP_ENTRY") {
    return NextResponse.json(
      { ok: false, message: "ชื่อหรือรหัสหมวดหมู่นี้มีอยู่แล้ว" },
      { status: 409 }
    );
  }
  if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
    return NextResponse.json({ ok: false, message: "ไม่พบหมวดหมู่" }, { status: 404 });
  }
  if (error instanceof Error && error.message === "CATEGORY_HAS_PRODUCTS") {
    return NextResponse.json(
      { ok: false, message: "ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้" },
      { status: 409 }
    );
  }
  return null;
}


type Context = { params: Promise<{ id: string }> };


export async function PUT(request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ ok: false, message: "รหัสหมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    }
    const body = await request.json();
    await updateProductCategory(numericId, {
      name: String(body?.name || "").trim(),
      code: String(body?.code || "").trim(),
      description: String(body?.description || "").trim(),
      status: (body?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as ProductCategoryStatus,
    });
    return NextResponse.json({ ok: true, message: "บันทึกหมวดหมู่เรียบร้อย" });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    const common = commonError(error);
    if (common) return common;
    console.error("Update category error:", error);
    return NextResponse.json({ ok: false, message: "แก้ไขหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}


export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ ok: false, message: "รหัสหมวดหมู่ไม่ถูกต้อง" }, { status: 400 });
    }
    await deleteProductCategory(numericId);
    return NextResponse.json({ ok: true, message: "ลบหมวดหมู่เรียบร้อย" });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    const common = commonError(error);
    if (common) return common;
    console.error("Delete category error:", error);
    return NextResponse.json({ ok: false, message: "ลบหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}
'@


# =========================================================
# 7) Import preview API
# =========================================================
Write-Utf8File "app/api/admin/products/import/preview/route.ts" @'
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";
import { AdminAuthError, requireAdmin } from "../../../../../../lib/auth/require-admin";
import { srrAdminDb } from "../../../../../../lib/db/srr-admin-db";
import { normalizeImportRows } from "../../../../../../lib/products/category-import.mjs";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED = [".xlsx", ".xls", ".csv"];


type ProductRow = RowDataPacket & {
  id: number;
  code: string | null;
  flowProductMasterId: number | null;
};


type CategoryRow = RowDataPacket & { name: string };


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, message: error.publicMessage },
      { status: error.status }
    );
  }
  return null;
}


function extensionOf(name: string) {
  const lower = name.toLowerCase();
  return ALLOWED.find((extension) => lower.endsWith(extension)) || "";
}


export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File)) {
      return NextResponse.json({ ok: false, message: "กรุณาเลือกไฟล์สินค้า" }, { status: 400 });
    }
    if (!extensionOf(value.name)) {
      return NextResponse.json(
        { ok: false, message: "รองรับไฟล์ .xlsx, .xls และ .csv" },
        { status: 400 }
      );
    }
    if (value.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, message: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" },
        { status: 400 }
      );
    }


    const buffer = Buffer.from(await value.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ ok: false, message: "ไม่พบ Worksheet ในไฟล์" }, { status: 400 });
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    if (rawRows.length > 5000) {
      return NextResponse.json(
        { ok: false, message: "รองรับสูงสุด 5,000 แถวต่อครั้ง" },
        { status: 400 }
      );
    }


    const normalized = normalizeImportRows(rawRows);
    const [productRows] = await srrAdminDb.query<ProductRow[]>(
      `SELECT id, code, flowProductMasterId
       FROM Product
       WHERE code IS NOT NULL AND TRIM(code) <> ''`
    );
    const [categoryRows] = await srrAdminDb.query<CategoryRow[]>(
      `SELECT name FROM ProductCategory`
    );


    const existingProducts = new Map(
      productRows.map((row) => [String(row.code || "").trim().toUpperCase(), row])
    );
    const existingCategories = new Set(
      categoryRows.map((row) => String(row.name || "").trim().toLowerCase())
    );
    const seen = new Set<string>();
    const newCategorySet = new Set<string>();


    const rows = normalized.map((row) => {
      let status: "READY" | "EXISTS" | "INVALID" | "DUPLICATE_FILE" = "READY";
      let message = "พร้อมนำเข้า";
      const existing = row.code ? existingProducts.get(row.code.toUpperCase()) : undefined;


      if (!row.valid) {
        status = "INVALID";
        message = row.error || "ข้อมูลไม่ครบ";
      } else if (seen.has(row.code)) {
        status = "DUPLICATE_FILE";
        message = "รหัสซ้ำภายในไฟล์เดียวกัน";
      } else if (existing) {
        status = "EXISTS";
        message = existing.flowProductMasterId
          ? "มีอยู่แล้วและเชื่อม FlowAccount"
          : "มีรหัสนี้อยู่แล้ว";
      }


      if (row.code) seen.add(row.code);
      const newCategory = row.valid && !existingCategories.has(row.category.toLowerCase());
      if (newCategory) newCategorySet.add(row.category);


      return {
        ...row,
        status,
        message,
        existingProductId: existing ? Number(existing.id) : null,
        linkedToFlow: Boolean(existing?.flowProductMasterId),
        newCategory,
      };
    });


    const summary = {
      total: rows.length,
      ready: rows.filter((row) => row.status === "READY").length,
      existing: rows.filter((row) => row.status === "EXISTS").length,
      invalid: rows.filter((row) => row.status === "INVALID").length,
      duplicateFile: rows.filter((row) => row.status === "DUPLICATE_FILE").length,
    };


    return NextResponse.json({
      ok: true,
      fileName: value.name,
      sheetName: firstSheetName,
      summary,
      newCategories: Array.from(newCategorySet).sort((a, b) => a.localeCompare(b, "th")),
      rows,
    });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("Import preview error:", error);
    return NextResponse.json(
      { ok: false, message: "อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบหัวตารางและรูปแบบไฟล์" },
      { status: 500 }
    );
  }
}
'@


# =========================================================
# 8) Import commit API
# =========================================================
Write-Utf8File "app/api/admin/products/import/commit/route.ts" @'
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { AdminAuthError, requireAdmin } from "../../../../../../lib/auth/require-admin";
import { srrAdminDb } from "../../../../../../lib/db/srr-admin-db";
import { makeCategoryCode } from "../../../../../../lib/products/product-categories-db";


export const runtime = "nodejs";


const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};


type ExistingProductRow = RowDataPacket & {
  id: number;
  code: string | null;
  flowProductMasterId: number | null;
};


type CategoryExistsRow = RowDataPacket & { id: number };


type CommitRow = {
  code?: unknown;
  category?: unknown;
  websiteName?: unknown;
  sizeMaterial?: unknown;
  material?: unknown;
  sourceItem?: unknown;
  price?: unknown;
  valid?: unknown;
};


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, message: error.publicMessage },
      { status: error.status }
    );
  }
  return null;
}


export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const duplicateMode = body?.duplicateMode === "UPDATE" ? "UPDATE" : "SKIP";
    const fileName = text(body?.fileName) || "customer-products";
    const inputRows: CommitRow[] = Array.isArray(body?.rows) ? body.rows.slice(0, 5000) : [];


    if (!inputRows.length) {
      return NextResponse.json({ ok: false, message: "ไม่มีรายการสำหรับนำเข้า" }, { status: 400 });
    }


    const rows = inputRows.map((row) => {
      const code = text(row.code).toUpperCase();
      const category = text(row.category) || "อื่น ๆ";
      const sizeMaterial = text(row.sizeMaterial);
      const material = text(row.material);
      const websiteName = text(row.websiteName) || [category, sizeMaterial].filter(Boolean).join(" ") || code;
      return {
        code,
        category,
        sizeMaterial,
        material,
        websiteName,
        sourceItem: text(row.sourceItem),
        price: numberValue(row.price),
        valid: Boolean(row.valid) && Boolean(code),
      };
    });


    const connection = await srrAdminDb.getConnection();
    let createdProducts = 0;
    let updatedProducts = 0;
    let skippedRows = 0;
    let invalidRows = 0;
    let newCategories = 0;


    try {
      await connection.beginTransaction();


      const [existingRows] = await connection.query<ExistingProductRow[]>(
        `SELECT id, code, flowProductMasterId
         FROM Product
         WHERE code IS NOT NULL AND TRIM(code) <> ''
         FOR UPDATE`
      );
      const existingByCode = new Map(
        existingRows.map((row) => [String(row.code || "").trim().toUpperCase(), row])
      );


      const validCategoryNames = Array.from(
        new Set(rows.filter((row) => row.valid).map((row) => row.category))
      );


      for (const categoryName of validCategoryNames) {
        const [categoryExists] = await connection.query<CategoryExistsRow[]>(
          `SELECT id FROM ProductCategory WHERE name = ? LIMIT 1`,
          [categoryName]
        );
        if (categoryExists.length) continue;


        const baseCode = makeCategoryCode(categoryName);
        try {
          const [insertResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO ProductCategory
               (name, code, description, status, sortOrder, createdAt, updatedAt)
             VALUES (?, ?, ?, 'ACTIVE', 500, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
            [categoryName, baseCode, `สร้างอัตโนมัติจากไฟล์ ${fileName}`]
          );
          if (Number(insertResult.affectedRows || 0) > 0) newCategories += 1;
        } catch (error) {
          if ((error as { code?: string } | null)?.code !== "ER_DUP_ENTRY") throw error;
          const fallbackCode = `${baseCode}-${randomUUID().slice(0, 6).toUpperCase()}`;
          const [insertResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO ProductCategory
               (name, code, description, status, sortOrder, createdAt, updatedAt)
             VALUES (?, ?, ?, 'ACTIVE', 500, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
            [categoryName, fallbackCode, `สร้างอัตโนมัติจากไฟล์ ${fileName}`]
          );
          if (Number(insertResult.affectedRows || 0) > 0) newCategories += 1;
        }
      }


      const seenCodes = new Set<string>();


      for (const row of rows) {
        if (!row.valid) {
          invalidRows += 1;
          continue;
        }
        if (seenCodes.has(row.code)) {
          skippedRows += 1;
          continue;
        }
        seenCodes.add(row.code);


        const existing = existingByCode.get(row.code);
        if (existing) {
          if (duplicateMode === "SKIP") {
            skippedRows += 1;
            continue;
          }


          await connection.execute(
            `UPDATE Product
             SET websiteName = ?,
                 websiteDescription = CASE
                   WHEN ? <> '' THEN ?
                   ELSE websiteDescription
                 END,
                 category = ?,
                 material = ?,
                 sourceItem = ?,
                 sourceSizeMaterial = ?,
                 importSource = 'CUSTOMER_FILE',
                 importedAt = CURRENT_TIMESTAMP(3),
                 sellPrice = CASE
                   WHEN flowProductMasterId IS NULL THEN ?
                   ELSE sellPrice
                 END,
                 updatedAt = CURRENT_TIMESTAMP(3)
             WHERE id = ?`,
            [
              row.websiteName,
              row.sizeMaterial,
              row.sizeMaterial,
              row.category,
              row.material,
              row.sourceItem || null,
              row.sizeMaterial || null,
              row.price,
              existing.id,
            ]
          );
          updatedProducts += 1;
          continue;
        }


        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO Product (
             code,
             websiteName,
             websiteDescription,
             category,
             material,
             active,
             unitName,
             sellPrice,
             stock,
             stockSource,
             sourceItem,
             sourceSizeMaterial,
             importSource,
             importedAt,
             createdAt,
             updatedAt
           ) VALUES (
             ?, ?, ?, ?, ?, 1, 'ชิ้น', ?, 0, 'LOCAL', ?, ?,
             'CUSTOMER_FILE', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
           )`,
          [
            row.code,
            row.websiteName,
            row.sizeMaterial || null,
            row.category,
            row.material,
            row.price,
            row.sourceItem || null,
            row.sizeMaterial || null,
          ]
        );
        createdProducts += Number(result.affectedRows || 0) > 0 ? 1 : 0;
      }


      await connection.execute(
        `INSERT INTO ProductImportLog (
           id, fileName, duplicateMode, totalRows,
           createdProducts, updatedProducts, skippedRows,
           invalidRows, newCategories, createdByUserId, createdAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
        [
          randomUUID(),
          fileName,
          duplicateMode,
          rows.length,
          createdProducts,
          updatedProducts,
          skippedRows,
          invalidRows,
          newCategories,
          admin.id,
        ]
      );


      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }


    return NextResponse.json({
      ok: true,
      summary: {
        total: rows.length,
        createdProducts,
        updatedProducts,
        skippedRows,
        invalidRows,
        newCategories,
      },
      message: `นำเข้าสำเร็จ: เพิ่ม ${createdProducts} รายการ อัปเดต ${updatedProducts} รายการ`,
    });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("Import commit error:", error);
    const mysqlCode = (error as { code?: string } | null)?.code;
    if (mysqlCode === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, message: "พบรหัสสินค้าหรือหมวดหมู่ซ้ำระหว่างบันทึก กรุณา Preview ใหม่" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, message: "นำเข้าสินค้าไม่สำเร็จ และระบบยกเลิกรายการในรอบนี้แล้ว" },
      { status: 500 }
    );
  }
}
'@


# =========================================================
# 9) Replace Product Categories admin page
# =========================================================
Backup-File "app/admin/product-categories/ProductCategoriesPage.tsx"
Write-Utf8File "app/admin/product-categories/ProductCategoriesPage.tsx" @'
"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import "./ProductCategoriesPage.css";


type Category = {
  id: number;
  name: string;
  code: string;
  description: string;
  productCount: number;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
  updatedAt: string;
};


type ImportStatus = "READY" | "EXISTS" | "INVALID" | "DUPLICATE_FILE";


type ImportRow = {
  sourceRow: number;
  no: string;
  sourceItem: string;
  code: string;
  category: string;
  sizeMaterial: string;
  material: string;
  price: number;
  websiteName: string;
  valid: boolean;
  error: string;
  status: ImportStatus;
  message: string;
  existingProductId: number | null;
  linkedToFlow: boolean;
  newCategory: boolean;
};


type ImportPreview = {
  fileName: string;
  sheetName: string;
  summary: {
    total: number;
    ready: number;
    existing: number;
    invalid: number;
    duplicateFile: number;
  };
  newCategories: string[];
  rows: ImportRow[];
};


function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}


function statusLabel(status: ImportStatus) {
  if (status === "READY") return "พร้อมนำเข้า";
  if (status === "EXISTS") return "มีอยู่แล้ว";
  if (status === "DUPLICATE_FILE") return "ซ้ำในไฟล์";
  return "ไม่นำเข้า";
}


export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [saving, setSaving] = useState(false);


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<"SKIP" | "UPDATE">("SKIP");
  const [importSaving, setImportSaving] = useState(false);


  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/product-categories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {
        throw new Error(data?.message || "โหลดหมวดหมู่ไม่สำเร็จ");
      }
      setCategories(data.categories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดหมวดหมู่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void loadCategories();
  }, []);


  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.code.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" || category.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);


  const totalProducts = categories.reduce((sum, category) => sum + Number(category.productCount || 0), 0);
  const activeCount = categories.filter((category) => category.status === "ACTIVE").length;
  const emptyCount = categories.filter((category) => Number(category.productCount || 0) === 0).length;


  function openCreate() {
    setEditingCategory(null);
    setName("");
    setCode("");
    setDescription("");
    setStatus("ACTIVE");
    setError("");
    setSuccess("");
    setShowModal(true);
  }


  function openEdit(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setCode(category.code);
    setDescription(category.description || "");
    setStatus(category.status);
    setError("");
    setSuccess("");
    setShowModal(true);
  }


  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingCategory(null);
  }


  async function saveCategory() {
    if (!name.trim() || !code.trim()) {
      setError("กรุณากรอกชื่อและรหัสหมวดหมู่");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        editingCategory
          ? `/api/admin/product-categories/${editingCategory.id}`
          : "/api/admin/product-categories",
        {
          method: editingCategory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim(),
            status,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");
      setShowModal(false);
      setEditingCategory(null);
      setSuccess(data?.message || "บันทึกหมวดหมู่เรียบร้อย");
      await loadCategories();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }


  async function deleteCategory(category: Category) {
    if (!window.confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/product-categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "ลบไม่สำเร็จ");
      setSuccess(data?.message || "ลบหมวดหมู่เรียบร้อย");
      await loadCategories();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "ลบไม่สำเร็จ");
    }
  }


  async function previewFile(file: File) {
    setImportLoading(true);
    setError("");
    setSuccess("");
    setImportPreview(null);
    setDuplicateMode("SKIP");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/products/import/preview", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "อ่านไฟล์ไม่สำเร็จ");
      setImportPreview(data as ImportPreview);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "อ่านไฟล์ไม่สำเร็จ");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }


  async function commitImport() {
    if (!importPreview || importSaving) return;
    setImportSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: importPreview.fileName,
          duplicateMode,
          rows: importPreview.rows,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "นำเข้าไม่สำเร็จ");
      setImportPreview(null);
      setSuccess(data?.message || "นำเข้าสินค้าเรียบร้อย");
      await loadCategories();
      window.dispatchEvent(new Event("srr-products-updated"));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setImportSaving(false);
    }
  }


  function exportCategories() {
    const header = ["name", "code", "description", "status", "productCount"];
    const rows = categories.map((category) => [
      category.name,
      category.code,
      category.description,
      category.status,
      String(category.productCount),
    ]);
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "srr-product-categories.csv";
    link.click();
    URL.revokeObjectURL(url);
  }


  return (
    <main className="product-categories-page">
      <div className="product-categories-container">
        <section className="product-categories-header">
          <div>
            <div className="product-categories-breadcrumb">
              จัดการสินค้า <span>/</span> หมวดหมู่สินค้า
            </div>
            <h1>หมวดหมู่สินค้า</h1>
            <p>หมวดหมู่จริงจาก MySQL ใช้ร่วมกับสินค้าและการนำเข้าไฟล์ลูกค้า</p>
          </div>
          <div className="product-categories-header-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void previewFile(file);
              }}
            />
            <button
              type="button"
              className="product-categories-secondary-button"
              disabled={importLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {importLoading ? "กำลังอ่านไฟล์..." : "↓ นำเข้าข้อมูล"}
            </button>
            <button type="button" className="product-categories-primary-button" onClick={openCreate}>
              + เพิ่มหมวดหมู่
            </button>
          </div>
        </section>


        {error && <div className="product-categories-alert error">{error}</div>}
        {success && <div className="product-categories-alert success">{success}</div>}


        <section className="product-categories-summary">
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon blue">▦</div>
            <div><span>หมวดหมู่ทั้งหมด</span><strong>{categories.length}</strong><small>หมวดหมู่</small></div>
          </div>
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon green">✓</div>
            <div><span>หมวดหมู่ที่ใช้งาน</span><strong>{activeCount}</strong><small>หมวดหมู่</small></div>
          </div>
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon yellow">△</div>
            <div><span>สินค้าทั้งหมด</span><strong>{totalProducts}</strong><small>รายการ</small></div>
          </div>
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon red">!</div>
            <div><span>หมวดหมู่ไม่มีสินค้า</span><strong>{emptyCount}</strong><small>หมวดหมู่</small></div>
          </div>
        </section>


        <section className="product-categories-toolbar">
          <div className="product-categories-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อหมวดหมู่, รหัส..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">ทุกสถานะ</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </section>


        <section className="product-categories-table-card">
          <div className="product-categories-table-header">
            <div>
              <h2>รายการหมวดหมู่สินค้า</h2>
              <p>{loading ? "กำลังโหลด..." : `แสดง ${filteredCategories.length} จาก ${categories.length} รายการ`}</p>
            </div>
            <div className="product-categories-table-actions">
              <button type="button" onClick={() => setSearch("")}>↺ ล้างตัวกรอง</button>
              <button type="button" onClick={exportCategories}>↓ ส่งออก CSV</button>
            </div>
          </div>


          <div className="product-categories-table-scroll">
            <table className="product-categories-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th><th>รหัส</th><th>รายละเอียด</th><th>จำนวนสินค้า</th>
                  <th>อัปเดตล่าสุด</th><th>สถานะ</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="product-categories-name">
                        <div className="product-categories-name-icon">▦</div>
                        <div><strong>{category.name}</strong><span>Category</span></div>
                      </div>
                    </td>
                    <td><span className="product-categories-code">{category.code}</span></td>
                    <td><span className="product-categories-description">{category.description || "-"}</span></td>
                    <td><strong className="product-categories-count">{category.productCount}</strong><span className="product-categories-unit"> รายการ</span></td>
                    <td>{formatDate(category.updatedAt)}</td>
                    <td>
                      <span className={`product-categories-status ${category.status === "ACTIVE" ? "active" : "inactive"}`}>
                        <i />{category.status === "ACTIVE" ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td>
                      <div className="product-categories-row-actions">
                        <button type="button" onClick={() => openEdit(category)}>แก้ไข</button>
                        <button type="button" className="delete" onClick={() => void deleteCategory(category)}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredCategories.length === 0 && (
                  <tr><td colSpan={7}><div className="product-categories-empty"><strong>ไม่พบหมวดหมู่สินค้า</strong><span>ลองเปลี่ยนคำค้นหาหรือเพิ่มหมวดหมู่ใหม่</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="product-categories-footer">
            <span>แสดง {filteredCategories.length} รายการ</span>
            <div className="product-categories-pagination"><button disabled>‹</button><button className="current">1</button><button disabled>›</button></div>
          </div>
        </section>
      </div>


      {showModal && (
        <div className="product-categories-modal-overlay" onMouseDown={closeModal}>
          <div className="product-categories-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="product-categories-modal-header">
              <div><h2>{editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2><p>ข้อมูลนี้จะบันทึกลง MySQL</p></div>
              <button type="button" className="product-categories-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="product-categories-form">
              <label>ชื่อหมวดหมู่ *<input value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น O-Ring" /></label>
              <label>รหัสหมวดหมู่ *<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="เช่น O-RING" /></label>
              <label>รายละเอียด<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="รายละเอียดหมวดหมู่" rows={4} /></label>
              <label>สถานะ<select value={status} onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}><option value="ACTIVE">ใช้งาน</option><option value="INACTIVE">ปิดใช้งาน</option></select></label>
            </div>
            <div className="product-categories-modal-footer">
              <button type="button" className="product-categories-cancel" onClick={closeModal}>ยกเลิก</button>
              <button type="button" className="product-categories-save" disabled={saving} onClick={() => void saveCategory()}>{saving ? "กำลังบันทึก..." : editingCategory ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}</button>
            </div>
          </div>
        </div>
      )}


      {importPreview && (
        <div className="product-categories-modal-overlay" onMouseDown={() => !importSaving && setImportPreview(null)}>
          <div className="product-categories-modal product-categories-import-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="product-categories-modal-header">
              <div>
                <h2>Preview นำเข้าสินค้า</h2>
                <p>{importPreview.fileName} · Sheet: {importPreview.sheetName}</p>
              </div>
              <button type="button" className="product-categories-modal-close" disabled={importSaving} onClick={() => setImportPreview(null)}>×</button>
            </div>


            <div className="product-categories-import-body">
              <div className="product-categories-import-summary">
                <div><span>ทั้งหมด</span><strong>{importPreview.summary.total}</strong></div>
                <div><span>พร้อมเพิ่ม</span><strong>{importPreview.summary.ready}</strong></div>
                <div><span>มีอยู่แล้ว</span><strong>{importPreview.summary.existing}</strong></div>
                <div><span>ไม่มี TG_NO</span><strong>{importPreview.summary.invalid}</strong></div>
                <div><span>ซ้ำในไฟล์</span><strong>{importPreview.summary.duplicateFile}</strong></div>
              </div>


              {importPreview.newCategories.length > 0 && (
                <div className="product-categories-import-new-categories">
                  <strong>หมวดหมู่ใหม่ที่จะสร้างอัตโนมัติ</strong>
                  <div>{importPreview.newCategories.map((item) => <span key={item}>+ {item}</span>)}</div>
                </div>
              )}


              <div className="product-categories-import-options">
                <div>
                  <strong>เมื่อ TG_NO มีอยู่ในระบบแล้ว</strong>
                  <small>Flow-linked product จะไม่ถูกไฟล์ Import ทับราคาจาก FlowAccount</small>
                </div>
                <select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value as "SKIP" | "UPDATE")}>
                  <option value="SKIP">ข้ามรายการเดิม (แนะนำ)</option>
                  <option value="UPDATE">อัปเดตข้อมูลเว็บ/ราคา Local</option>
                </select>
              </div>


              <div className="product-categories-import-table-wrap">
                <table className="product-categories-import-table">
                  <thead><tr><th>แถว</th><th>TG_NO</th><th>TYPE</th><th>SIZE &amp; MAT.</th><th>วัสดุ</th><th>ราคา</th><th>สถานะ</th></tr></thead>
                  <tbody>
                    {importPreview.rows.slice(0, 300).map((row, index) => (
                      <tr key={`${row.sourceRow}-${row.code}-${index}`}>
                        <td>{row.sourceRow}</td>
                        <td><strong>{row.code || "-"}</strong></td>
                        <td>{row.category}</td>
                        <td>{row.sizeMaterial || "-"}</td>
                        <td>{row.material || "-"}</td>
                        <td>{row.price.toLocaleString("th-TH", { maximumFractionDigits: 4 })}</td>
                        <td><span className={`product-categories-import-status ${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span><small>{row.message}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.rows.length > 300 && <p className="product-categories-import-note">แสดง Preview 300 แถวแรก แต่ตอนบันทึกจะประมวลผลครบ {importPreview.rows.length} แถว</p>}
              <p className="product-categories-import-note">แถวที่ TG_NO ว่างจะไม่ถูกนำเข้า เพื่อให้รหัสสินค้าใช้จับคู่ FlowAccount ได้ถูกต้องในอนาคต</p>
            </div>


            <div className="product-categories-modal-footer">
              <button type="button" className="product-categories-cancel" disabled={importSaving} onClick={() => setImportPreview(null)}>ยกเลิก</button>
              <button type="button" className="product-categories-save" disabled={importSaving || importPreview.summary.ready + importPreview.summary.existing === 0} onClick={() => void commitImport()}>
                {importSaving ? "กำลังนำเข้า..." : `นำเข้า ${importPreview.summary.ready + (duplicateMode === "UPDATE" ? importPreview.summary.existing : 0)} รายการ`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
'@


# =========================================================
# 10) Append import CSS to existing category CSS
# =========================================================
$categoryCssRelative = "app/admin/product-categories/ProductCategoriesPage.css"
$categoryCssPath = Join-Path $Root $categoryCssRelative
if (Test-Path $categoryCssPath) {
  Backup-File $categoryCssRelative
  $categoryCss = Get-Content -Raw -LiteralPath $categoryCssPath
  if ($categoryCss -notmatch "SRR IMPORT EXTENSION 2026-09-02") {
    $categoryCss += @'


/* =========================================================
   SRR IMPORT EXTENSION 2026-09-02
   ========================================================= */
.product-categories-alert {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 9px;
  font-size: 11px;
  line-height: 1.5;
}
.product-categories-alert.error {
  border: 1px solid #efc4c9;
  background: #fff3f4;
  color: #bd4451;
}
.product-categories-alert.success {
  border: 1px solid #bce3cf;
  background: #effaf4;
  color: #167b59;
}
.product-categories-import-modal {
  width: min(1180px, 96vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}
.product-categories-import-body {
  padding: 18px 20px;
  overflow: auto;
}
.product-categories-import-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.product-categories-import-summary > div {
  padding: 12px;
  border: 1px solid #e2e9f0;
  border-radius: 9px;
  background: #f8fafc;
}
.product-categories-import-summary span,
.product-categories-import-summary strong {
  display: block;
}
.product-categories-import-summary span {
  color: #8193a4;
  font-size: 9px;
}
.product-categories-import-summary strong {
  margin-top: 4px;
  color: #173653;
  font-size: 20px;
}
.product-categories-import-new-categories {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid #d7e9f8;
  border-radius: 9px;
  background: #f4faff;
  color: #315774;
  font-size: 10px;
}
.product-categories-import-new-categories > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.product-categories-import-new-categories span {
  padding: 5px 8px;
  border-radius: 5px;
  background: #e5f4ff;
  color: #1677b8;
}
.product-categories-import-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid #e2e9f0;
  border-radius: 9px;
}
.product-categories-import-options strong,
.product-categories-import-options small {
  display: block;
}
.product-categories-import-options strong {
  color: #29445f;
  font-size: 10px;
}
.product-categories-import-options small {
  margin-top: 4px;
  color: #8999a8;
  font-size: 9px;
}
.product-categories-import-options select {
  min-width: 245px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #d8e2ec;
  border-radius: 7px;
  background: #fff;
  color: #425d76;
  font-size: 10px;
}
.product-categories-import-table-wrap {
  max-height: 430px;
  overflow: auto;
  border: 1px solid #e1e8ef;
  border-radius: 9px;
}
.product-categories-import-table {
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;
}
.product-categories-import-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px;
  background: #f5f8fb;
  border-bottom: 1px solid #dfe7ef;
  color: #657b91;
  font-size: 9px;
  text-align: left;
}
.product-categories-import-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #edf1f5;
  color: #4f667c;
  font-size: 9px;
  vertical-align: top;
}
.product-categories-import-table td small {
  display: block;
  max-width: 160px;
  margin-top: 4px;
  color: #96a3b0;
  white-space: normal;
}
.product-categories-import-status {
  display: inline-block;
  padding: 4px 7px;
  border-radius: 5px;
  font-size: 8px;
  font-weight: 700;
  white-space: nowrap;
}
.product-categories-import-status.ready {
  background: #e9f8f1;
  color: #137b57;
}
.product-categories-import-status.exists {
  background: #e9f3ff;
  color: #176fb9;
}
.product-categories-import-status.invalid {
  background: #fff0f1;
  color: #c24955;
}
.product-categories-import-status.duplicate_file {
  background: #fff5df;
  color: #a86d06;
}
.product-categories-import-note {
  margin: 10px 0 0;
  color: #8495a5;
  font-size: 9px;
  line-height: 1.5;
}
@media (max-width: 850px) {
  .product-categories-import-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  .product-categories-import-options {
    align-items: stretch;
    flex-direction: column;
  }
  .product-categories-import-options select {
    width: 100%;
  }
}
'@
    [System.IO.File]::WriteAllText($categoryCssPath, $categoryCss, [System.Text.UTF8Encoding]::new($false))
    Write-Host "PATCH  $categoryCssRelative" -ForegroundColor Yellow
  }
} else {
  Write-Host "WARN: ไม่พบ $categoryCssRelative" -ForegroundColor Yellow
}


# =========================================================
# 11) Patch product create category dropdown -> MySQL API
# =========================================================
$productCreateRelative = "app/admin/products/new/page.tsx"
$productCreatePath = Join-Path $Root $productCreateRelative
if (Test-Path $productCreatePath) {
  $original = Get-Content -Raw -LiteralPath $productCreatePath
  if ($original -notmatch "/api/product-categories") {
    $candidate = $original
    $candidate = $candidate.Replace(
      'import { useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";',
      'import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";'
    )
    $candidate = [regex]::Replace(
      $candidate,
      '(?s)const categories\s*=\s*\[.*?\];\s*(?=const units)',
      'type CategoryOption = { id: number; name: string; code: string };' + [Environment]::NewLine,
      1
    )
    $productCreateState = @'
  const router = useRouter();
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);


  useEffect(() => {
    let cancelled = false;
    async function loadCategoryOptions() {
      try {
        const response = await fetch("/api/product-categories", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) return;
        if (!cancelled) setCategoryOptions(data.categories);
      } catch (loadError) {
        console.error("Load category options error:", loadError);
      }
    }
    void loadCategoryOptions();
    return () => { cancelled = true; };
  }, []);
'@
    $candidate = $candidate.Replace('  const router = useRouter();', $productCreateState)
    $candidate = [regex]::Replace(
      $candidate,
      '\{categories\.map\(\s*\(x\)\s*=>\s*<option\s+key=\{x\}>\{x\}</option>\s*\)\}',
      '{categoryOptions.map((x)=><option key={x.id} value={x.name}>{x.name}</option>)}'
    )


    if ($candidate -match 'categoryOptions\.map' -and $candidate -match '/api/product-categories') {
      Backup-File $productCreateRelative
      [System.IO.File]::WriteAllText($productCreatePath, $candidate, [System.Text.UTF8Encoding]::new($false))
      Write-Host "PATCH  $productCreateRelative -> SQL categories" -ForegroundColor Yellow
    } else {
      Write-Host "WARN: รูปแบบหน้าเพิ่มสินค้าไม่ตรงแพตเทิร์น จึงไม่แก้ไฟล์เพื่อป้องกัน Build พัง" -ForegroundColor Yellow
      Write-Utf8File "PATCH-PRODUCT-CREATE-MANUAL.txt" @'
หน้าเพิ่มสินค้าของคุณมีรูปแบบต่างจากชุดล่าสุด จึงไม่ได้แก้อัตโนมัติ
ให้ dropdown หมวดหมู่เรียก GET /api/product-categories และ map category.name
ถ้าต้องการให้ ChatGPT แก้ทั้งไฟล์ ให้ส่ง app/admin/products/new/page.tsx ตัวปัจจุบันมา
'@
    }
  }
} else {
  Write-Host "WARN: ไม่พบ $productCreateRelative" -ForegroundColor Yellow
}


# =========================================================
# 12) Safe patch Products page categories -> MySQL API
# =========================================================
$productPageCandidates = @(
  "app/products/page.tsx",
  "app/products/ProductsPage.tsx"
)
$productPageRelative = $null
foreach ($item in $productPageCandidates) {
  $path = Join-Path $Root $item
  if (Test-Path $path) {
    $content = Get-Content -Raw -LiteralPath $path
    if ($content -match '/api/products') {
      $productPageRelative = $item
      break
    }
  }
}


if ($productPageRelative) {
  $productPagePath = Join-Path $Root $productPageRelative
  $original = Get-Content -Raw -LiteralPath $productPagePath
  if ($original -notmatch '/api/product-categories') {
    $candidate = $original
    $candidate = $candidate.Replace('categories.map(', 'displayCategories.map(')
    $candidate = $candidate.Replace('sideCategories.map(', 'displaySideCategories.map(')
    $liveCategoryType = @'


type LiveCategory = {
  id: number;
  name: string;
  code: string;
  description: string;
  productCount: number;
};


'@
    $candidate = $candidate.Replace('export default function ProductsPage() {', $liveCategoryType + 'export default function ProductsPage() {')
    $productCategoryState = @'
export default function ProductsPage() {
  const [liveCategories, setLiveCategories] = useState<LiveCategory[]>([]);


  useEffect(() => {
    let cancelled = false;
    async function loadLiveCategories() {
      try {
        const response = await fetch("/api/product-categories", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) return;
        if (!cancelled) setLiveCategories(data.categories);
      } catch (loadError) {
        console.error("Load product categories error:", loadError);
      }
    }
    void loadLiveCategories();
    return () => { cancelled = true; };
  }, []);


  const displayCategories = liveCategories.length
    ? liveCategories.map((item) => ({
        name: item.name,
        thai: item.description || "หมวดหมู่สินค้า",
        icon: "▦",
      }))
    : categories;


  const displaySideCategories = liveCategories.length
    ? liveCategories.map((item) => item.name)
    : sideCategories;
'@
    $candidate = $candidate.Replace('export default function ProductsPage() {', $productCategoryState)


    if ($candidate -match 'displayCategories\.map' -and $candidate -match 'displaySideCategories\.map' -and $candidate -match '/api/product-categories') {
      Backup-File $productPageRelative
      [System.IO.File]::WriteAllText($productPagePath, $candidate, [System.Text.UTF8Encoding]::new($false))
      Write-Host "PATCH  $productPageRelative -> SQL categories" -ForegroundColor Yellow
    } else {
      Write-Host "WARN: ไม่แก้หน้า Products อัตโนมัติ เพราะแพตเทิร์นไม่ตรง" -ForegroundColor Yellow
    }
  }
}


# =========================================================
# 13) Safe patch Home categories -> MySQL API (only live-product version)
# =========================================================
$homeRelative = "components/home/HomePage.tsx"
$homePath = Join-Path $Root $homeRelative
if (Test-Path $homePath) {
  $original = Get-Content -Raw -LiteralPath $homePath
  if ($original -match '/api/products' -and $original -notmatch '/api/product-categories') {
    $candidate = $original
    $candidate = $candidate.Replace('categories.map(', 'displayCategories.map(')
    $candidate = $candidate.Replace('sideCategories.map(', 'displaySideCategories.map(')
    $homeType = @'


type LiveHomeCategory = {
  id: number;
  name: string;
  code: string;
  description: string;
};


'@
    $candidate = $candidate.Replace('export default function HomePage() {', $homeType + 'export default function HomePage() {')
    $homeState = @'
export default function HomePage() {
  const [liveCategories, setLiveCategories] = useState<LiveHomeCategory[]>([]);


  useEffect(() => {
    let cancelled = false;
    async function loadLiveCategories() {
      try {
        const response = await fetch("/api/product-categories", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) return;
        if (!cancelled) setLiveCategories(data.categories);
      } catch (loadError) {
        console.error("Load home categories error:", loadError);
      }
    }
    void loadLiveCategories();
    return () => { cancelled = true; };
  }, []);


  const displayCategories = liveCategories.length
    ? liveCategories.map((item) => ({
        name: item.name,
        thai: item.description || "หมวดหมู่สินค้า",
        icon: "▦",
      }))
    : categories;


  const displaySideCategories = liveCategories.length
    ? liveCategories.map((item) => item.name)
    : sideCategories;
'@
    $candidate = $candidate.Replace('export default function HomePage() {', $homeState)
    if ($candidate -match 'displayCategories\.map' -and $candidate -match 'displaySideCategories\.map') {
      Backup-File $homeRelative
      [System.IO.File]::WriteAllText($homePath, $candidate, [System.Text.UTF8Encoding]::new($false))
      Write-Host "PATCH  $homeRelative -> SQL categories" -ForegroundColor Yellow
    } else {
      Write-Host "WARN: ไม่แก้ Home categories อัตโนมัติ เพราะแพตเทิร์นไม่ตรง" -ForegroundColor Yellow
    }
  }
}


# =========================================================
# 14) README
# =========================================================
Write-Utf8File "README-CATEGORIES-IMPORT-TH.txt" @'
SRR AND SUPPLY - PRODUCT CATEGORIES + CUSTOMER FILE IMPORT
==========================================================


สิ่งที่ชุดนี้ทำ
1. หมวดหมู่สินค้าเก็บใน MySQL จริง (ProductCategory)
2. เพิ่ม / แก้ไข / ลบหมวดหมู่จาก Admin
3. จำนวนสินค้าในหมวดนับจาก Product จริง
4. ปุ่มนำเข้ารองรับ .xlsx / .xls / .csv
5. รูปแบบไฟล์ลูกค้า:
   NO. | ITEM | TG_NO | TYPE | SIZE & MAT. | ราคา
6. TG_NO -> Product.code
7. TYPE -> Product.category และสร้างหมวดใหม่อัตโนมัติถ้ายังไม่มี
8. SIZE & MAT. -> ชื่อสินค้า + วัสดุ
9. ราคา -> sellPrice สำหรับสินค้า Local
10. TG_NO ว่าง -> ไม่นำเข้า
11. รหัสซ้ำ -> ค่าเริ่มต้นข้าม หรือเลือกอัปเดตได้
12. สินค้าที่เชื่อม FlowAccount แล้ว จะไม่ถูก Import ทับ sellPrice จาก Flow
13. Import ไม่แตะ flowProductMasterId และ Flow fields


ตัวอย่างจากไฟล์ลูกค้า
G02580V | O-Ring | 3.68*1.78 VK9 | 1
=>
code        = G02580V
websiteName = O-Ring 3.68*1.78 VK9
category    = O-Ring
material    = VK9
sellPrice   = 1


หลังได้ FlowAccount API
ถ้า FlowAccount มี code=G02580V ระบบ Sync เดิมจะจับคู่ด้วย code
แล้วบันทึก flowProductMasterId ให้สินค้าตัวเดิม ไม่สร้างซ้ำ


ขั้นตอนหลัง Installer
A) เปิด HeidiSQL แล้วรัน:
   database/srr_product_categories_import.sql


B) ถ้า Installer จบด้วย Build ผ่าน ให้เปิด:
   npm run dev


C) เปิด:
   http://localhost:3000/admin/product-categories


D) กด นำเข้าข้อมูล แล้วเลือกไฟล์ Excel/CSV ของลูกค้า


สำคัญ
- อย่ารัน srr_flowaccount_product_stock.sql ตัวเก่าซ้ำ เพราะไฟล์เก่ามี Demo Product 8 ตัว
- Installer สร้าง backup ไฟล์ที่แก้ไว้ในโฟลเดอร์ _backup_categories_import_...
- ถ้าแพตช์หน้าเพิ่มสินค้า/Products/Home ไม่ตรงกับไฟล์รุ่นปัจจุบัน Installer จะข้ามแทนการเขียนไฟล์เสี่ยง
'@


# =========================================================
# 15) Dependency + tests + build
# =========================================================
Write-Host "Installing xlsx..." -ForegroundColor Green
& npm install xlsx --save
if ($LASTEXITCODE -ne 0) { throw "npm install xlsx failed" }


Write-Host "Running import parser tests..." -ForegroundColor Green
& node --test tests/category-import.test.mjs
if ($LASTEXITCODE -ne 0) { throw "category import tests failed" }


Write-Host "Running Next.js production build..." -ForegroundColor Green
& npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build ยังมี error กรุณาแคป error ส่งมาได้ แต่ไฟล์ backup อยู่ที่ $BackupRoot" -ForegroundColor Red
  exit 1
}


Write-Host "" 
Write-Host "============================================================" -ForegroundColor Green
Write-Host "INSTALL FILES + TEST + BUILD COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "ขั้นต่อไป: เปิด HeidiSQL แล้วรัน database/srr_product_categories_import.sql" -ForegroundColor Yellow
Write-Host "จากนั้น: npm run dev" -ForegroundColor Yellow
Write-Host "เปิด: http://localhost:3000/admin/product-categories" -ForegroundColor Yellow
Write-Host "Backup: $BackupRoot"
# SRR AND SUPPLY - Customer Product Import V3
# รองรับไฟล์ลูกค้าหลาย Sheet และหลายชื่อคอลัมน์
# TG_NO / SOG / SOG_NO / SOG_NP / TYPE / SIZE / SIZE & MAT. / MAT / MATERIAL / ราคา / STOCK
# Run from PROJECT ROOT:
# powershell -ExecutionPolicy Bypass -File .\install_srr_import_v3.ps1


$ErrorActionPreference = "Stop"
$Root = (Get-Location).Path


if (-not (Test-Path (Join-Path $Root "package.json"))) {
  throw "กรุณาวางไฟล์นี้ที่ ROOT ของ srr-and-supply-ecommerce แล้วรันใหม่"
}


$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path (Split-Path $Root -Parent) "_backup_srr_import_v3_$stamp"
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
  Copy-Item -LiteralPath $src -Destination $dst -Force
  Write-Host "BACKUP $RelativePath" -ForegroundColor DarkGray
}


function Write-Utf8File([string]$RelativePath, [string]$Content) {
  $target = Join-Path $Root $RelativePath
  Ensure-Parent $target
  [System.IO.File]::WriteAllText(
    $target,
    $Content,
    [System.Text.UTF8Encoding]::new($false)
  )
  Write-Host "WRITE  $RelativePath" -ForegroundColor Cyan
}


function Replace-Required([string]$Text, [string]$Old, [string]$New, [string]$Label) {
  $normalizedText = $Text.Replace("`r`n", "`n")
  $normalizedOld = $Old.Replace("`r`n", "`n")
  $normalizedNew = $New.Replace("`r`n", "`n")
  if (-not $normalizedText.Contains($normalizedOld)) {
    throw "Patch ไม่สำเร็จ: ไม่พบ $Label ในไฟล์ปัจจุบัน"
  }
  return $normalizedText.Replace($normalizedOld, $normalizedNew)
}


Write-Host "SRR Customer Product Import V3" -ForegroundColor Green
Write-Host "Backup จะอยู่ข้างนอก project: $BackupRoot" -ForegroundColor Yellow


# =========================================================
# 1) SQL migration
# =========================================================
Write-Utf8File "database/srr_product_import_v3.sql" @'
USE `srr_auth_local`;


CREATE TABLE IF NOT EXISTS `ProductCategory` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductCategory_name_key` (`name`),
  UNIQUE KEY `ProductCategory_code_key` (`code`),
  KEY `ProductCategory_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP PROCEDURE IF EXISTS `srr_add_import_v3_column`;
DELIMITER $$
CREATE PROCEDURE `srr_add_import_v3_column`(
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
      'ALTER TABLE `Product` ADD COLUMN `', p_column, '` ', p_definition
    );
    PREPARE stmt FROM @sql_text;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;


CALL `srr_add_import_v3_column`('sourceTgNo', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSog', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSogNp', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceCodeField', 'VARCHAR(30) NULL');
CALL `srr_add_import_v3_column`('sourceSheet', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSize', 'VARCHAR(255) NULL');
CALL `srr_add_import_v3_column`('sourceMat', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourcePrice', 'DECIMAL(15,4) NULL');
CALL `srr_add_import_v3_column`('sourceStock', 'DECIMAL(15,3) NULL');
CALL `srr_add_import_v3_column`('sourceItem', 'VARCHAR(120) NULL');
CALL `srr_add_import_v3_column`('sourceSizeMaterial', 'VARCHAR(255) NULL');
CALL `srr_add_import_v3_column`('importSource', 'VARCHAR(50) NULL');
CALL `srr_add_import_v3_column`('importedAt', 'DATETIME(3) NULL');
DROP PROCEDURE IF EXISTS `srr_add_import_v3_column`;


INSERT IGNORE INTO `ProductCategory`
(`name`, `code`, `description`, `status`, `sortOrder`)
SELECT DISTINCT
  TRIM(`category`),
  UPPER(TRIM(BOTH '-' FROM REPLACE(REPLACE(TRIM(`category`), ' ', '-'), '/', '-'))),
  CONCAT('หมวดหมู่จากสินค้าที่มีอยู่: ', TRIM(`category`)),
  'ACTIVE',
  500
FROM `Product`
WHERE TRIM(COALESCE(`category`, '')) <> '';


SELECT
  id, code, websiteName, category, material, sellPrice, stock,
  sourceTgNo, sourceSog, sourceSogNp, sourceCodeField, sourceSheet
FROM Product
ORDER BY id DESC
LIMIT 20;
'@




# =========================================================
# 2) TDD RED -> GREEN: parser สำหรับ workbook ลูกค้า
# =========================================================
Backup-File "lib/products/customer-import-v3.mjs"
$ParserPath = Join-Path $Root "lib/products/customer-import-v3.mjs"
if (Test-Path $ParserPath) { Remove-Item -LiteralPath $ParserPath -Force }


Write-Utf8File "tests/customer-import-v3.test.mjs" @'
import test from "node:test";
import assert from "node:assert/strict";
import { parseWorkbookSheet, parseNumber } from "../lib/products/customer-import-v3.mjs";


test("TC NBR ใช้ SOG เป็นรหัสและอ่าน STOCK", () => {
  const result = parseWorkbookSheet("TC NBR", [
    ["NO", "TYPE", "SIZE", "SOG", "MAT", " STOCK", "ราคา"],
    ["1", "TC", "4*16*6", "111294N", "NBR", "202", "15.07"],
  ]);
  assert.equal(result.rows[0].code, "111294N");
  assert.equal(result.rows[0].codeSource, "SOG");
  assert.equal(result.rows[0].stock, 202);
  assert.equal(result.rows[0].price, 15.07);
  assert.equal(result.rows[0].sizeMaterial, "4*16*6 NBR");
});


test("หา header row หลังชื่อรายงานได้", () => {
  const result = parseWorkbookSheet("TC FPM", [
    ["PRICE LIST TC-FPM"],
    ["ITEM", "SOG", "TYPE", "SIZE", "MAT", "ราคา"],
    ["1", "113615V", "TC", "10*16*4", "FPM", "6.78"],
  ]);
  assert.equal(result.headerRow, 2);
  assert.equal(result.rows[0].code, "113615V");
});


test("VK9 ใช้ TG_NO เป็นรหัส", () => {
  const result = parseWorkbookSheet("VK9", [
    ["NO.", "ITEM", "TG_NO", "TYPE", "SIZE & MAT.", "ราคา"],
    ["3", "", "G02580V", "O-Ring", "3.68*1.78 VK9", "1"],
  ]);
  assert.equal(result.rows[0].code, "G02580V");
  assert.equal(result.rows[0].codeSource, "TG_NO");
  assert.equal(result.rows[0].material, "VK9");
});


test("หัวราคากลายเป็นตัวเลขยังอ่านคอลัมน์ราคาได้", () => {
  const result = parseWorkbookSheet("O-RING FPM", [
    ["NO.", "ITEM", "TG_NO", "TYPE", "SIZE & MAT.", "0.28"],
    ["1", "", "G03112V", "O-Ring", "3*1 VK75", "1.62"],
    ["2", "", "G03110V", "O-Ring", "6*1 VK75", "2.25"],
  ]);
  assert.equal(result.rows[0].price, 1.62);
  assert.equal(result.rows[0].hasPrice, true);
});


test("SOG_NP มาก่อน SOG เมื่อไม่มี TG_NO", () => {
  const result = parseWorkbookSheet("TEST", [
    ["TYPE", "SIZE", "SOG", "SOG_NP", "MAT", "STOCK", "ราคา"],
    ["TC", "10*20*5", "OLD001", "NEW001", "NBR", "4", "9.5"],
  ]);
  assert.equal(result.rows[0].code, "NEW001");
  assert.equal(result.rows[0].codeSource, "SOG_NP");
});


test("ไม่มีรหัสจริงจะ invalid และไม่สร้างรหัสมั่ว", () => {
  const result = parseWorkbookSheet("VK9", [
    ["NO.", "TG_NO", "TYPE", "SIZE & MAT.", "ราคา"],
    ["1", "", "O-Ring", "9.5*1.5 VK9d", ""],
  ]);
  assert.equal(result.rows[0].valid, false);
  assert.equal(result.rows[0].error, "ไม่มีรหัสสินค้า");
});


test("parseNumber รองรับ comma และช่องว่าง", () => {
  assert.equal(parseNumber(" 1,250.50 "), 1250.5);
});
'@


Write-Host "RED: ทดสอบก่อนสร้าง parser (รอบนี้ต้อง FAIL)" -ForegroundColor Magenta
node --test ".\tests\customer-import-v3.test.mjs"
if ($LASTEXITCODE -eq 0) {
  throw "RED test ผ่านทั้งที่ parser ยังไม่มี กรุณาตรวจสอบก่อนทำต่อ"
}
Write-Host "RED ผ่านเงื่อนไข: test ล้มเพราะ parser ยังไม่มี" -ForegroundColor Magenta


Write-Utf8File "lib/products/customer-import-v3.mjs" @'
function text(value) {
  return String(value ?? "").trim();
}


function normalizeHeader(value) {
  return text(value)
    .toUpperCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[._\-/]/g, "")
    .replace(/&/g, "AND");
}


const aliases = {
  no: new Set(["NO", "NUMBER", "ลำดับ"]),
  item: new Set(["ITEM", "ITEMNO", "ITEMNUMBER"]),
  tgNo: new Set(["TGNO", "TGNUMBER"]),
  sogNp: new Set(["SOGNP", "SOGNEW", "SOGNEWPRICE"]),
  sog: new Set(["SOG", "SOGNO", "SOGNUMBER"]),
  type: new Set(["TYPE", "CATEGORY", "หมวด", "หมวดหมู่"]),
  sizeMat: new Set(["SIZEANDMAT", "SIZEANDMATERIAL", "SIZEMAT", "SIZEMATERIAL"]),
  size: new Set(["SIZE", "ขนาด"]),
  mat: new Set(["MAT", "MATERIAL", "วัสดุ"]),
  price: new Set(["ราคา", "PRICE", "SELLPRICE", "UNITPRICE"]),
  stock: new Set(["STOCK", "QTY", "QUANTITY", "คงเหลือ", "สต๊อก", "สต็อก"]),
};


function kindOfHeader(value) {
  const key = normalizeHeader(value);
  for (const [kind, set] of Object.entries(aliases)) {
    if (set.has(key)) return kind;
  }
  return "";
}


export function parseNumber(value) {
  const raw = text(value);
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "").replace(/[^0-9.+-]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}


function looksNumeric(value) {
  const raw = text(value).replace(/\s+/g, "");
  return /^[-+]?\d[\d,]*(?:\.\d+)?$/.test(raw);
}


function headerScore(row) {
  const kinds = row.map(kindOfHeader).filter(Boolean);
  const unique = new Set(kinds);
  let score = unique.size;
  if (unique.has("tgNo") || unique.has("sog") || unique.has("sogNp")) score += 3;
  if (unique.has("type")) score += 2;
  if (unique.has("size") || unique.has("sizeMat")) score += 2;
  return score;
}


function detectHeaderRow(matrix) {
  let bestIndex = -1;
  let bestScore = -1;
  const limit = Math.min(matrix.length, 20);
  for (let index = 0; index < limit; index += 1) {
    const row = Array.isArray(matrix[index]) ? matrix[index] : [];
    const score = headerScore(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestScore >= 4 ? bestIndex : -1;
}


function buildColumnMap(header) {
  const map = {};
  header.forEach((cell, index) => {
    const kind = kindOfHeader(cell);
    if (kind && map[kind] == null) map[kind] = index;
  });
  return map;
}


function detectNumericFallback(matrix, headerIndex, candidateIndex) {
  if (candidateIndex == null || candidateIndex < 0) return -1;
  const sample = matrix.slice(headerIndex + 1, headerIndex + 12);
  let nonEmpty = 0;
  let numeric = 0;
  for (const row of sample) {
    const value = Array.isArray(row) ? row[candidateIndex] : "";
    if (text(value)) nonEmpty += 1;
    if (looksNumeric(value)) numeric += 1;
  }
  return nonEmpty > 0 && numeric / nonEmpty >= 0.6 ? candidateIndex : -1;
}


function extractMaterial(sizeMaterial) {
  const value = text(sizeMaterial);
  if (!value) return "";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "";
  const candidate = parts[parts.length - 1];
  return /[A-Za-zก-๙]/.test(candidate) ? candidate : "";
}


function cell(row, index) {
  return index == null || index < 0 ? "" : text(row[index]);
}


function chooseCode(fields, map) {
  const priority = map.tgNo != null
    ? [["TG_NO", fields.tgNo], ["SOG_NP", fields.sogNp], ["SOG", fields.sog]]
    : map.sogNp != null
      ? [["SOG_NP", fields.sogNp], ["SOG", fields.sog], ["TG_NO", fields.tgNo]]
      : [["SOG", fields.sog], ["TG_NO", fields.tgNo], ["SOG_NP", fields.sogNp]];


  for (const [source, value] of priority) {
    if (text(value)) return { code: text(value).toUpperCase(), codeSource: source };
  }
  return { code: "", codeSource: "" };
}


export function parseWorkbookSheet(sheetName, matrixInput) {
  const matrix = Array.isArray(matrixInput)
    ? matrixInput.map((row) => Array.isArray(row) ? row : [])
    : [];


  const headerIndex = detectHeaderRow(matrix);
  if (headerIndex < 0) {
    return { sheetName, headerRow: 0, mapping: {}, rows: [], warning: "หา header ไม่เจอ" };
  }


  const header = matrix[headerIndex];
  const map = buildColumnMap(header);


  let priceIndex = map.price ?? -1;
  if (priceIndex < 0) {
    const base = map.sizeMat ?? map.mat ?? map.size ?? -1;
    priceIndex = detectNumericFallback(matrix, headerIndex, base >= 0 ? base + 1 : -1);
  }
  const stockIndex = map.stock ?? -1;


  const rows = [];
  for (let rowIndex = headerIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const source = matrix[rowIndex];
    const tgNo = cell(source, map.tgNo);
    const sog = cell(source, map.sog);
    const sogNp = cell(source, map.sogNp);
    const sourceItem = cell(source, map.item);
    const category = cell(source, map.type) || sheetName;
    const size = cell(source, map.size);
    const explicitMat = cell(source, map.mat);
    const combined = cell(source, map.sizeMat);
    const sizeMaterial = combined || [size, explicitMat].filter(Boolean).join(" ").trim();
    const material = explicitMat || extractMaterial(sizeMaterial);
    const priceRaw = cell(source, priceIndex);
    const stockRaw = cell(source, stockIndex);
    const { code, codeSource } = chooseCode({ tgNo, sog, sogNp }, map);
    const no = cell(source, map.no);


    const rowHasAnything = [no, sourceItem, tgNo, sog, sogNp, category, sizeMaterial, priceRaw, stockRaw]
      .some((value) => Boolean(text(value)));
    if (!rowHasAnything) continue;


    rows.push({
      sourceSheet: sheetName,
      sourceRow: rowIndex + 1,
      no,
      sourceItem,
      tgNo,
      sog,
      sogNp,
      code,
      codeSource,
      category,
      size,
      sizeMaterial,
      material,
      price: parseNumber(priceRaw),
      stock: parseNumber(stockRaw),
      hasPrice: Boolean(priceRaw),
      hasStock: Boolean(stockRaw),
      websiteName: [category, sizeMaterial].filter(Boolean).join(" ").trim() || code,
      valid: Boolean(code),
      error: code ? "" : "ไม่มีรหัสสินค้า",
    });
  }


  return {
    sheetName,
    headerRow: headerIndex + 1,
    mapping: {
      code: map.tgNo != null ? "TG_NO" : map.sogNp != null ? "SOG_NP" : map.sog != null ? "SOG" : "",
      category: map.type != null ? text(header[map.type]) : "Sheet name",
      size: map.sizeMat != null
        ? text(header[map.sizeMat])
        : [map.size != null ? text(header[map.size]) : "", map.mat != null ? text(header[map.mat]) : ""].filter(Boolean).join(" + "),
      price: priceIndex >= 0 ? text(header[priceIndex]) || `Column ${priceIndex + 1}` : "",
      stock: stockIndex >= 0 ? text(header[stockIndex]) : "",
    },
    rows,
    warning: "",
  };
}
'@


Write-Host "GREEN: รัน parser tests" -ForegroundColor Green
node --test ".\tests\customer-import-v3.test.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "customer-import-v3 tests ไม่ผ่าน"
}


# =========================================================
# 4) Import preview API - อ่านทุก Sheet
# =========================================================
Backup-File "app/api/admin/products/import/preview/route.ts"
Write-Utf8File "app/api/admin/products/import/preview/route.ts" @'
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";
import { AdminAuthError, requireAdmin } from "../../../../../../lib/auth/require-admin";
import { srrAdminDb } from "../../../../../../lib/db/srr-admin-db";
import { parseWorkbookSheet } from "../../../../../../lib/products/customer-import-v3.mjs";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_ROWS = 25000;
const PREVIEW_ROWS = 1000;
const ALLOWED = [".xlsx", ".xls", ".csv"];


type ProductRow = RowDataPacket & {
  id: number;
  code: string | null;
  flowProductMasterId: number | null;
};
type CategoryRow = RowDataPacket & { name: string };


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ ok: false, message: error.publicMessage }, { status: error.status });
  }
  return null;
}


function allowed(name: string) {
  const lower = name.toLowerCase();
  return ALLOWED.some((ext) => lower.endsWith(ext));
}


export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "กรุณาเลือกไฟล์สินค้า" }, { status: 400 });
    }
    if (!allowed(file.name)) {
      return NextResponse.json({ ok: false, message: "รองรับไฟล์ .xlsx, .xls และ .csv" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, message: "ไฟล์ต้องไม่เกิน 20 MB" }, { status: 400 });
    }


    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const parsedSheets = workbook.SheetNames.map((sheetName) => {
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1, defval: "", raw: false, blankrows: false,
      });
      return parseWorkbookSheet(sheetName, matrix);
    });


    const normalized = parsedSheets.flatMap((sheet) => sheet.rows);
    if (!normalized.length) {
      return NextResponse.json({ ok: false, message: "ไม่พบรายการสินค้าที่อ่านได้จาก Workbook" }, { status: 400 });
    }
    if (normalized.length > MAX_ROWS) {
      return NextResponse.json({ ok: false, message: `พบ ${normalized.length.toLocaleString()} แถว รองรับสูงสุด ${MAX_ROWS.toLocaleString()} แถว` }, { status: 400 });
    }


    const [productRows] = await srrAdminDb.query<ProductRow[]>(
      `SELECT id, code, flowProductMasterId FROM Product WHERE code IS NOT NULL AND TRIM(code) <> ''`
    );
    const [categoryRows] = await srrAdminDb.query<CategoryRow[]>(`SELECT name FROM ProductCategory`);
    const existingProducts = new Map(productRows.map((row) => [String(row.code || "").trim().toUpperCase(), row]));
    const existingCategories = new Set(categoryRows.map((row) => String(row.name || "").trim().toLowerCase()));
    const seen = new Set<string>();
    const newCategorySet = new Set<string>();


    const rows = normalized.map((row) => {
      let status: "READY" | "EXISTS" | "INVALID" | "DUPLICATE_FILE" = "READY";
      let message = "พร้อมนำเข้า";
      const key = String(row.code || "").trim().toUpperCase();
      const existing = key ? existingProducts.get(key) : undefined;


      if (!row.valid) {
        status = "INVALID";
        message = row.error || "ข้อมูลไม่ครบ";
      } else if (seen.has(key)) {
        status = "DUPLICATE_FILE";
        message = "รหัสซ้ำภายใน Workbook";
      } else if (existing) {
        status = "EXISTS";
        message = existing.flowProductMasterId ? "มีอยู่แล้วและเชื่อม FlowAccount" : "มีรหัสนี้อยู่แล้ว";
      }


      if (key) seen.add(key);
      const newCategory = row.valid && !existingCategories.has(String(row.category).trim().toLowerCase());
      if (newCategory) newCategorySet.add(String(row.category).trim());
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
      fileName: file.name,
      sheetName: `${workbook.SheetNames.length} Sheets`,
      summary,
      newCategories: Array.from(newCategorySet).sort((a, b) => a.localeCompare(b, "th")),
      rows: rows.slice(0, PREVIEW_ROWS),
      previewTotal: rows.length,
      previewTruncated: rows.length > PREVIEW_ROWS,
    });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("Import preview V3 error:", error);
    return NextResponse.json({ ok: false, message: "อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบ Workbook" }, { status: 500 });
  }
}
'@


# =========================================================
# 5) Import commit API - อัปโหลด workbook เดิมซ้ำ
# =========================================================
Backup-File "app/api/admin/products/import/commit/route.ts"
Write-Utf8File "app/api/admin/products/import/commit/route.ts" @'
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";
import { AdminAuthError, requireAdmin } from "../../../../../../lib/auth/require-admin";
import { srrAdminDb } from "../../../../../../lib/db/srr-admin-db";
import { makeCategoryCode } from "../../../../../../lib/products/product-categories-db";
import { parseWorkbookSheet } from "../../../../../../lib/products/customer-import-v3.mjs";


export const runtime = "nodejs";
const MAX_ROWS = 25000;


type ExistingProductRow = RowDataPacket & {
  id: number;
  code: string | null;
  flowProductMasterId: number | null;
  stockSource: string | null;
};
type CategoryExistsRow = RowDataPacket & { id: number };


function authResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ ok: false, message: error.publicMessage }, { status: error.status });
  }
  return null;
}


export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const duplicateMode = form.get("duplicateMode") === "UPDATE" ? "UPDATE" : "SKIP";
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "กรุณาเลือกไฟล์สินค้าใหม่อีกครั้ง" }, { status: 400 });
    }


    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const rows = workbook.SheetNames.flatMap((sheetName) => {
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1, defval: "", raw: false, blankrows: false,
      });
      return parseWorkbookSheet(sheetName, matrix).rows;
    });


    if (!rows.length) return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลสินค้า" }, { status: 400 });
    if (rows.length > MAX_ROWS) return NextResponse.json({ ok: false, message: "จำนวนแถวเกิน 25,000 แถว" }, { status: 400 });


    const connection = await srrAdminDb.getConnection();
    let createdProducts = 0;
    let updatedProducts = 0;
    let skippedRows = 0;
    let invalidRows = 0;
    let newCategories = 0;


    try {
      await connection.beginTransaction();
      const [existingRows] = await connection.query<ExistingProductRow[]>(
        `SELECT id, code, flowProductMasterId, stockSource
         FROM Product
         WHERE code IS NOT NULL AND TRIM(code) <> ''
         FOR UPDATE`
      );
      const existingByCode = new Map(
        existingRows.map((row) => [String(row.code || "").trim().toUpperCase(), row])
      );


      const categoryNames = Array.from(new Set(
        rows.filter((row) => row.valid).map((row) => String(row.category).trim()).filter(Boolean)
      ));


      for (const categoryName of categoryNames) {
        const [exists] = await connection.query<CategoryExistsRow[]>(
          `SELECT id FROM ProductCategory WHERE name = ? LIMIT 1`,
          [categoryName]
        );
        if (exists.length) continue;
        const baseCode = makeCategoryCode(categoryName);
        try {
          const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO ProductCategory
               (name, code, description, status, sortOrder, createdAt, updatedAt)
             VALUES (?, ?, ?, 'ACTIVE', 500, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
            [categoryName, baseCode, `สร้างอัตโนมัติจากไฟล์ ${file.name}`]
          );
          if (result.affectedRows) newCategories += 1;
        } catch (error) {
          if ((error as { code?: string })?.code !== "ER_DUP_ENTRY") throw error;
          const fallbackCode = `${baseCode}-${randomUUID().slice(0, 6).toUpperCase()}`;
          const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO ProductCategory
               (name, code, description, status, sortOrder, createdAt, updatedAt)
             VALUES (?, ?, ?, 'ACTIVE', 500, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
            [categoryName, fallbackCode, `สร้างอัตโนมัติจากไฟล์ ${file.name}`]
          );
          if (result.affectedRows) newCategories += 1;
        }
      }


      const seen = new Set<string>();
      for (const row of rows) {
        const code = String(row.code || "").trim().toUpperCase();
        if (!row.valid || !code) { invalidRows += 1; continue; }
        if (seen.has(code)) { skippedRows += 1; continue; }
        seen.add(code);


        const existing = existingByCode.get(code);
        if (existing) {
          if (duplicateMode === "SKIP") { skippedRows += 1; continue; }
          await connection.execute(
            `UPDATE Product
             SET websiteName = ?,
                 websiteDescription = CASE WHEN ? <> '' THEN ? ELSE websiteDescription END,
                 category = ?,
                 material = ?,
                 sourceItem = ?,
                 sourceSizeMaterial = ?,
                 sourceTgNo = ?,
                 sourceSog = ?,
                 sourceSogNp = ?,
                 sourceCodeField = ?,
                 sourceSheet = ?,
                 sourceSize = ?,
                 sourceMat = ?,
                 sourcePrice = CASE WHEN ? = 1 THEN ? ELSE sourcePrice END,
                 sourceStock = CASE WHEN ? = 1 THEN ? ELSE sourceStock END,
                 sellPrice = CASE WHEN ? = 1 AND flowProductMasterId IS NULL THEN ? ELSE sellPrice END,
                 stock = CASE WHEN ? = 1 AND COALESCE(stockSource, 'LOCAL') <> 'FLOWACCOUNT' THEN ? ELSE stock END,
                 importSource = 'CUSTOMER_FILE_V3',
                 importedAt = CURRENT_TIMESTAMP(3),
                 updatedAt = CURRENT_TIMESTAMP(3)
             WHERE id = ?`,
            [
              row.websiteName,
              row.sizeMaterial, row.sizeMaterial,
              row.category,
              row.material,
              row.sourceItem || null,
              row.sizeMaterial || null,
              row.tgNo || null,
              row.sog || null,
              row.sogNp || null,
              row.codeSource || null,
              row.sourceSheet || null,
              row.size || null,
              row.material || null,
              row.hasPrice ? 1 : 0, row.price,
              row.hasStock ? 1 : 0, row.stock,
              row.hasPrice ? 1 : 0, row.price,
              row.hasStock ? 1 : 0, row.stock,
              existing.id,
            ]
          );
          updatedProducts += 1;
          continue;
        }


        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO Product (
             code, websiteName, websiteDescription, category, material, active,
             unitName, sellPrice, stock, stockSource,
             sourceItem, sourceSizeMaterial, sourceTgNo, sourceSog, sourceSogNp,
             sourceCodeField, sourceSheet, sourceSize, sourceMat, sourcePrice, sourceStock,
             importSource, importedAt, createdAt, updatedAt
           ) VALUES (
             ?, ?, ?, ?, ?, 1,
             'ชิ้น', ?, ?, 'LOCAL',
             ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?,
             'CUSTOMER_FILE_V3', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
           )`,
          [
            code,
            row.websiteName,
            row.sizeMaterial || null,
            row.category,
            row.material,
            row.hasPrice ? row.price : 0,
            row.hasStock ? row.stock : 0,
            row.sourceItem || null,
            row.sizeMaterial || null,
            row.tgNo || null,
            row.sog || null,
            row.sogNp || null,
            row.codeSource || null,
            row.sourceSheet || null,
            row.size || null,
            row.material || null,
            row.hasPrice ? row.price : null,
            row.hasStock ? row.stock : null,
          ]
        );
        if (result.affectedRows) createdProducts += 1;
      }


      await connection.execute(
        `INSERT INTO ProductImportLog (
           id, fileName, duplicateMode, totalRows, createdProducts, updatedProducts,
           skippedRows, invalidRows, newCategories, createdByUserId, createdAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
        [randomUUID(), file.name, duplicateMode, rows.length, createdProducts, updatedProducts, skippedRows, invalidRows, newCategories, admin.id]
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
      summary: { total: rows.length, createdProducts, updatedProducts, skippedRows, invalidRows, newCategories },
      message: `นำเข้าสำเร็จ: เพิ่ม ${createdProducts} อัปเดต ${updatedProducts} ข้าม ${skippedRows}`,
    });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("Import commit V3 error:", error);
    return NextResponse.json({ ok: false, message: "นำเข้าสินค้าไม่สำเร็จ ระบบ rollback รอบนี้แล้ว" }, { status: 500 });
  }
}
'@


# =========================================================
# 6) PATCH ProductCategoriesPage.tsx แบบ UTF-8 safe
# =========================================================
$PageRel = "app/admin/product-categories/ProductCategoriesPage.tsx"
$PagePath = Join-Path $Root $PageRel
Backup-File $PageRel
if (-not (Test-Path $PagePath)) { throw "ไม่พบ $PageRel" }
$page = [System.IO.File]::ReadAllText($PagePath, [System.Text.UTF8Encoding]::new($false))


$page = Replace-Required $page '  sourceRow: number;' "  sourceSheet: string;`r`n  sourceRow: number;" "ImportRow sourceSheet"
$page = Replace-Required $page "  sourceItem: string;`n  code: string;`n  category: string;" "  sourceItem: string;`n  code: string;`n  codeSource: string;`n  tgNo: string;`n  sog: string;`n  sogNp: string;`n  category: string;" "ImportRow code source fields"
$page = Replace-Required $page "  material: string;`n  price: number;`n  websiteName: string;" "  material: string;`n  price: number;`n  stock: number;`n  hasPrice: boolean;`n  hasStock: boolean;`n  websiteName: string;" "ImportRow stock fields"


$page = Replace-Required $page '  const [importLoading, setImportLoading] = useState(false);' "  const [importFile, setImportFile] = useState<File | null>(null);`r`n  const [importLoading, setImportLoading] = useState(false);" "importFile state"
$page = Replace-Required $page '    setImportLoading(true);' "    setImportFile(file);`r`n    setImportLoading(true);" "remember selected file"
$page = Replace-Required $page '      setImportPreview(data as ImportPreview);' "      setImportPreview(data as ImportPreview);" "preview assign"


$oldCommit = @'
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
'@
$newCommit = @'
  async function commitImport() {
    if (!importPreview || !importFile || importSaving) return;
    setImportSaving(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      form.append("file", importFile);
      form.append("duplicateMode", duplicateMode);
      const response = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "นำเข้าไม่สำเร็จ");
      setImportPreview(null);
      setImportFile(null);
      setSuccess(data?.message || "นำเข้าสินค้าเรียบร้อย");
      await loadCategories();
      window.dispatchEvent(new Event("srr-products-updated"));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setImportSaving(false);
    }
  }
'@
$page = Replace-Required $page $oldCommit $newCommit "commitImport uploads original workbook"


$page = Replace-Required $page '<th>หมวดหมู่</th><th>รหัส</th><th>รายละเอียด</th>' '<th>หมวดหมู่</th><th>รหัสหมวดหมู่</th><th>รายละเอียด</th>' "category code label"
$page = Replace-Required $page 'if (!name.trim() || !code.trim()) {' 'if (!name.trim()) {' "category code optional"
$page = Replace-Required $page 'setError("กรุณากรอกชื่อและรหัสหมวดหมู่");' 'setError("กรุณากรอกชื่อหมวดหมู่");' "category validation message"
$page = Replace-Required $page 'รหัสหมวดหมู่ *<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="เช่น O-RING" />' 'รหัสหมวดหมู่<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="เว้นว่างได้ ระบบสร้างให้อัตโนมัติ" /><small>นี่คือรหัสหมวดหมู่ ไม่ใช่รหัสสินค้า เช่น G02580V</small>' "category code helper"


$oldHead = '<thead><tr><th>แถว</th><th>TG_NO</th><th>TYPE</th><th>SIZE &amp; MAT.</th><th>วัสดุ</th><th>ราคา</th><th>สถานะ</th></tr></thead>'
$newHead = '<thead><tr><th>Sheet</th><th>แถว</th><th>รหัสสินค้า</th><th>มาจาก</th><th>TYPE</th><th>SIZE &amp; MAT.</th><th>TG_NO</th><th>SOG</th><th>SOG_NP</th><th>ราคา</th><th>Stock</th><th>สถานะ</th></tr></thead>'
$page = Replace-Required $page $oldHead $newHead "import preview headers"


$oldRow = @'
                        <td>{row.sourceRow}</td>
                        <td><strong>{row.code || "-"}</strong></td>
                        <td>{row.category}</td>
                        <td>{row.sizeMaterial || "-"}</td>
                        <td>{row.material || "-"}</td>
                        <td>{row.price.toLocaleString("th-TH", { maximumFractionDigits: 4 })}</td>
                        <td><span className={`product-categories-import-status ${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span><small>{row.message}</small></td>
'@
$newRow = @'
                        <td>{row.sourceSheet}</td>
                        <td>{row.sourceRow}</td>
                        <td><strong>{row.code || "-"}</strong></td>
                        <td><span className="srr-import-code-source">{row.codeSource || "-"}</span></td>
                        <td>{row.category}</td>
                        <td>{row.sizeMaterial || "-"}</td>
                        <td>{row.tgNo || "-"}</td>
                        <td>{row.sog || "-"}</td>
                        <td>{row.sogNp || "-"}</td>
                        <td>{row.hasPrice ? row.price.toLocaleString("th-TH", { maximumFractionDigits: 4 }) : "-"}</td>
                        <td>{row.hasStock ? row.stock.toLocaleString("th-TH", { maximumFractionDigits: 3 }) : "-"}</td>
                        <td><span className={`product-categories-import-status ${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span><small>{row.message}</small></td>
'@
$page = Replace-Required $page $oldRow $newRow "import preview row"
$page = Replace-Required $page 'ไม่มี TG_NO' 'ไม่มีรหัสสินค้า' "summary invalid label"
$page = Replace-Required $page 'แถวที่ TG_NO ว่างจะไม่ถูกนำเข้า เพื่อให้รหัสสินค้าใช้จับคู่ FlowAccount ได้ถูกต้องในอนาคต' 'ระบบอ่านรหัสตามโครงของแต่ละ Sheet: TG_NO หรือ SOG/SOG_NO/SOG_NP และจะไม่สร้างรหัสขึ้นเองเมื่อไม่มีรหัสจริง' "import note"
$page = Replace-Required $page 'เมื่อ TG_NO มีอยู่ในระบบแล้ว' 'เมื่อรหัสสินค้ามีอยู่ในระบบแล้ว' "duplicate label"


[System.IO.File]::WriteAllText($PagePath, $page, [System.Text.UTF8Encoding]::new($false))
Write-Host "PATCH  $PageRel" -ForegroundColor Cyan


# CSS เพิ่มเฉพาะส่วนใหม่
$CssRel = "app/admin/product-categories/ProductCategoriesPage.css"
$CssPath = Join-Path $Root $CssRel
Backup-File $CssRel
$css = [System.IO.File]::ReadAllText($CssPath, [System.Text.UTF8Encoding]::new($false))
$extraCss = @'


/* SRR IMPORT V3 */
.product-categories-import-table { min-width: 1500px; }
.product-categories-import-table-wrap { max-height: 52vh; overflow: auto; }
.product-categories-import-table th { position: sticky; top: 0; z-index: 2; }
.srr-import-code-source { display:inline-flex; padding:3px 6px; border-radius:4px; background:#eaf3ff; color:#1266b8; font-size:8px; font-weight:800; }
.product-categories-form label small { display:block; margin-top:5px; color:#8a9aaa; font-size:8px; line-height:1.4; }
'@
if ($css -notmatch 'SRR IMPORT V3') {
  $css += $extraCss
  [System.IO.File]::WriteAllText($CssPath, $css, [System.Text.UTF8Encoding]::new($false))
  Write-Host "PATCH  $CssRel" -ForegroundColor Cyan
}


# =========================================================
# 7) dependency + verification
# =========================================================
npm ls xlsx --depth=0 *> $null
if ($LASTEXITCODE -ne 0) {
  npm install xlsx --save
  if ($LASTEXITCODE -ne 0) { throw "ติดตั้ง xlsx ไม่สำเร็จ" }
}


Write-Host "GREEN verification: parser tests" -ForegroundColor Green
node --test ".\tests\customer-import-v3.test.mjs"
if ($LASTEXITCODE -ne 0) { throw "Parser tests ไม่ผ่าน" }


Write-Host "Build project" -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build ยังมี error ตรวจข้อความด้านบนได้เลย" -ForegroundColor Red
  Write-Host "Backup: $BackupRoot" -ForegroundColor Yellow
  exit 1
}


Write-Host "" 
Write-Host "ติดตั้งโค้ด V3 และ npm build ผ่านในเครื่องนี้" -ForegroundColor Green
Write-Host "ขั้นต่อไป: เปิด HeidiSQL แล้วรัน database/srr_product_import_v3.sql" -ForegroundColor Yellow
Write-Host "จากนั้น npm run dev แล้วเปิด /admin/product-categories" -ForegroundColor Yellow
Write-Host "Backup อยู่นอก project: $BackupRoot" -ForegroundColor DarkGray
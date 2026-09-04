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
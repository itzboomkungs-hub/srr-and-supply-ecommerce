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
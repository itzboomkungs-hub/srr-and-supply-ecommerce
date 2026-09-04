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
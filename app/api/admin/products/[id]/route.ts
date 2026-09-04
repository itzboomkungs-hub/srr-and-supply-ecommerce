import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireAdmin } from "../../../../../lib/auth/require-admin";
import { srrAdminDb } from "../../../../../lib/db/srr-admin-db";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


type Context = { params: Promise<{ id: string }> };


type ProductRow = RowDataPacket & {
  id: number;
  code: string;
  websiteName: string;
  websiteDescription: string | null;
  category: string;
  material: string;
  image: string | null;
  active: number;
  flowProductMasterId: number | null;
  unitName: string | null;
  sellPrice: number | string;
  stock: number | string;
  stockSource: "LOCAL" | "FLOWACCOUNT";
  productType: string;
  barcode: string | null;
  taxType: string;
  lowStockThreshold: number | string;
  incomeAccountCode: string | null;
  syncStatus: string;
};


type ImageRow = RowDataPacket & {
  id: number;
  imageUrl: string;
  sortOrder: number;
};


type ExistsRow = RowDataPacket & { id: number };


type Body = {
  code?: string;
  websiteName?: string;
  websiteDescription?: string;
  category?: string;
  material?: string;
  active?: boolean;
  unitName?: string;
  sellPrice?: number;
  stock?: number;
  productType?: string;
  barcode?: string;
  taxType?: string;
  lowStockThreshold?: number;
  incomeAccountCode?: string;
};


const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const codeValue = (value: unknown) =>
  text(value).toUpperCase().replace(/\s+/g, "-");


function authResponse(error: unknown) {
  const value = error as {
    code?: string;
    message?: string;
    status?: number;
    statusCode?: number;
    publicMessage?: string;
  } | null;


  const code = String(value?.code || value?.message || "");
  const status = Number(value?.status || value?.statusCode || 0);


  if (
    code === "UNAUTHORIZED" ||
    code === "FORBIDDEN" ||
    code === "ACCOUNT_DISABLED" ||
    status === 401 ||
    status === 403
  ) {
    const resolvedStatus = status === 403 || code !== "UNAUTHORIZED" ? 403 : 401;
    const message =
      value?.publicMessage ||
      (code === "FORBIDDEN"
        ? "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ"
        : code === "ACCOUNT_DISABLED"
          ? "บัญชีนี้ถูกปิดการใช้งาน"
          : "กรุณาเข้าสู่ระบบ");


    return NextResponse.json(
      { ok: false, message },
      { status: resolvedStatus }
    );
  }


  return null;
}


async function productId(context: Context) {
  const { id } = await context.params;
  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : 0;
}


export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const id = await productId(context);


    if (!id) {
      return NextResponse.json(
        { ok: false, message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }


    const [rows] = await srrAdminDb.query<ProductRow[]>(
      `SELECT
         id, code, websiteName, websiteDescription, category, material,
         image, active, flowProductMasterId, unitName, sellPrice, stock,
         stockSource, productType, barcode, taxType, lowStockThreshold,
         incomeAccountCode, syncStatus
       FROM Product
       WHERE id = ?
       LIMIT 1`,
      [id]
    );


    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }


    const [images] = await srrAdminDb.query<ImageRow[]>(
      `SELECT id, imageUrl, sortOrder
       FROM ProductImage
       WHERE productId = ?
       ORDER BY sortOrder, id`,
      [id]
    );


    return NextResponse.json({
      ok: true,
      product: {
        ...row,
        active: Boolean(row.active),
        sellPrice: Number(row.sellPrice || 0),
        stock: Number(row.stock || 0),
        lowStockThreshold: Number(row.lowStockThreshold || 0),
        images: images.map((item) => item.imageUrl),
      },
    });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("Get admin product error:", error);
    return NextResponse.json(
      { ok: false, message: "โหลดข้อมูลสินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request, context: Context) {
  try {
    await requireAdmin();
    const id = await productId(context);


    if (!id) {
      return NextResponse.json(
        { ok: false, message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }


    const body = (await request.json()) as Body;
    const code = codeValue(body.code);
    const websiteName = text(body.websiteName);


    if (!code) {
      return NextResponse.json(
        { ok: false, message: "กรุณากรอกรหัสสินค้า" },
        { status: 400 }
      );
    }


    if (!websiteName) {
      return NextResponse.json(
        { ok: false, message: "กรุณากรอกชื่อสินค้า" },
        { status: 400 }
      );
    }


    const [duplicate] = await srrAdminDb.query<ExistsRow[]>(
      `SELECT id FROM Product
       WHERE UPPER(code) = UPPER(?) AND id <> ?
       LIMIT 1`,
      [code, id]
    );


    if (duplicate.length) {
      return NextResponse.json(
        { ok: false, message: `มีสินค้ารหัส ${code} อยู่แล้ว` },
        { status: 409 }
      );
    }


    const productType = ["SERVICE", "NON_STOCK", "STOCK"].includes(
      text(body.productType)
    )
      ? text(body.productType)
      : "STOCK";


    const sellPrice = numberValue(body.sellPrice);
    const stock = productType === "STOCK" ? numberValue(body.stock) : 0;
    const lowStockThreshold = numberValue(body.lowStockThreshold);


    const [result] = await srrAdminDb.execute(
      `UPDATE Product
       SET code = ?,
           websiteName = ?,
           websiteDescription = ?,
           category = ?,
           material = ?,
           active = ?,
           unitName = ?,
           productType = ?,
           barcode = ?,
           taxType = ?,
           lowStockThreshold = ?,
           incomeAccountCode = ?,
           sellPrice = CASE
             WHEN flowProductMasterId IS NULL THEN ?
             ELSE sellPrice
           END,
           stock = CASE
             WHEN stockSource = 'LOCAL' THEN ?
             ELSE stock
           END,
           updatedAt = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [
        code,
        websiteName,
        text(body.websiteDescription) || null,
        text(body.category),
        text(body.material),
        body.active === false ? 0 : 1,
        text(body.unitName) || null,
        productType,
        text(body.barcode) || null,
        text(body.taxType) || "EXCLUDE_VAT",
        lowStockThreshold,
        text(body.incomeAccountCode) || null,
        sellPrice,
        stock,
        id,
      ]
    );


    if (!(result as { affectedRows?: number }).affectedRows) {
      return NextResponse.json(
        { ok: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }


    return NextResponse.json({
      ok: true,
      message: "บันทึกการแก้ไขสินค้าเรียบร้อย",
    });
  } catch (error) {
    const auth = authResponse(error);
    if (auth) return auth;
    console.error("Update admin product error:", error);
    return NextResponse.json(
      { ok: false, message: "แก้ไขสินค้าไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
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
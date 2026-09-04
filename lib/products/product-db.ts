import type { ResultSetHeader, RowDataPacket } from "mysql2";


import { db } from "../db/mysql";


export type PublicProduct = {
  id: number;
  name: string;
  code: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  image: string | null;
  active: boolean;
  stockSource: "LOCAL" | "FLOWACCOUNT";
  unitName: string | null;
  flowProductMasterId: number | null;
  lastSyncedAt: Date | null;
};


type ProductRow = RowDataPacket & {
  id: number;
  code: string | null;
  websiteName: string;
  category: string;
  material: string;
  sellPrice: string | number;
  stock: string | number;
  image: string | null;
  active: number | boolean;
  stockSource: "LOCAL" | "FLOWACCOUNT";
  unitName: string | null;
  flowProductMasterId: number | null;
  lastSyncedAt: Date | null;
};


export type ProductIdentityRow = RowDataPacket & {
  id: number;
  code: string | null;
  websiteName: string;
  category: string;
  material: string;
  sellPrice: string | number;
  stock: string | number;
  flowProductMasterId: number | null;
};


function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    id: Number(row.id),
    name: row.websiteName,
    code: row.code || "",
    category: row.category || "",
    material: row.material || "",
    price: Number(row.sellPrice || 0),
    stock: Math.max(0, Number(row.stock || 0)),
    image: row.image,
    active: Boolean(row.active),
    stockSource: row.stockSource,
    unitName: row.unitName,
    flowProductMasterId:
      row.flowProductMasterId == null ? null : Number(row.flowProductMasterId),
    lastSyncedAt: row.lastSyncedAt,
  };
}


export async function listPublicProducts(input?: {
  includeInactive?: boolean;
  search?: string;
  category?: string;
}) {
  const where: string[] = [];
  const params: string[] = [];


  if (!input?.includeInactive) {
    where.push("active = 1");
  }


  const search = String(input?.search || "").trim();
  if (search) {
    where.push("(websiteName LIKE ? OR code LIKE ? OR material LIKE ?)");
    const keyword = `%${search}%`;
    params.push(keyword, keyword, keyword);
  }


  const category = String(input?.category || "").trim();
  if (category) {
    where.push("category = ?");
    params.push(category);
  }


  const sql = `SELECT
      id, code, websiteName, category, material, sellPrice, stock,
      image, active, stockSource, unitName, flowProductMasterId, lastSyncedAt
    FROM \`Product\`
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY id DESC`;


  const [rows] = await db.execute<ProductRow[]>(sql, params);
  return rows.map(toPublicProduct);
}


export async function getPublicProductById(id: number) {
  const [rows] = await db.execute<ProductRow[]>(
    `SELECT
       id, code, websiteName, category, material, sellPrice, stock,
       image, active, stockSource, unitName, flowProductMasterId, lastSyncedAt
     FROM \`Product\`
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ? toPublicProduct(rows[0]) : null;
}


export async function findProductByFlowId(flowProductMasterId: number) {
  const [rows] = await db.execute<ProductIdentityRow[]>(
    `SELECT id, code, websiteName, category, material, sellPrice, stock, flowProductMasterId
     FROM \`Product\`
     WHERE flowProductMasterId = ?
     LIMIT 1`,
    [flowProductMasterId]
  );
  return rows[0] ?? null;
}


export async function findProductByCode(code: string | null) {
  if (!code) return null;
  const [rows] = await db.execute<ProductIdentityRow[]>(
    `SELECT id, code, websiteName, category, material, sellPrice, stock, flowProductMasterId
     FROM \`Product\`
     WHERE code = ?
     LIMIT 1`,
    [code]
  );
  return rows[0] ?? null;
}


export async function createProductFromFlow(
  flow: {
    flowProductMasterId: number;
    code: string | null;
    flowName: string;
    flowCategoryId: number | null;
    flowCategoryName: string;
    flowType: number;
    flowMainProductId: number | null;
    unitName: string;
    flowSellPrice: number;
    flowStock: number | null;
  },
  options: { syncPrices: boolean; syncStock: boolean }
) {
  const websiteName = flow.flowName || flow.code || `Flow Product ${flow.flowProductMasterId}`;
  const sellPrice = options.syncPrices ? flow.flowSellPrice : 0;
  const stock = options.syncStock && flow.flowStock != null ? flow.flowStock : 0;
  const stockSource = options.syncStock && flow.flowStock != null ? "FLOWACCOUNT" : "LOCAL";


  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO \`Product\` (
       code, websiteName, category, material, active,
       flowProductMasterId, flowMainProductId, flowName,
       flowCategoryId, flowCategoryName, flowType, unitName,
       sellPrice, flowSellPrice, stock, flowStock, stockSource, lastSyncedAt
     ) VALUES (?, ?, ?, '', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
    [
      flow.code,
      websiteName,
      flow.flowCategoryName || "",
      flow.flowProductMasterId,
      flow.flowMainProductId,
      flow.flowName,
      flow.flowCategoryId,
      flow.flowCategoryName,
      flow.flowType,
      flow.unitName,
      sellPrice,
      flow.flowSellPrice,
      stock,
      flow.flowStock,
      stockSource,
    ]
  );


  return result.insertId;
}


export async function updateProductFromFlow(
  productId: number,
  flow: {
    flowProductMasterId: number;
    code: string | null;
    flowName: string;
    flowCategoryId: number | null;
    flowCategoryName: string;
    flowType: number;
    flowMainProductId: number | null;
    unitName: string;
    flowSellPrice: number;
    flowStock: number | null;
  },
  options: { syncProducts: boolean; syncPrices: boolean; syncStock: boolean }
) {
  await db.execute(
    `UPDATE \`Product\`
     SET flowProductMasterId = ?,
         code = CASE WHEN ? IS NULL THEN code ELSE ? END,
         flowMainProductId = ?,
         flowName = ?,
         flowCategoryId = ?,
         flowCategoryName = ?,
         flowType = ?,
         unitName = ?,
         flowSellPrice = ?,
         flowStock = ?,
         sellPrice = CASE WHEN ? = 1 THEN ? ELSE sellPrice END,
         stock = CASE WHEN ? = 1 AND ? IS NOT NULL THEN ? ELSE stock END,
         stockSource = CASE WHEN ? = 1 AND ? IS NOT NULL THEN 'FLOWACCOUNT' ELSE stockSource END,
         lastSyncedAt = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [
      flow.flowProductMasterId,
      flow.code,
      flow.code,
      flow.flowMainProductId,
      flow.flowName,
      flow.flowCategoryId,
      flow.flowCategoryName,
      flow.flowType,
      flow.unitName,
      flow.flowSellPrice,
      flow.flowStock,
      options.syncPrices ? 1 : 0,
      flow.flowSellPrice,
      options.syncStock ? 1 : 0,
      flow.flowStock,
      flow.flowStock,
      options.syncStock ? 1 : 0,
      flow.flowStock,
      productId,
    ]
  );
}
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
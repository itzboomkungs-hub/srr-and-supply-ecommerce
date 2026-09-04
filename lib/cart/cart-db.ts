import { randomUUID } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

import { db } from "../db/mysql";
import {
  clampQuantity,
  normalizeCartItems,
} from "./normalize.mjs";
import { applyAuthoritativeProduct } from "./cart-authoritative.mjs";

export type CartProductSnapshot = {
  id: number;
  name: string;
  code: string;
  category: string;
  material: string;
  price: number;
  stock: number;
};

export type CartItemDto = {
  product: CartProductSnapshot;
  quantity: number;
};

type CartIdRow = RowDataPacket & {
  id: string;
};

type CartItemRow = RowDataPacket & {
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  material: string;
  priceSnapshot: string | number;
  stockSnapshot: number;
  quantity: number;
};

type ProductRow = RowDataPacket & {
  id: number;
  name: string;
  code: string;
  category: string;
  material: string;
  price: string | number;
  stock: string | number;
  active: number | boolean;
};

async function ensureCart(
  connection: PoolConnection,
  userId: string
) {
  const [rows] = await connection.execute<CartIdRow[]>(
    `SELECT id FROM \`Cart\` WHERE userId = ? LIMIT 1`,
    [userId]
  );

  if (rows[0]) return rows[0].id;

  const cartId = randomUUID();

  await connection.execute(
    `INSERT INTO \`Cart\` (id, userId) VALUES (?, ?)`,
    [cartId, userId]
  );

  return cartId;
}

function rowsToItems(rows: CartItemRow[]): CartItemDto[] {
  return rows.map((row) => ({
    product: {
      id: Number(row.productId),
      name: row.productName,
      code: row.productCode,
      category: row.category,
      material: row.material,
      price: Number(row.priceSnapshot),
      stock: Number(row.stockSnapshot),
    },
    quantity: Number(row.quantity),
  }));
}

async function getAuthoritativeProduct(
  connection: PoolConnection,
  productId: number
) {
  const [rows] = await connection.execute<ProductRow[]>(
    `SELECT
       id,
       websiteName AS name,
       COALESCE(code, '') AS code,
       category,
       material,
       sellPrice AS price,
       CASE WHEN active = 1 THEN stock ELSE 0 END AS stock,
       active
     FROM \`Product\`
     WHERE id = ?
     LIMIT 1`,
    [productId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name,
    code: row.code,
    category: row.category,
    material: row.material,
    price: Number(row.price || 0),
    stock: Math.max(0, Math.floor(Number(row.stock || 0))),
  };
}

async function resolveAuthoritativeItem(
  connection: PoolConnection,
  item: CartItemDto
): Promise<CartItemDto> {
  const product = await getAuthoritativeProduct(
    connection,
    item.product.id
  );

  if (!product) {
    // Legacy/guest fallback: keep snapshot if Product has not been migrated yet.
    return item;
  }

  return applyAuthoritativeProduct(item, product) as CartItemDto;
}

async function resolveAuthoritativeItems(
  connection: PoolConnection,
  items: CartItemDto[]
) {
  const result: CartItemDto[] = [];

  for (const item of items) {
    const resolved = await resolveAuthoritativeItem(connection, item);
    if (resolved.quantity > 0 && resolved.product.stock > 0) {
      result.push(resolved);
    }
  }

  return result;
}

async function loadItemsWithConnection(
  connection: PoolConnection,
  userId: string
): Promise<CartItemDto[]> {
  const [rows] = await connection.execute<CartItemRow[]>(
    `SELECT
       ci.productId,
       ci.productName,
       ci.productCode,
       ci.category,
       ci.material,
       ci.priceSnapshot,
       ci.stockSnapshot,
       ci.quantity
     FROM \`Cart\` c
     INNER JOIN \`CartItem\` ci ON ci.cartId = c.id
     WHERE c.userId = ?
     ORDER BY ci.createdAt ASC`,
    [userId]
  );

  return resolveAuthoritativeItems(connection, rowsToItems(rows));
}

export async function getMemberCart(userId: string): Promise<CartItemDto[]> {
  const connection = await db.getConnection();

  try {
    return await loadItemsWithConnection(connection, userId);
  } finally {
    connection.release();
  }
}

async function writeAllItems(
  connection: PoolConnection,
  cartId: string,
  items: CartItemDto[]
) {
  const resolvedItems = await resolveAuthoritativeItems(connection, items);

  await connection.execute(
    `DELETE FROM \`CartItem\` WHERE cartId = ?`,
    [cartId]
  );

  for (const item of resolvedItems) {
    await connection.execute(
      `INSERT INTO \`CartItem\`
        (id, cartId, productId, productCode, productName, category, material,
         priceSnapshot, stockSnapshot, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        cartId,
        item.product.id,
        item.product.code,
        item.product.name,
        item.product.category,
        item.product.material,
        item.product.price,
        item.product.stock,
        item.quantity,
      ]
    );
  }

  return resolvedItems;
}

export async function replaceMemberCart(
  userId: string,
  rawItems: unknown
): Promise<CartItemDto[]> {
  const items = normalizeCartItems(rawItems) as CartItemDto[];
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const cartId = await ensureCart(connection, userId);
    const resolved = await writeAllItems(connection, cartId, items);
    await connection.commit();
    return resolved;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function mergeMemberCart(
  userId: string,
  rawItems: unknown
): Promise<CartItemDto[]> {
  const incomingRaw = normalizeCartItems(rawItems) as CartItemDto[];
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const cartId = await ensureCart(connection, userId);
    const existing = await loadItemsWithConnection(connection, userId);
    const incoming = await resolveAuthoritativeItems(connection, incomingRaw);

    const merged = new Map<number, CartItemDto>();

    for (const item of existing) {
      merged.set(item.product.id, item);
    }

    for (const item of incoming) {
      const current = merged.get(item.product.id);

      if (!current) {
        merged.set(item.product.id, item);
        continue;
      }

      const stock = item.product.stock;
      merged.set(item.product.id, {
        product: item.product,
        quantity: clampQuantity(
          current.quantity + item.quantity,
          stock
        ),
      });
    }

    const finalItems = [...merged.values()].filter(
      (item) => item.quantity > 0 && item.product.stock > 0
    );

    const resolved = await writeAllItems(connection, cartId, finalItems);
    await connection.commit();

    return resolved;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addMemberCartItem(
  userId: string,
  rawItem: unknown
) {
  return mergeMemberCart(userId, [rawItem]);
}

export async function setMemberCartItemQuantity(
  userId: string,
  productId: number,
  requestedQuantity: number
): Promise<CartItemDto[]> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const cartId = await ensureCart(connection, userId);

    const [rows] = await connection.execute<CartItemRow[]>(
      `SELECT
         ci.productId,
         ci.productName,
         ci.productCode,
         ci.category,
         ci.material,
         ci.priceSnapshot,
         ci.stockSnapshot,
         ci.quantity
       FROM \`CartItem\` ci
       WHERE ci.cartId = ? AND ci.productId = ?
       LIMIT 1`,
      [cartId, productId]
    );

    const row = rows[0];

    if (row) {
      const baseItem = rowsToItems([row])[0];
      const authoritative = await resolveAuthoritativeItem(
        connection,
        {
          ...baseItem,
          quantity: requestedQuantity,
        }
      );

      if (requestedQuantity <= 0 || authoritative.product.stock <= 0) {
        await connection.execute(
          `DELETE FROM \`CartItem\` WHERE cartId = ? AND productId = ?`,
          [cartId, productId]
        );
      } else {
        const quantity = clampQuantity(
          requestedQuantity,
          authoritative.product.stock
        );

        await connection.execute(
          `UPDATE \`CartItem\`
           SET quantity = ?,
               productCode = ?,
               productName = ?,
               category = ?,
               material = ?,
               priceSnapshot = ?,
               stockSnapshot = ?,
               updatedAt = CURRENT_TIMESTAMP(3)
           WHERE cartId = ? AND productId = ?`,
          [
            quantity,
            authoritative.product.code,
            authoritative.product.name,
            authoritative.product.category,
            authoritative.product.material,
            authoritative.product.price,
            authoritative.product.stock,
            cartId,
            productId,
          ]
        );
      }
    }

    await connection.execute(
      `UPDATE \`Cart\` SET updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [cartId]
    );

    const items = await loadItemsWithConnection(connection, userId);
    await connection.commit();
    return items;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeMemberCartItem(
  userId: string,
  productId: number
): Promise<CartItemDto[]> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const cartId = await ensureCart(connection, userId);

    await connection.execute(
      `DELETE FROM \`CartItem\` WHERE cartId = ? AND productId = ?`,
      [cartId, productId]
    );

    await connection.execute(
      `UPDATE \`Cart\` SET updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [cartId]
    );

    const items = await loadItemsWithConnection(connection, userId);
    await connection.commit();
    return items;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function clearMemberCart(userId: string) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const cartId = await ensureCart(connection, userId);

    await connection.execute(
      `DELETE FROM \`CartItem\` WHERE cartId = ?`,
      [cartId]
    );

    await connection.execute(
      `UPDATE \`Cart\` SET updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [cartId]
    );

    await connection.commit();
    return [] as CartItemDto[];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function clampQuantity(quantity, stock) {
  const safeStock = Math.max(0, Math.floor(Number(stock) || 0));
  if (safeStock <= 0) return 0;

  const parsed = Math.floor(Number(quantity) || 0);
  return Math.max(1, Math.min(parsed, safeStock));
}

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return null;

  const id = Number(product.id);
  const price = Number(product.price);
  const stock = Math.max(0, Math.floor(Number(product.stock) || 0));

  if (!Number.isInteger(id) || id <= 0) return null;
  if (!Number.isFinite(price) || price < 0) return null;

  const name = String(product.name || '').trim();
  const code = String(product.code || '').trim();
  const category = String(product.category || '').trim();
  const material = String(product.material || '').trim();

  if (!name || !code) return null;

  return {
    id,
    name,
    code,
    category,
    material,
    price,
    stock,
  };
}

export function normalizeCartItems(input) {
  if (!Array.isArray(input)) return [];

  const byProductId = new Map();

  for (const rawItem of input) {
    const product = normalizeProduct(rawItem?.product);
    if (!product || product.stock <= 0) continue;

    const quantity = clampQuantity(rawItem?.quantity, product.stock);
    if (quantity <= 0) continue;

    const existing = byProductId.get(product.id);
    const combined = existing ? existing.quantity + quantity : quantity;

    byProductId.set(product.id, {
      product,
      quantity: clampQuantity(combined, product.stock),
    });
  }

  return [...byProductId.values()];
}

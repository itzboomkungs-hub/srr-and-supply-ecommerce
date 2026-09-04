function safeIntStock(stock) {
  const value = Number(stock);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

export function applyAuthoritativeProduct(item, currentProduct) {
  if (!currentProduct) return item;

  const stock = safeIntStock(currentProduct.stock);
  const requested = Number(item?.quantity ?? 1);
  const quantity = stock <= 0
    ? 0
    : Math.max(1, Math.min(Math.floor(requested || 1), stock));

  return {
    product: {
      id: Number(currentProduct.id),
      name: String(currentProduct.name ?? ''),
      code: String(currentProduct.code ?? ''),
      category: String(currentProduct.category ?? ''),
      material: String(currentProduct.material ?? ''),
      price: Number(currentProduct.price ?? 0),
      stock,
    },
    quantity,
  };
}

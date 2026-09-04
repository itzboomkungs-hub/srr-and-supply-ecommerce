export function normalizeApiProduct(item) {
  const value = item && typeof item === "object" ? item : {};
  return {
    id: Number(value.id || 0),
    name: String(value.name || value.websiteName || ""),
    code: String(value.code || ""),
    category: String(value.category || ""),
    material: String(value.material || ""),
    image: value.image || null,
    price: Number(value.price ?? value.sellPrice ?? 0),
    stock: Number(value.stock ?? 0),
    reserved: Number(value.reserved ?? 0),
    active: value.active !== false && value.active !== 0,
  };
}
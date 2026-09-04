function nullableTrim(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function mapFlowProductDetail(detail) {
  if (!detail || !Number.isFinite(Number(detail.id))) {
    throw new Error('FlowAccount product detail is missing id');
  }

  const lists = Array.isArray(detail.productLists)
    ? detail.productLists
    : [];

  const mainProduct =
    lists.find((item) => item?.isMainProduct === true) ||
    lists.find((item) => Number(item?.id) === Number(detail.mainProductId)) ||
    lists[0] ||
    null;

  const inventory = detail.inventorySettings || null;

  return {
    flowProductMasterId: Number(detail.id),
    code: nullableTrim(detail.code),
    flowName: String(detail.name ?? '').trim(),
    flowCategoryId:
      detail.categoryId == null || detail.categoryId === ''
        ? null
        : Number(detail.categoryId),
    flowCategoryName: String(detail.categoryName ?? '').trim(),
    flowType: Number(detail.type || 0),
    flowMainProductId:
      detail.mainProductId == null
        ? mainProduct?.id == null
          ? null
          : Number(mainProduct.id)
        : Number(detail.mainProductId),
    unitName: String(
      mainProduct?.unitName ?? detail.mainUnitName ?? ''
    ).trim(),
    flowSellPrice: finiteNumber(mainProduct?.sellPrice, 0),
    flowStock:
      inventory?.remainingStock == null
        ? null
        : finiteNumber(inventory.remainingStock, 0),
  };
}

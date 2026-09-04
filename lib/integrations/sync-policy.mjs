export function chooseIdentityMatch(flowIdMatch, codeMatch) {
  if (flowIdMatch) {
    return { id: flowIdMatch.id, matchedBy: 'flowId' };
  }
  if (codeMatch) {
    return { id: codeMatch.id, matchedBy: 'code' };
  }
  return null;
}

export function buildProductSyncPatch(existing, flow, options) {
  const patch = {
    flowName: flow.flowName ?? null,
    flowCategoryName: flow.flowCategoryName ?? null,
    flowCategoryId: flow.flowCategoryId ?? null,
    flowType: flow.flowType ?? null,
    flowMainProductId: flow.flowMainProductId ?? null,
    unitName: flow.unitName ?? null,
    flowSellPrice: flow.flowSellPrice ?? null,
    flowStock: flow.flowStock ?? null,
  };

  if (options?.syncPrices && flow.flowSellPrice != null) {
    patch.sellPrice = Number(flow.flowSellPrice);
  }

  if (options?.syncStock && flow.flowStock != null) {
    patch.stock = Number(flow.flowStock);
    patch.stockSource = 'FLOWACCOUNT';
  }

  return patch;
}

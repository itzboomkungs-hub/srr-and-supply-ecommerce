export type FlowProductSyncRecord = {
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
};
export function mapFlowProductDetail(detail: unknown): FlowProductSyncRecord;

export function chooseIdentityMatch(flowIdMatch: {id:number} | null, codeMatch: {id:number} | null): {id:number; matchedBy:'flowId'|'code'} | null;
export function buildProductSyncPatch(existing: Record<string, unknown>, flow: Record<string, unknown>, options: {syncProducts:boolean;syncPrices:boolean;syncStock:boolean}): Record<string, unknown>;

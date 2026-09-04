import { randomUUID } from "node:crypto";

import { db } from "../db/mysql";
import {
  createProductFromFlow,
  findProductByCode,
  findProductByFlowId,
  updateProductFromFlow,
} from "../products/product-db";
import {
  getFlowAccountProductDetail,
  listFlowAccountProductSummaries,
} from "./flowaccount";
import {
  getFlowAccountSettingsRaw,
  markFlowAccountConnection,
  markFlowAccountSyncCompleted,
} from "./flowaccount-settings-db";
import { mapFlowProductDetail } from "./flowaccount-mapping.mjs";
import { chooseIdentityMatch } from "./sync-policy.mjs";

type SyncAction = "CREATE" | "UPDATE" | "SKIP" | "CONFLICT" | "ERROR" | "SUMMARY";
type SyncStatus = "SUCCESS" | "WARNING" | "ERROR";

type SyncCounters = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: number;
  errors: number;
};

async function writeLog(input: {
  runId: string;
  action: SyncAction;
  status: SyncStatus;
  productId?: number | null;
  flowProductMasterId?: number | null;
  productCode?: string | null;
  message?: string | null;
  detail?: unknown;
}) {
  await db.execute(
    `INSERT INTO \`ProductSyncLog\`
      (id, runId, provider, action, status, productId,
       flowProductMasterId, productCode, message, detailJson)
     VALUES (?, ?, 'FLOWACCOUNT', ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.runId,
      input.action,
      input.status,
      input.productId ?? null,
      input.flowProductMasterId ?? null,
      input.productCode ?? null,
      input.message ?? null,
      input.detail === undefined ? null : JSON.stringify(input.detail),
    ]
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function syncFlowAccountProducts() {
  const settings = await getFlowAccountSettingsRaw();

  if (!settings.clientId || !settings.clientSecretEncrypted) {
    throw new Error("FLOWACCOUNT_NOT_CONFIGURED");
  }

  const runId = randomUUID();
  const startedAt = new Date();
  const counters: SyncCounters = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    conflicts: 0,
    errors: 0,
  };

  try {
    let page = 1;
    const pageSize = 250;
    let totalFromFlow = Number.POSITIVE_INFINITY;

    while ((page - 1) * pageSize < totalFromFlow) {
      const batch = await listFlowAccountProductSummaries(page, pageSize);
      totalFromFlow = batch.total;

      if (batch.list.length === 0) break;

      for (const summary of batch.list) {
        counters.total += 1;

        try {
          // FlowAccount list response is a summary. Detail endpoint is used
          // so inventorySettings.remainingStock is available for stock sync.
          const detail = await getFlowAccountProductDetail(Number(summary.id));
          const flow = mapFlowProductDetail(detail);

          const flowIdMatch = await findProductByFlowId(flow.flowProductMasterId);
          const codeMatch = await findProductByCode(flow.code);
          const chosen = chooseIdentityMatch(flowIdMatch, codeMatch);

          if (
            flowIdMatch &&
            codeMatch &&
            Number(flowIdMatch.id) !== Number(codeMatch.id)
          ) {
            counters.conflicts += 1;
            await writeLog({
              runId,
              action: "CONFLICT",
              status: "WARNING",
              productId: Number(flowIdMatch.id),
              flowProductMasterId: flow.flowProductMasterId,
              productCode: flow.code,
              message: "Flow ID และรหัสสินค้าชี้ไปคนละ Product ใน SRR จึงไม่ merge อัตโนมัติ",
            });
            continue;
          }

          if (!chosen) {
            if (!settings.syncProducts) {
              counters.skipped += 1;
              await writeLog({
                runId,
                action: "SKIP",
                status: "SUCCESS",
                flowProductMasterId: flow.flowProductMasterId,
                productCode: flow.code,
                message: "ข้ามสินค้าใหม่เพราะปิด Sync สินค้า",
              });
              continue;
            }

            const productId = await createProductFromFlow(flow, {
              syncPrices: settings.syncPrices,
              syncStock: settings.syncStock,
            });
            counters.created += 1;
            await writeLog({
              runId,
              action: "CREATE",
              status: "SUCCESS",
              productId,
              flowProductMasterId: flow.flowProductMasterId,
              productCode: flow.code,
              message: "สร้าง Product ใหม่จาก FlowAccount",
            });
            continue;
          }

          const existing =
            chosen.matchedBy === "flowId" ? flowIdMatch : codeMatch;

          if (
            existing?.flowProductMasterId != null &&
            Number(existing.flowProductMasterId) !== flow.flowProductMasterId
          ) {
            counters.conflicts += 1;
            await writeLog({
              runId,
              action: "CONFLICT",
              status: "WARNING",
              productId: Number(existing.id),
              flowProductMasterId: flow.flowProductMasterId,
              productCode: flow.code,
              message: "รหัสสินค้านี้เชื่อมกับ Flow Product อื่นอยู่แล้ว",
            });
            continue;
          }

          await updateProductFromFlow(Number(chosen.id), flow, {
            syncProducts: settings.syncProducts,
            syncPrices: settings.syncPrices,
            syncStock: settings.syncStock,
          });

          counters.updated += 1;
          await writeLog({
            runId,
            action: "UPDATE",
            status: "SUCCESS",
            productId: Number(chosen.id),
            flowProductMasterId: flow.flowProductMasterId,
            productCode: flow.code,
            message:
              chosen.matchedBy === "code"
                ? "จับคู่ด้วยรหัสสินค้าและเชื่อม Flow Product ID แล้ว"
                : "อัปเดตจาก Flow Product ID",
          });
        } catch (error) {
          counters.errors += 1;
          await writeLog({
            runId,
            action: "ERROR",
            status: "ERROR",
            flowProductMasterId: Number(summary.id) || null,
            productCode: summary.code || null,
            message: errorMessage(error).slice(0, 1000),
          });
        }
      }

      if (page * pageSize >= totalFromFlow) break;
      page += 1;
    }

    await markFlowAccountSyncCompleted();

    const finishedAt = new Date();
    await writeLog({
      runId,
      action: "SUMMARY",
      status: counters.errors > 0 || counters.conflicts > 0 ? "WARNING" : "SUCCESS",
      message: `Sync completed: created=${counters.created}, updated=${counters.updated}, skipped=${counters.skipped}, conflicts=${counters.conflicts}, errors=${counters.errors}`,
      detail: counters,
    });

    return {
      runId,
      ...counters,
      startedAt,
      finishedAt,
    };
  } catch (error) {
    const message = errorMessage(error);
    await markFlowAccountConnection({
      status: "ERROR",
      error: message.slice(0, 1000),
    });
    await writeLog({
      runId,
      action: "SUMMARY",
      status: "ERROR",
      message: message.slice(0, 1000),
      detail: counters,
    });
    throw error;
  }
}

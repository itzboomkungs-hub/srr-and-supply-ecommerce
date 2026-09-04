import type { RowDataPacket } from "mysql2";

import { db } from "../db/mysql";
import {
  decryptSettingSecret,
  encryptSettingSecret,
} from "./settings-crypto.mjs";

export type FlowAccountEnvironment = "SANDBOX" | "PRODUCTION";
export type FlowAccountConnectionStatus =
  | "NOT_CONFIGURED"
  | "CONNECTED"
  | "ERROR";

export type FlowAccountSettingsRaw = {
  id: string;
  provider: "FLOWACCOUNT";
  environment: FlowAccountEnvironment;
  clientId: string;
  clientSecretEncrypted: string | null;
  accessTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  syncProducts: boolean;
  syncPrices: boolean;
  syncStock: boolean;
  connectionStatus: FlowAccountConnectionStatus;
  lastError: string | null;
  lastTestedAt: Date | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SettingsRow = RowDataPacket & {
  id: string;
  provider: "FLOWACCOUNT";
  environment: FlowAccountEnvironment;
  clientId: string;
  clientSecretEncrypted: string | null;
  accessTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  syncProducts: number | boolean;
  syncPrices: number | boolean;
  syncStock: number | boolean;
  connectionStatus: FlowAccountConnectionStatus;
  lastError: string | null;
  lastTestedAt: Date | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

async function ensureFlowAccountRow() {
  await db.execute(
    `INSERT INTO \`IntegrationSetting\`
      (id, provider, environment, clientId, syncProducts, syncPrices, syncStock, connectionStatus)
     VALUES ('flowaccount', 'FLOWACCOUNT', 'SANDBOX', '', 1, 1, 1, 'NOT_CONFIGURED')
     ON DUPLICATE KEY UPDATE provider = VALUES(provider)`
  );
}

function normalizeRow(row: SettingsRow): FlowAccountSettingsRaw {
  return {
    ...row,
    syncProducts: Boolean(row.syncProducts),
    syncPrices: Boolean(row.syncPrices),
    syncStock: Boolean(row.syncStock),
  };
}

export async function getFlowAccountSettingsRaw(): Promise<FlowAccountSettingsRaw> {
  await ensureFlowAccountRow();

  const [rows] = await db.execute<SettingsRow[]>(
    `SELECT
       id, provider, environment, clientId,
       clientSecretEncrypted, accessTokenEncrypted, tokenExpiresAt,
       syncProducts, syncPrices, syncStock,
       connectionStatus, lastError, lastTestedAt, lastSyncAt,
       createdAt, updatedAt
     FROM \`IntegrationSetting\`
     WHERE provider = 'FLOWACCOUNT'
     LIMIT 1`
  );

  if (!rows[0]) {
    throw new Error("FLOWACCOUNT_SETTINGS_NOT_FOUND");
  }

  return normalizeRow(rows[0]);
}

export function toPublicFlowAccountSettings(settings: FlowAccountSettingsRaw) {
  return {
    provider: settings.provider,
    environment: settings.environment,
    clientId: settings.clientId,
    hasClientSecret: Boolean(settings.clientSecretEncrypted),
    syncProducts: settings.syncProducts,
    syncPrices: settings.syncPrices,
    syncStock: settings.syncStock,
    connectionStatus: settings.connectionStatus,
    tokenExpiresAt: settings.tokenExpiresAt,
    lastError: settings.lastError,
    lastTestedAt: settings.lastTestedAt,
    lastSyncAt: settings.lastSyncAt,
    updatedAt: settings.updatedAt,
  };
}

export async function saveFlowAccountSettings(input: {
  environment: FlowAccountEnvironment;
  clientId: string;
  clientSecret?: string;
  syncProducts: boolean;
  syncPrices: boolean;
  syncStock: boolean;
}) {
  const current = await getFlowAccountSettingsRaw();
  const nextSecret = String(input.clientSecret || "").trim();
  const credentialsChanged =
    current.environment !== input.environment ||
    current.clientId !== input.clientId ||
    Boolean(nextSecret);

  const encryptedSecret = nextSecret
    ? encryptSettingSecret(nextSecret)
    : current.clientSecretEncrypted;

  const connectionStatus: FlowAccountConnectionStatus =
    input.clientId && encryptedSecret
      ? credentialsChanged
        ? "NOT_CONFIGURED"
        : current.connectionStatus
      : "NOT_CONFIGURED";

  await db.execute(
    `UPDATE \`IntegrationSetting\`
     SET environment = ?,
         clientId = ?,
         clientSecretEncrypted = ?,
         syncProducts = ?,
         syncPrices = ?,
         syncStock = ?,
         accessTokenEncrypted = ?,
         tokenExpiresAt = ?,
         connectionStatus = ?,
         lastError = ?
     WHERE provider = 'FLOWACCOUNT'`,
    [
      input.environment,
      input.clientId,
      encryptedSecret,
      input.syncProducts ? 1 : 0,
      input.syncPrices ? 1 : 0,
      input.syncStock ? 1 : 0,
      credentialsChanged ? null : current.accessTokenEncrypted,
      credentialsChanged ? null : current.tokenExpiresAt,
      connectionStatus,
      credentialsChanged ? null : current.lastError,
    ]
  );

  return getFlowAccountSettingsRaw();
}

export function getDecryptedClientSecret(settings: FlowAccountSettingsRaw) {
  if (!settings.clientSecretEncrypted) return "";
  return decryptSettingSecret(settings.clientSecretEncrypted);
}

export function getDecryptedAccessToken(settings: FlowAccountSettingsRaw) {
  if (!settings.accessTokenEncrypted) return "";
  return decryptSettingSecret(settings.accessTokenEncrypted);
}

export async function saveFlowAccountAccessToken(
  accessToken: string,
  expiresAt: Date
) {
  await db.execute(
    `UPDATE \`IntegrationSetting\`
     SET accessTokenEncrypted = ?,
         tokenExpiresAt = ?,
         connectionStatus = 'CONNECTED',
         lastError = NULL
     WHERE provider = 'FLOWACCOUNT'`,
    [encryptSettingSecret(accessToken), expiresAt]
  );
}

export async function markFlowAccountConnection(input: {
  status: FlowAccountConnectionStatus;
  error?: string | null;
  tested?: boolean;
}) {
  await db.execute(
    `UPDATE \`IntegrationSetting\`
     SET connectionStatus = ?,
         lastError = ?,
         lastTestedAt = ${input.tested ? "CURRENT_TIMESTAMP(3)" : "lastTestedAt"}
     WHERE provider = 'FLOWACCOUNT'`,
    [input.status, input.error ?? null]
  );
}

export async function markFlowAccountSyncCompleted() {
  await db.execute(
    `UPDATE \`IntegrationSetting\`
     SET lastSyncAt = CURRENT_TIMESTAMP(3),
         connectionStatus = 'CONNECTED',
         lastError = NULL
     WHERE provider = 'FLOWACCOUNT'`
  );
}

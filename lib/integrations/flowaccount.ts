import { getFlowAccountBaseUrl } from "./flowaccount-config.mjs";

import {
  getDecryptedAccessToken,
  getDecryptedClientSecret,
  getFlowAccountSettingsRaw,
  markFlowAccountConnection,
  saveFlowAccountAccessToken,
} from "./flowaccount-settings-db";

export type FlowAccountToken = {
  accessToken: string;
  expiresAt: Date;
};

export type FlowAccountProductSummary = {
  id: number;
  type?: number;
  name?: string;
  code?: string | null;
};

export type FlowAccountProductListResponse = {
  total: number;
  currentPage: number;
  list: FlowAccountProductSummary[];
};

function normalizeApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const error = String(value.error || "").trim();
    const message = String(value.message || "").trim();
    if (error === "invalid_client") {
      return new Error("FLOWACCOUNT_INVALID_CLIENT");
    }
    if (error) return new Error(`FLOWACCOUNT_${error.toUpperCase()}`);
    if (message) return new Error(message);
  }
  return new Error(fallback);
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("FLOWACCOUNT_INVALID_JSON");
  }
}

export async function requestFlowAccountAccessToken(
  forceRefresh = false
): Promise<FlowAccountToken> {
  const settings = await getFlowAccountSettingsRaw();

  if (!settings.clientId || !settings.clientSecretEncrypted) {
    throw new Error("FLOWACCOUNT_NOT_CONFIGURED");
  }

  const now = Date.now();
  const reusableUntil = settings.tokenExpiresAt?.getTime() ?? 0;
  if (
    !forceRefresh &&
    settings.accessTokenEncrypted &&
    reusableUntil > now + 5 * 60 * 1000
  ) {
    return {
      accessToken: getDecryptedAccessToken(settings),
      expiresAt: settings.tokenExpiresAt as Date,
    };
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "flowaccount-api",
    client_id: settings.clientId,
    client_secret: getDecryptedClientSecret(settings),
  });

  const response = await fetch(
    `${getFlowAccountBaseUrl(settings.environment)}/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );

  const payload = await readJson(response);
  const data = (payload || {}) as Record<string, unknown>;

  if (!response.ok || data.error || !data.access_token) {
    const error = normalizeApiError(payload, "FLOWACCOUNT_TOKEN_FAILED");
    await markFlowAccountConnection({
      status: "ERROR",
      error: error.message,
    });
    throw error;
  }

  const expiresIn = Math.max(60, Number(data.expires_in || 86400));
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const accessToken = String(data.access_token);

  await saveFlowAccountAccessToken(accessToken, expiresAt);

  return { accessToken, expiresAt };
}

async function authenticatedFetch(
  path: string,
  init: RequestInit = {},
  retry = true
) {
  const settings = await getFlowAccountSettingsRaw();
  const token = await requestFlowAccountAccessToken(false);
  const baseUrl = getFlowAccountBaseUrl(settings.environment);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token.accessToken}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 && retry) {
    const fresh = await requestFlowAccountAccessToken(true);
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${fresh.accessToken}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
  }

  return response;
}

export async function testFlowAccountConnection() {
  const token = await requestFlowAccountAccessToken(true);
  await markFlowAccountConnection({
    status: "CONNECTED",
    error: null,
    tested: true,
  });
  return token;
}

export async function listFlowAccountProductSummaries(
  currentPage: number,
  pageSize = 250
): Promise<FlowAccountProductListResponse> {
  const params = new URLSearchParams({
    currentPage: String(currentPage),
    pageSize: String(Math.max(1, Math.min(250, pageSize))),
  });

  const response = await authenticatedFetch(
    `/product-masters?${params.toString()}`
  );
  const payload = await readJson(response);

  if (!response.ok) {
    throw normalizeApiError(payload, "FLOWACCOUNT_LIST_PRODUCTS_FAILED");
  }

  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : payload;

  const result = (data || {}) as Partial<FlowAccountProductListResponse>;
  return {
    total: Number(result.total || 0),
    currentPage: Number(result.currentPage || currentPage),
    list: Array.isArray(result.list) ? result.list : [],
  };
}

export async function getFlowAccountProductDetail(id: number) {
  const response = await authenticatedFetch(`/product-masters/${id}`);
  const payload = await readJson(response);

  if (!response.ok) {
    throw normalizeApiError(payload, "FLOWACCOUNT_PRODUCT_DETAIL_FAILED");
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }

  return payload;
}

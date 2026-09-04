"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./FlowAccountSettingsPage.css";

type ConnectionStatus = "NOT_CONFIGURED" | "CONNECTED" | "ERROR";
type Environment = "SANDBOX" | "PRODUCTION";

type Settings = {
  provider: "FLOWACCOUNT";
  environment: Environment;
  clientId: string;
  hasClientSecret: boolean;
  syncProducts: boolean;
  syncPrices: boolean;
  syncStock: boolean;
  connectionStatus: ConnectionStatus;
  tokenExpiresAt: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  lastSyncAt: string | null;
  updatedAt: string | null;
};

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
  settings?: Settings;
  result?: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    conflicts: number;
    errors: number;
  };
};

const emptySettings: Settings = {
  provider: "FLOWACCOUNT",
  environment: "SANDBOX",
  clientId: "",
  hasClientSecret: false,
  syncProducts: true,
  syncPrices: true,
  syncStock: true,
  connectionStatus: "NOT_CONFIGURED",
  tokenExpiresAt: null,
  lastError: null,
  lastTestedAt: null,
  lastSyncAt: null,
  updatedAt: null,
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: ConnectionStatus) {
  if (status === "CONNECTED") return "เชื่อมต่อแล้ว";
  if (status === "ERROR") return "เชื่อมต่อผิดพลาด";
  return "ยังไม่ได้เชื่อมต่อ";
}

export default function FlowAccountSettingsPage() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [syncResult, setSyncResult] = useState<ApiResponse["result"] | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/integrations/flowaccount", {
        cache: "no-store",
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok || !data.settings) {
        throw new Error(data.message || "โหลดการตั้งค่าไม่สำเร็จ");
      }

      setSettings(data.settings);
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "โหลดการตั้งค่าไม่สำเร็จ",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const canTest = useMemo(
    () => Boolean(settings.clientId && (settings.hasClientSecret || clientSecret.trim())),
    [settings.clientId, settings.hasClientSecret, clientSecret]
  );

  async function saveSettings() {
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/integrations/flowaccount", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          environment: settings.environment,
          clientId: settings.clientId,
          clientSecret,
          syncProducts: settings.syncProducts,
          syncPrices: settings.syncPrices,
          syncStock: settings.syncStock,
        }),
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok || !data.settings) {
        throw new Error(data.message || "บันทึกไม่สำเร็จ");
      }

      setSettings(data.settings);
      setClientSecret("");
      setNotice({ type: "success", text: "บันทึกการตั้งค่าแล้ว" });
      return true;
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    const saved = await saveSettings();
    if (!saved) return;

    setTesting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/integrations/flowaccount/test", {
        method: "POST",
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "ทดสอบการเชื่อมต่อไม่สำเร็จ");
      }

      setNotice({ type: "success", text: data.message || "เชื่อมต่อสำเร็จ" });
      await loadSettings();
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "ทดสอบการเชื่อมต่อไม่สำเร็จ",
      });
    } finally {
      setTesting(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/integrations/flowaccount/sync", {
        method: "POST",
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Sync ไม่สำเร็จ");
      }

      setSyncResult(data.result || null);
      setNotice({ type: "success", text: "Sync สินค้าจาก FlowAccount แล้ว" });
      await loadSettings();
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Sync ไม่สำเร็จ",
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="flowaccount-settings-page">
      <div className="flowaccount-settings-container">
        <section className="flowaccount-settings-header">
          <div>
            <div className="flowaccount-settings-breadcrumb">
              ตั้งค่าระบบ <span>/</span> FlowAccount
            </div>
            <h1>เชื่อมต่อ FlowAccount</h1>
            <p>ตั้งค่า API สำหรับ Sync สินค้า ราคา และสต๊อกเข้าสู่ SRR AND SUPPLY</p>
          </div>

          <div className={`flowaccount-status ${settings.connectionStatus.toLowerCase()}`}>
            <i />
            {statusLabel(settings.connectionStatus)}
          </div>
        </section>

        {notice && (
          <div className={`flowaccount-notice ${notice.type}`}>{notice.text}</div>
        )}

        {loading ? (
          <div className="flowaccount-loading">กำลังโหลดการตั้งค่า...</div>
        ) : (
          <div className="flowaccount-settings-grid">
            <section className="flowaccount-card">
              <div className="flowaccount-card-header">
                <div>
                  <h2>API Credentials</h2>
                  <p>Client Secret จะถูกเข้ารหัสใน MySQL และจะไม่แสดงกลับมาที่ Browser</p>
                </div>
                <span className="flowaccount-provider-badge">FLOWACCOUNT</span>
              </div>

              <div className="flowaccount-form">
                <label>
                  Environment
                  <select
                    value={settings.environment}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        environment: event.target.value as Environment,
                      }))
                    }
                  >
                    <option value="SANDBOX">Sandbox — ใช้สำหรับทดสอบ</option>
                    <option value="PRODUCTION">Production — ข้อมูลจริง</option>
                  </select>
                </label>

                <label>
                  Client ID
                  <input
                    value={settings.clientId}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        clientId: event.target.value,
                      }))
                    }
                    placeholder="FlowAccount Client ID"
                    autoComplete="off"
                  />
                </label>

                <label>
                  Client Secret
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(event) => setClientSecret(event.target.value)}
                    placeholder={
                      settings.hasClientSecret
                        ? "••••••••••••••••  (มี Secret อยู่แล้ว — เว้นว่างเพื่อใช้ตัวเดิม)"
                        : "กรอก FlowAccount Client Secret"
                    }
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className="flowaccount-actions">
                <button
                  type="button"
                  className="flowaccount-secondary-button"
                  disabled={!canTest || testing || saving}
                  onClick={() => void testConnection()}
                >
                  {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
                </button>

                <button
                  type="button"
                  className="flowaccount-primary-button"
                  disabled={saving}
                  onClick={() => void saveSettings()}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                </button>
              </div>
            </section>

            <section className="flowaccount-card">
              <div className="flowaccount-card-header">
                <div>
                  <h2>การ Sync ข้อมูล</h2>
                  <p>เลือกข้อมูลที่ต้องการให้ FlowAccount เป็นแหล่งข้อมูลหลัก</p>
                </div>
              </div>

              <div className="flowaccount-sync-options">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.syncProducts}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, syncProducts: event.target.checked }))
                    }
                  />
                  <span>
                    <strong>สินค้า</strong>
                    <small>สร้างสินค้าใหม่ใน SRR เมื่อพบ Product ใหม่ใน FlowAccount</small>
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={settings.syncPrices}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, syncPrices: event.target.checked }))
                    }
                  />
                  <span>
                    <strong>ราคาขาย</strong>
                    <small>อัปเดตราคาหน่วยหลักจาก FlowAccount</small>
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={settings.syncStock}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, syncStock: event.target.checked }))
                    }
                  />
                  <span>
                    <strong>สต๊อก</strong>
                    <small>ใช้ remainingStock ของสินค้านับสต๊อกเป็นยอดคงเหลือบนเว็บ</small>
                  </span>
                </label>
              </div>

              <div className="flowaccount-sync-meta">
                <div><span>ทดสอบล่าสุด</span><strong>{formatDate(settings.lastTestedAt)}</strong></div>
                <div><span>Sync ล่าสุด</span><strong>{formatDate(settings.lastSyncAt)}</strong></div>
                <div><span>Token หมดอายุ</span><strong>{formatDate(settings.tokenExpiresAt)}</strong></div>
              </div>

              {settings.lastError && (
                <div className="flowaccount-last-error">ล่าสุด: {settings.lastError}</div>
              )}

              {syncResult && (
                <div className="flowaccount-sync-result">
                  <span>ทั้งหมด <strong>{syncResult.total}</strong></span>
                  <span>สร้าง <strong>{syncResult.created}</strong></span>
                  <span>อัปเดต <strong>{syncResult.updated}</strong></span>
                  <span>ข้าม <strong>{syncResult.skipped}</strong></span>
                  <span>Conflict <strong>{syncResult.conflicts}</strong></span>
                  <span>Error <strong>{syncResult.errors}</strong></span>
                </div>
              )}

              <div className="flowaccount-actions">
                <button
                  type="button"
                  className="flowaccount-primary-button flowaccount-sync-button"
                  disabled={syncing || settings.connectionStatus !== "CONNECTED"}
                  onClick={() => void syncNow()}
                >
                  {syncing ? "กำลัง Sync..." : "↻ Sync FlowAccount ตอนนี้"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

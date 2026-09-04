# FlowAccount Product/Stock Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เชื่อม FlowAccount Client Credentials เข้ากับหลังบ้าน SRR และซิงก์ Product/Price/Stock ลง MySQL เพื่อให้หน้า Products และ Cart ใช้ข้อมูลจริงจากฐานข้อมูล

**Architecture:** Browser ติดต่อเฉพาะ Next.js API ของ SRR; Client Secret/Access Token ถูกเข้ารหัสใน MySQL และ FlowAccount calls เกิดเฉพาะ server-side. Product identity ใช้ `flowProductMasterId` ก่อนและ fallback `code`; ชื่อหน้าเว็บเป็น local override ขณะที่ stock/ราคา/หน่วยสามารถ sync จาก FlowAccount.

**Tech Stack:** Next.js 16 App Router, TypeScript, MySQL 8/mysql2, Node crypto AES-256-GCM, FlowAccount OpenAPI Client Credentials + New Product API `/product-masters`.

**Spec:** `docs/superpowers/specs/2026-09-02-flowaccount-product-stock-design.md`

## Global Constraints

- ใช้ฐาน MySQL เดิม `srr_auth_local`; ไม่สร้าง database ใหม่
- FlowAccount secrets ห้ามส่งกลับ browser และห้าม log
- Admin integration endpoints ต้องตรวจ `User.role = ADMIN`
- Stock ของสินค้านับสต๊อก (`type=5`) อิง `inventorySettings.remainingStock` จาก detail endpoint
- หน้า Products อ่าน MySQL ผ่าน `/api/products`, ไม่เรียก FlowAccount จาก browser
- ถ้า FlowAccount ล่ม/timeout ต้องคงข้อมูล Product เดิมไว้
- Match สินค้าด้วย Flow Product Master ID ก่อน; fallback ด้วย code; ห้าม match ด้วยชื่อ

---

### Task 1: Database schema for integration/products

**Files:**
- Create: `database/srr_flowaccount_product_stock.sql`
- Test: `tests/schema-contract.test.mjs`

**Interfaces:**
- Produces tables `IntegrationSetting`, `Product`, `ProductSyncLog`
- Produces a safe optional FK `CartItem.productId -> Product.id` only after product rows are available; initial migration keeps CartItem compatible

- [ ] Write a schema contract test checking required CREATE TABLE/UNIQUE keys and no destructive DROP.
- [ ] Run test and verify it fails before SQL exists.
- [ ] Add MySQL 8 migration SQL.
- [ ] Run test and verify pass.

### Task 2: Secret encryption and FlowAccount client

**Files:**
- Create: `lib/integrations/settings-crypto.ts`
- Create: `lib/integrations/flowaccount.ts`
- Test: `tests/settings-crypto.test.mjs`
- Test: `tests/flowaccount-mapping.test.mjs`

**Interfaces:**
- `encryptSettingSecret(value: string): string`
- `decryptSettingSecret(payload: string): string`
- `getFlowAccountAccessToken(settings): Promise<Token>`
- `listFlowAccountProductSummaries(...)`
- `getFlowAccountProductDetail(id, ...)`
- `mapFlowProductDetail(detail, options): FlowProductSyncRecord`

- [ ] Write failing round-trip/tamper tests for encryption.
- [ ] Write failing product mapping tests for main unit price and `remainingStock`.
- [ ] Implement AES-256-GCM helper using `SRR_SETTINGS_ENCRYPTION_KEY`.
- [ ] Implement client credentials token caching and FlowAccount fetch helpers.
- [ ] Run tests.

### Task 3: Admin authorization and settings persistence

**Files:**
- Create: `lib/auth/require-admin.ts`
- Create: `lib/integrations/flowaccount-settings-db.ts`
- Create: `app/api/admin/integrations/flowaccount/route.ts`
- Create: `app/api/admin/integrations/flowaccount/test/route.ts`

**Interfaces:**
- `requireAdminUser(): Promise<CurrentAuthUser>` throws typed unauthorized/forbidden errors
- GET settings returns masked secret state only
- PUT settings accepts environment/clientId/optional clientSecret/sync flags
- POST test obtains a token and stores connection status

- [ ] Add failing pure validation tests.
- [ ] Implement admin guard using `getCurrentAuthUser()`.
- [ ] Implement settings DB and masked API responses.
- [ ] Implement test-connection endpoint.
- [ ] Run tests/typecheck.

### Task 4: Product repository and FlowAccount sync

**Files:**
- Create: `lib/products/product-db.ts`
- Create: `lib/integrations/flowaccount-sync.ts`
- Create: `app/api/admin/integrations/flowaccount/sync/route.ts`
- Test: `tests/product-sync-policy.test.mjs`

**Interfaces:**
- `syncFlowAccountProducts(): Promise<SyncResult>`
- `upsertFlowProduct(record): Promise<{created:boolean; updated:boolean; conflict?:boolean}>`
- list endpoint uses page size 250; each summary is followed by detail fetch when stock sync is enabled

- [ ] Write failing policy tests for identity precedence and local website-name preservation.
- [ ] Implement upsert transaction rules.
- [ ] Implement paginated sync + detail fetch + sync log.
- [ ] Implement admin sync endpoint.
- [ ] Run tests.

### Task 5: Product public APIs

**Files:**
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[id]/route.ts`

**Interfaces:**
- GET `/api/products` -> `{ok:true, products:[...]}`
- Query: `search`, `category`, `status`, `includeInactive`
- GET `/api/products/:id` returns current product/stock/price

- [ ] Add repository filtering tests.
- [ ] Implement APIs over MySQL Product table.
- [ ] Run typecheck/tests.

### Task 6: FlowAccount admin UI and sidebar

**Files:**
- Create: `app/settings/flowaccount/page.tsx`
- Create: `app/settings/flowaccount/FlowAccountSettingsPage.tsx`
- Create: `app/settings/flowaccount/FlowAccountSettingsPage.css`
- Modify: `components/Sidebar.tsx`

**Interfaces:**
- Sidebar adds `ตั้งค่าระบบ > FlowAccount`
- Page loads settings, saves, tests connection, triggers sync, never receives decrypted secret

- [ ] Implement page using existing admin visual language.
- [ ] Add save/test/sync status UI and last sync details.
- [ ] Modify Sidebar menu.
- [ ] Run TypeScript parse/typecheck.

### Task 7: Convert Products page from demo to SQL API

**Files:**
- Modify: `app/products/page.tsx`
- Modify: `app/products/ProductsPage.module.css`

**Interfaces:**
- Products page fetches `/api/products?includeInactive=...`
- Existing Quick View/Cart shape stays compatible (`id,name,code,category,material,price,stock,image`)

- [ ] Add a failing data-normalization test.
- [ ] Remove hard-coded product array and load API data.
- [ ] Preserve filters/sort/Quick View/Cart UI.
- [ ] Add loading/error/empty handling.
- [ ] Run tests/typecheck.

### Task 8: Make cart use current Product stock/price

**Files:**
- Modify: `lib/cart/cart-db.ts`
- Modify: `app/api/cart/items/route.ts`
- Modify: `app/api/cart/sync/route.ts`
- Test: `tests/cart-authoritative-stock.test.mjs`

**Interfaces:**
- Cart resolve product by `productId` from Product table before insert/quantity update
- Quantity clamps to current `Product.stock`
- Returned cart DTO refreshes name/category/material/price/stock from Product table when possible

- [ ] Write failing authoritative-stock tests.
- [ ] Implement Product lookup and clamp rules.
- [ ] Keep legacy snapshot fallback only for guest/local cart and migration compatibility.
- [ ] Run cart tests.

### Task 9: Verification and packaging

**Files:**
- Create: `README-FLOWACCOUNT-TH.txt`
- Create bundle zip

- [ ] Run all Node tests.
- [ ] Run a TypeScript syntax/typecheck verification available in the bundle context.
- [ ] Scan SQL for destructive statements.
- [ ] Verify archive structure avoids `app/app` nesting.
- [ ] Package SQL + API + lib + UI + modified files.

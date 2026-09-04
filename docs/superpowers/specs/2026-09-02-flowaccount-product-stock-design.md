# SRR AND SUPPLY — FlowAccount + Product/Stock Integration Design

## Goal
เพิ่มระบบหลังบ้านสำหรับเก็บ Client ID / Client Secret ของ FlowAccount อย่างปลอดภัย และทำระบบซิงก์สินค้า ราคา และสต๊อกจาก FlowAccount ลง MySQL ของเว็บ SRR โดยไม่บังคับให้ชื่อสินค้าในเว็บตรงกับชื่อใน FlowAccount

## Current State
- Login/Register ใช้ MySQL
- Cart ใช้ MySQL สำหรับสมาชิก และ localStorage สำหรับ Guest
- Products ปัจจุบันยัง hard-code demo data
- Admin ใช้ AppShell + Sidebar

## Architecture
FlowAccount -> SRR Server -> MySQL -> /api/products -> Products / Cart / Checkout

Browser จะไม่เรียก FlowAccount โดยตรง

## Admin menu
เพิ่ม `ตั้งค่าระบบ > FlowAccount` ที่ `/settings/flowaccount`

## IntegrationSetting
เก็บ provider, environment, clientId, clientSecretEncrypted, accessTokenEncrypted, tokenExpiresAt, syncProducts, syncPrices, syncStock, connectionStatus, lastTestedAt, lastSyncAt, timestamps

Client Secret และ Access Token เข้ารหัสด้วย AES-GCM โดย key อยู่ใน `.env.local` (`SRR_SETTINGS_ENCRYPTION_KEY`)

## FlowAccount Authentication
ใช้ Client Credentials. Sandbox token endpoint: `https://openapi.flowaccount.com/test/token`. ส่ง grant_type=client_credentials, scope=flowaccount-api, client_id, client_secret. Cache token จนใกล้หมดอายุแล้วค่อยขอใหม่

## Product model
เพิ่ม Product ที่มี code unique, websiteName, websiteDescription, category, material, image, active, flowProductMasterId, flowName, flowCategoryName, flowType, unitName, sellPrice, stock, stockSource, lastSyncedAt, timestamps

## Product identity
1. flowProductMasterId
2. fallback code
3. ห้ามใช้ชื่อสินค้าเป็น key

ชื่อ FlowAccount กับชื่อเว็บต่างกันได้

## Source of truth
- Stock: FlowAccount
- Flow Product ID: FlowAccount
- Accounting product name: FlowAccount
- Unit: FlowAccount
- Price: FlowAccount เมื่อเปิด syncPrices
- Website name/description/image/material/category/SEO: SRR

## Sync FlowAccount -> SRR
- GET `/product-masters` แบบ paginated
- match ด้วย flowProductMasterId แล้ว fallback code
- สินค้าใหม่สร้างใน MySQL
- สินค้าเดิมอัปเดตเฉพาะ field ที่ FlowAccount เป็นเจ้าของ
- type=5 ใช้ `inventorySettings.remainingStock`
- code ว่างให้ใช้ flowProductMasterId เป็น identity
- code ซ้ำผิดปกติให้ log conflict และไม่ merge อัตโนมัติ

## SRR -> FlowAccount
รอบแรกไม่ทำ auto two-way sync. อนุญาตเฉพาะคำสั่ง explicit จาก Admin ในอนาคต เพื่อลดความเสี่ยงแก้ข้อมูลบัญชีโดยไม่ตั้งใจ

## API
- GET/PUT `/api/admin/integrations/flowaccount`
- POST `/api/admin/integrations/flowaccount/test`
- POST `/api/admin/integrations/flowaccount/sync`
- GET `/api/products`
- GET `/api/products/[id]`

## Products page
เปลี่ยนจาก hard-coded array เป็น `/api/products`. หน้าเว็บอ่าน MySQL เสมอ ไม่ยิง FlowAccount ทุก page view

## Cart
UI ใช้ stock จาก Product API และก่อน Checkout ต้อง re-check server-side

## Security
- Admin API ตรวจ role ADMIN
- Client Secret ไม่ส่งกลับ browser หลังบันทึก
- ไม่ log secret/token
- token/secret เข้ารหัสใน DB
- sandbox/production แยกชัดเจน

## SQL
ใช้ฐานเดิม `srr_auth_local`; เพิ่ม `IntegrationSetting`, `Product`, `ProductSyncLog`; ไม่สร้าง database ใหม่

## Error Handling
- invalid_client -> แจ้ง Client ID/Secret ไม่ถูกต้อง
- timeout -> เก็บสินค้าเดิมไว้
- partial sync failure -> log และทำรายการอื่นต่อ
- duplicate code conflict -> ไม่ merge อัตโนมัติ

## Initial Scope
1. SQL tables
2. encryption helper
3. FlowAccount client
4. admin settings page
5. test connection
6. product sync FlowAccount -> MySQL
7. products API
8. Products page -> SQL
9. Sidebar menu
10. Cart stock source integration

Not in first pass: scheduler, webhook, checkout/order posting to FlowAccount, image sync, automatic two-way stock edits


Implementation note: รายการ `/product-masters` เป็น summary; stock sync ใช้ detail `/product-masters/:id` เพื่ออ่าน `inventorySettings.remainingStock`.

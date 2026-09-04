SRR AND SUPPLY — FLOWACCOUNT + PRODUCT + STOCK
============================================================

ชุดนี้ต่อจากระบบ Login/MySQL + Cart/MySQL ที่ทำไว้ก่อนหน้า

สิ่งที่ชุดนี้เพิ่ม
------------------------------------------------------------
1) ตาราง IntegrationSetting
2) ตาราง Product
3) ตาราง ProductSyncLog
4) หลังบ้าน /settings/flowaccount
5) เก็บ Client ID / Client Secret ผ่านหลังบ้าน
6) Client Secret + Access Token เข้ารหัสก่อนลง MySQL
7) Test Connection
8) Sync Product / Price / Stock จาก FlowAccount
9) /api/products อ่านสินค้า MySQL
10) หน้า Products เลิกใช้ const products demo และอ่าน API/SQL
11) Cart สมาชิก clamp จำนวนด้วย stock ปัจจุบันใน Product SQL
12) Sidebar เพิ่ม ตั้งค่าระบบ > FlowAccount

สำคัญ
------------------------------------------------------------
- ไม่ต้องสร้าง Database ใหม่
- ใช้ฐานเดิม: srr_auth_local
- ต้องมีตาราง User/AuthSession/Cart/CartItem จากชุดก่อนหน้า
- FlowAccount Client ID/Secret ไม่ต้องใส่ใน .env.local
- .env.local เก็บแค่ Master Encryption Key ของเว็บ

============================================================
STEP 1 — วางไฟล์
============================================================

แตก ZIP แล้ว merge ที่ ROOT โปรเจกต์

ถูก:
  srr-and-supply-ecommerce/
    app/
    components/
    lib/
    database/
    scripts/

ผิด:
  srr-and-supply-ecommerce/app/app/...

ถ้าระบบหลังบ้านของคุณใช้ Next.js route group เช่น:
  app/(admin)/layout.tsx
ให้เอาโฟลเดอร์ settings/flowaccount ไปอยู่ route group เดียวกับ
product-categories เพื่อให้ AppShell/Sidebar ครอบหน้า โดย URL ยังเป็น:
  /settings/flowaccount

============================================================
STEP 2 — รัน SQL
============================================================

เปิด HeidiSQL > เลือก MySQL > เปิดไฟล์:
  database/srr_flowaccount_product_stock.sql

แล้วกด Run

SQL ใช้ฐานเดิม:
  srr_auth_local

หลังรันควรเห็น:
  User
  AuthSession
  Cart
  CartItem
  IntegrationSetting
  Product
  ProductSyncLog

SQL จะย้ายสินค้า demo เดิม 8 รายการเข้า Product โดยรักษา id 1-8
เพื่อให้ Cart เดิมยังอ้าง productId ได้

ตรวจสอบ:
  SELECT id, code, websiteName, sellPrice, stock, stockSource
  FROM Product
  ORDER BY id;

============================================================
STEP 3 — สร้าง Encryption Key ครั้งเดียว
============================================================

เปิด PowerShell ที่ ROOT โปรเจกต์ แล้วรัน:

  node scripts/setup-flowaccount-key.mjs

ระบบจะสร้าง/เติมบรรทัดนี้ใน .env.local ให้อัตโนมัติ:

  SRR_SETTINGS_ENCRYPTION_KEY="..."

อย่าลบ/เปลี่ยน key หลังจากบันทึก FlowAccount Secret แล้ว
เพราะ Secret/Token ใน SQL ถูกเข้ารหัสด้วย key นี้

อย่า commit .env.local ขึ้น GitHub

============================================================
STEP 4 — ให้บัญชีหลังบ้านเป็น ADMIN
============================================================

API FlowAccount อนุญาตเฉพาะ role ADMIN

ดูบัญชีก่อน:

  SELECT id, fullName, email, role, status
  FROM User;

จากนั้นเปลี่ยนเฉพาะบัญชีที่คุณใช้เป็นผู้ดูแล เช่น:

  UPDATE User
  SET role = 'ADMIN'
  WHERE email = 'อีเมลของคุณ';

แล้ว Logout / Login ใหม่ 1 ครั้ง

============================================================
STEP 5 — Restart Next.js
============================================================

  Ctrl + C
  npm run dev

============================================================
STEP 6 — ใส่ FlowAccount Key ผ่านหลังบ้าน
============================================================

เปิด:
  http://localhost:3000/settings/flowaccount

ช่วงทดสอบเลือก:
  Sandbox

กรอก:
  Client ID
  Client Secret

กด:
  บันทึกการตั้งค่า
  ทดสอบการเชื่อมต่อ

หลังบันทึก Client Secret ช่องจะไม่แสดงค่าจริงกลับมา
Browser จะรู้แค่ว่า "มี Secret แล้ว"

============================================================
STEP 7 — Sync สินค้า
============================================================

ในหน้า FlowAccount เปิด/ปิดได้:
  [x] สินค้า
  [x] ราคาขาย
  [x] สต๊อก

แล้วกด:
  Sync FlowAccount ตอนนี้

ระบบทำ:
  GET /product-masters แบบ paginated (สูงสุด 250 ต่อหน้า)
  GET /product-masters/:id เพื่ออ่านรายละเอียด/remainingStock
  จับคู่สินค้า:
    1. flowProductMasterId
    2. code

ไม่ใช้ชื่อสินค้าเป็น key

ตัวอย่าง:
  FlowAccount code = OR-VITON-M40
  FlowAccount name = ORING VITON M40

  SRR code = OR-VITON-M40
  SRR websiteName = O-Ring Viton M40 ซีลทนสารเคมี

ถือเป็นสินค้าตัวเดียวกัน
websiteName ของ SRR ไม่ถูก FlowAccount ทับ

============================================================
SOURCE OF TRUTH
============================================================

FlowAccount:
  - Flow Product ID
  - Flow name
  - Unit
  - Price เมื่อเปิด Sync ราคา
  - Stock เมื่อเปิด Sync สต๊อก

SRR Website:
  - websiteName
  - websiteDescription
  - image
  - material
  - category หน้าเว็บ

Product table เก็บทั้งค่าหน้าเว็บและค่า flow* เพื่อแยกกันชัดเจน

============================================================
STOCK
============================================================

สินค้าประเภทนับสต๊อก FlowAccount type=5:
  inventorySettings.remainingStock

จะถูกบันทึกเป็น:
  Product.flowStock

และถ้าเปิด Sync สต๊อก:
  Product.stock
  Product.stockSource = FLOWACCOUNT

หน้า Products อ่าน Product.stock จาก MySQL
Cart สมาชิกจะเช็ก Product.stock ปัจจุบันอีกครั้งตอนเขียน/แก้จำนวน
จึงไม่เชื่อ stockSnapshot จาก browser เป็นตัวจริง

============================================================
ราคา
============================================================

ใช้ sellPrice ของ Main Product List
เก็บเป็น:
  Product.flowSellPrice

ถ้าเปิด Sync ราคา:
  Product.sellPrice = FlowAccount main sellPrice

============================================================
ถ้า FlowAccount ล่ม
============================================================

- Product เดิมใน MySQL ไม่ถูกลบ
- หน้าเว็บยังอ่านข้อมูลล่าสุดที่ Sync สำเร็จจาก MySQL
- Sync error เก็บใน ProductSyncLog

============================================================
ยังไม่ได้ทำในชุดนี้
============================================================

- Auto Sync ทุก 1-5 นาที
- Webhook
- Checkout -> สร้างเอกสาร FlowAccount
- Auto push สินค้าจาก SRR -> FlowAccount ทุกการแก้ไข
- อัปโหลดรูปสินค้าในหลังบ้าน

ชุดนี้วางฐานไว้รองรับต่อได้โดยไม่ต้องรื้อ Product table

============================================================
TEST SQL
============================================================

SELECT
  id,
  code,
  websiteName,
  flowName,
  flowProductMasterId,
  sellPrice,
  flowSellPrice,
  stock,
  flowStock,
  stockSource,
  lastSyncedAt
FROM Product
ORDER BY id;

SELECT
  provider,
  environment,
  clientId,
  connectionStatus,
  syncProducts,
  syncPrices,
  syncStock,
  tokenExpiresAt,
  lastTestedAt,
  lastSyncAt
FROM IntegrationSetting
WHERE provider = 'FLOWACCOUNT';

SELECT
  runId,
  action,
  status,
  productId,
  flowProductMasterId,
  productCode,
  message,
  createdAt
FROM ProductSyncLog
ORDER BY createdAt DESC
LIMIT 100;

============================================================
SECURITY
============================================================

- ห้ามใส่ FlowAccount Client Secret ใน Client Component โดยตรง
- ห้าม console.log Client Secret / Access Token
- ห้าม commit .env.local
- ถ้าย้ายขึ้น Vercel/Server ภายหลัง ต้องตั้งค่า
  SRR_SETTINGS_ENCRYPTION_KEY เป็นค่าเดิมใน Environment Variables
  ก่อนใช้ข้อมูล Secret ที่เข้ารหัสไว้เดิม

SRR AND SUPPLY - PRODUCT CATEGORIES + CUSTOMER FILE IMPORT
==========================================================


สิ่งที่ชุดนี้ทำ
1. หมวดหมู่สินค้าเก็บใน MySQL จริง (ProductCategory)
2. เพิ่ม / แก้ไข / ลบหมวดหมู่จาก Admin
3. จำนวนสินค้าในหมวดนับจาก Product จริง
4. ปุ่มนำเข้ารองรับ .xlsx / .xls / .csv
5. รูปแบบไฟล์ลูกค้า:
   NO. | ITEM | TG_NO | TYPE | SIZE & MAT. | ราคา
6. TG_NO -> Product.code
7. TYPE -> Product.category และสร้างหมวดใหม่อัตโนมัติถ้ายังไม่มี
8. SIZE & MAT. -> ชื่อสินค้า + วัสดุ
9. ราคา -> sellPrice สำหรับสินค้า Local
10. TG_NO ว่าง -> ไม่นำเข้า
11. รหัสซ้ำ -> ค่าเริ่มต้นข้าม หรือเลือกอัปเดตได้
12. สินค้าที่เชื่อม FlowAccount แล้ว จะไม่ถูก Import ทับ sellPrice จาก Flow
13. Import ไม่แตะ flowProductMasterId และ Flow fields


ตัวอย่างจากไฟล์ลูกค้า
G02580V | O-Ring | 3.68*1.78 VK9 | 1
=>
code        = G02580V
websiteName = O-Ring 3.68*1.78 VK9
category    = O-Ring
material    = VK9
sellPrice   = 1


หลังได้ FlowAccount API
ถ้า FlowAccount มี code=G02580V ระบบ Sync เดิมจะจับคู่ด้วย code
แล้วบันทึก flowProductMasterId ให้สินค้าตัวเดิม ไม่สร้างซ้ำ


ขั้นตอนหลัง Installer
A) เปิด HeidiSQL แล้วรัน:
   database/srr_product_categories_import.sql


B) ถ้า Installer จบด้วย Build ผ่าน ให้เปิด:
   npm run dev


C) เปิด:
   http://localhost:3000/admin/product-categories


D) กด นำเข้าข้อมูล แล้วเลือกไฟล์ Excel/CSV ของลูกค้า


สำคัญ
- อย่ารัน srr_flowaccount_product_stock.sql ตัวเก่าซ้ำ เพราะไฟล์เก่ามี Demo Product 8 ตัว
- Installer สร้าง backup ไฟล์ที่แก้ไว้ในโฟลเดอร์ _backup_categories_import_...
- ถ้าแพตช์หน้าเพิ่มสินค้า/Products/Home ไม่ตรงกับไฟล์รุ่นปัจจุบัน Installer จะข้ามแทนการเขียนไฟล์เสี่ยง
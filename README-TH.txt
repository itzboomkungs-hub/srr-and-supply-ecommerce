SRR AND SUPPLY — PRODUCT ADMIN READY
=====================================


ชุดนี้เพิ่มหน้า Admin สำหรับสร้างสินค้าโดยใช้ MySQL ก่อน และเตรียม field สำหรับ FlowAccount ในอนาคต


หลักการ:
- ตอนนี้เพิ่มสินค้าในเว็บ -> MySQL -> /api/products -> หน้า Products
- สินค้าใหม่เริ่มด้วย syncStatus=LOCAL_ONLY และ stockSource=LOCAL
- เมื่อได้ FlowAccount API แล้ว Sync จะจับคู่ด้วย flowProductMasterId ก่อน และ fallback ด้วย code
- ชื่อสินค้าเว็บ websiteName ไม่จำเป็นต้องตรงกับ FlowAccount
- ถ้า code ตรงกัน ให้ผูก flowProductMasterId กับสินค้าเดิม ไม่สร้างซ้ำ


ติดตั้ง:
1) แตก ZIP แล้ว merge ที่ ROOT โปรเจกต์
2) ถ้ายังไม่มี mysql2: npm install mysql2
3) รัน database/srr_product_admin_upgrade.sql ใน HeidiSQL ที่ฐาน srr_auth_local
4) Restart: npm run dev
5) เปิด http://localhost:3000/admin/products/new
6) ต้อง Login ด้วย role=ADMIN และ status=ACTIVE


รูปสินค้า:
- Local/Laragon: บันทึกที่ public/uploads/products
- ก่อนขึ้น Vercel จริงควรย้ายไป Blob/S3/Cloudinary เพราะ filesystem บน deployment ไม่ใช่ที่เก็บถาวร


Sidebar:
เปิด components/Sidebar.tsx แล้วเพิ่มเมนูตามไฟล์ SIDEBAR-PATCH.txt


หน้า Products ปัจจุบันของคุณอ่าน /api/products จาก MySQL อยู่แล้ว ดังนั้นสินค้าที่สร้างจะโผล่บนหน้าเว็บโดยไม่ใช้ const demo
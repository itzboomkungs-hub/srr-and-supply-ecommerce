"use client";


import { useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProductCreatePage.module.css";


type ProductType = "SERVICE" | "NON_STOCK" | "STOCK";
type TaxType = "EXCLUDE_VAT" | "INCLUDE_VAT" | "NO_VAT";
const categories = ["O-Ring","Oil Seal","Hydraulic Seal","Pneumatic Seal","Rotary Seal","Gasket","Pump Parts","Valve","Industrial Parts","Repair Kit","อื่น ๆ"];
const units = ["ชิ้น","ชุด","กล่อง","แพ็ค","ม้วน","เส้น","ตัว","อัน","เมตร","กิโลกรัม"];


export default function ProductCreatePage() {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>("STOCK");
  const [websiteName, setWebsiteName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [unitName, setUnitName] = useState("ชิ้น");
  const [barcode, setBarcode] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("EXCLUDE_VAT");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [incomeAccountCode, setIncomeAccountCode] = useState("41210");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  const previews = useMemo(() => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [imageFiles]);


  function addImages(files: FileList | File[]) {
    const accepted = Array.from(files).filter((f) => ["image/jpeg","image/png","image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024);
    setImageFiles((current) => [...current, ...accepted].slice(0, 10));
  }


  function imageInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addImages(event.target.files);
    event.target.value = "";
  }


  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    addImages(event.dataTransfer.files);
  }


  async function uploadImages() {
    if (!imageFiles.length) return [];
    const form = new FormData();
    imageFiles.forEach((file) => form.append("images", file));
    const response = await fetch("/api/admin/products/upload", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.message || "อัปโหลดรูปไม่สำเร็จ");
    return Array.isArray(data.images) ? data.images : [];
  }


  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(""); setMessage("");
    if (!websiteName.trim()) return setError("กรุณากรอกชื่อสินค้า");
    if (!code.trim()) return setError("กรุณากรอกรหัสสินค้า");
    setSaving(true);
    try {
      const images = await uploadImages();
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType, websiteName: websiteName.trim(), code: code.trim(), category, material: material.trim(), unitName,
          barcode: barcode.trim(), sellPrice: Number(sellPrice || 0), taxType, websiteDescription: description.trim(),
          stock: productType === "STOCK" ? Number(stock || 0) : 0, lowStockThreshold: Number(lowStockThreshold || 0),
          incomeAccountCode: incomeAccountCode.trim(), images,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "เพิ่มสินค้าไม่สำเร็จ");
      setMessage("เพิ่มสินค้าเรียบร้อย");
      setTimeout(() => { router.push("/admin/products"); router.refresh(); }, 500);
    } catch (e) { setError(e instanceof Error ? e.message : "เพิ่มสินค้าไม่สำเร็จ"); }
    finally { setSaving(false); }
  }


  return <main className={styles.page}>
    <form onSubmit={submit}>
      <header className={styles.header}>
        <div><div className={styles.breadcrumb}>จัดการสินค้า <span>/</span> สร้างสินค้า</div><h1>สร้างบริการหรือสินค้า</h1><p>เพิ่มสินค้าเข้าสู่ SRR และเตรียมพร้อมสำหรับเชื่อม FlowAccount</p></div>
        <div className={styles.actions}><button type="button" className={styles.cancel} onClick={() => router.back()}>ยกเลิก</button><button className={styles.save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div>
      </header>


      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}


      <section className={styles.card}><h2>ประเภทสินค้า</h2><div className={styles.types}>
        {([ ["SERVICE","☁","บริการ","ไม่มีการนับสต๊อก"], ["NON_STOCK","▣","สินค้าไม่นับสต๊อก","ขายสินค้าแต่ไม่ควบคุมจำนวน"], ["STOCK","▥","สินค้านับสต๊อก","ใช้จำนวนคงเหลือกับหน้าเว็บและตะกร้า"] ] as const).map(([value,icon,title,sub]) =>
          <button key={value} type="button" className={`${styles.typeButton} ${productType===value ? styles.active : ""}`} onClick={() => setProductType(value)}><b>{icon}</b><span><strong>{title}</strong><small>{sub}</small></span></button>
        )}
      </div></section>


      <section className={styles.card}><h2>ข้อมูลสินค้า</h2>
        <label className={styles.upload} onDragOver={(e)=>e.preventDefault()} onDrop={drop}><input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={imageInput}/><b>⊞</b><strong>เลือกไฟล์ หรือลากไฟล์วางที่นี่</strong><small>สูงสุด 10 รูป · JPG, PNG, WEBP · ไม่เกิน 5 MB ต่อรูป</small></label>
        {!!previews.length && <div className={styles.images}>{previews.map((p,i)=><div className={styles.preview} key={`${p.file.name}-${i}`}><img src={p.url} alt=""/><button type="button" onClick={()=>setImageFiles((c)=>c.filter((_,x)=>x!==i))}>×</button>{i===0 && <span>รูปหลัก</span>}</div>)}</div>}
        <div className={styles.grid}>
          <label><span>ชื่อสินค้า *</span><input value={websiteName} onChange={(e)=>setWebsiteName(e.target.value)} placeholder="ระบุชื่อสินค้า"/></label>
          <label><span>รหัสสินค้า *</span><input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="เช่น OR-VITON-M40"/><small>ใช้รหัสนี้จับคู่กับ FlowAccount ในอนาคต</small></label>
          <label><span>หมวดสินค้า</span><select value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">ระบุหมวดสินค้า</option>{categories.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label><span>หน่วยสินค้าหลัก</span><select value={unitName} onChange={(e)=>setUnitName(e.target.value)}>{units.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label><span>วัสดุ</span><input value={material} onChange={(e)=>setMaterial(e.target.value)} placeholder="NBR, Viton, EPDM"/></label>
          <label><span>เลขบาร์โค้ด</span><input value={barcode} onChange={(e)=>setBarcode(e.target.value)} placeholder="ระบุเลขบาร์โค้ด"/></label>
        </div>
      </section>


      <section className={styles.card}><h2>ข้อมูลการขาย</h2><div className={styles.grid}>
        <label><span>ราคาขาย</span><input type="number" min="0" step="0.01" value={sellPrice} onChange={(e)=>setSellPrice(e.target.value)} placeholder="0.00"/></label>
        <label><span>ภาษีมูลค่าเพิ่ม</span><select value={taxType} onChange={(e)=>setTaxType(e.target.value as TaxType)}><option value="EXCLUDE_VAT">ราคายังไม่รวม VAT</option><option value="INCLUDE_VAT">ราคารวม VAT</option><option value="NO_VAT">ไม่มี VAT</option></select></label>
      </div><label className={styles.full}><span>รายละเอียดสินค้า</span><textarea rows={5} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="รายละเอียดสินค้า คุณสมบัติ การใช้งาน ขนาด หรือข้อมูลเพิ่มเติม"/></label></section>


      {productType === "STOCK" && <section className={styles.card}><h2>ข้อมูลสต๊อก</h2><div className={styles.grid}>
        <label><span>จำนวนเริ่มต้น</span><input type="number" min="0" step="1" value={stock} onChange={(e)=>setStock(e.target.value)} placeholder="0"/></label>
        <label><span>แจ้งเตือนเมื่อเหลือ</span><input type="number" min="0" step="1" value={lowStockThreshold} onChange={(e)=>setLowStockThreshold(e.target.value)}/></label>
      </div><div className={styles.notice}><strong>Stock source: SRR MySQL</strong><span>เมื่อเปิด FlowAccount Sync สินค้าที่จับคู่สำเร็จสามารถเปลี่ยนไปใช้สต๊อกจาก FlowAccount ได้</span></div></section>}


      <section className={styles.card}><h2>กำหนดการลงบัญชี</h2><label className={styles.full}><span>บัญชีรายได้</span><select value={incomeAccountCode} onChange={(e)=>setIncomeAccountCode(e.target.value)}><option value="41210">41210 / รายได้จากการขายสินค้า</option><option value="41220">41220 / รายได้จากการให้บริการ</option></select></label></section>


      <section className={`${styles.card} ${styles.flow}`}><div><h2>FlowAccount</h2><p>สินค้านี้จะถูกสร้างใน SRR ก่อน และยังไม่ส่งเข้า FlowAccount จนกว่าจะเปิดการเชื่อมต่อ</p></div><div className={styles.flowStatus}><span>LOCAL ONLY</span><strong>ตอน Sync ระบบจะค้นหารหัสสินค้าเดียวกันก่อน</strong><small>ถ้าพบรหัสตรงกัน จะเก็บ Flow Product Master ID และไม่สร้างรายการซ้ำ</small></div></section>
    </form>
  </main>;
}
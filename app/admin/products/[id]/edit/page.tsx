"use client";


import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./ProductEditPage.module.css";


type Category = { id: number; name: string };
type Product = {
  id: number;
  code: string;
  websiteName: string;
  websiteDescription: string;
  category: string;
  material: string;
  active: boolean;
  flowProductMasterId: number | null;
  unitName: string;
  sellPrice: number;
  stock: number;
  stockSource: "LOCAL" | "FLOWACCOUNT";
  productType: "SERVICE" | "NON_STOCK" | "STOCK";
  barcode: string;
  taxType: string;
  lowStockThreshold: number;
  incomeAccountCode: string;
  images?: string[];
};


export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");


  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  useEffect(() => {
    let cancelled = false;


    async function load() {
      setLoading(true);
      setError("");


      try {
        const [productResponse, categoryResponse] = await Promise.all([
          fetch(`/api/admin/products/${id}`, { cache: "no-store" }),
          fetch("/api/product-categories", { cache: "no-store" }),
        ]);


        const productData = await productResponse.json();
        const categoryData = await categoryResponse.json();


        if (!productResponse.ok || !productData?.ok || !productData?.product) {
          throw new Error(productData?.message || "โหลดข้อมูลสินค้าไม่สำเร็จ");
        }


        if (!cancelled) {
          setProduct({
            ...productData.product,
            websiteDescription: productData.product.websiteDescription || "",
            material: productData.product.material || "",
            unitName: productData.product.unitName || "ชิ้น",
            barcode: productData.product.barcode || "",
            taxType: productData.product.taxType || "EXCLUDE_VAT",
            incomeAccountCode: productData.product.incomeAccountCode || "",
          });


          if (categoryResponse.ok && categoryData?.ok && Array.isArray(categoryData?.categories)) {
            setCategories(categoryData.categories);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลสินค้าไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }


    if (id) void load();
    return () => { cancelled = true; };
  }, [id]);


  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((current) => current ? { ...current, [key]: value } : current);
  }


  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || saving) return;


    setSaving(true);
    setError("");
    setMessage("");


    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await response.json();


      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "แก้ไขสินค้าไม่สำเร็จ");
      }


      setMessage(data?.message || "บันทึกการแก้ไขสินค้าเรียบร้อย");
      window.dispatchEvent(new Event("srr-products-updated"));
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 450);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "แก้ไขสินค้าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return <main className={styles.page}><div className={styles.state}>กำลังโหลดข้อมูลสินค้า...</div></main>;
  }


  if (!product) {
    return <main className={styles.page}><div className={styles.state}>{error || "ไม่พบสินค้า"}</div></main>;
  }


  const priceLocked = product.flowProductMasterId != null;
  const stockLocked = product.stockSource === "FLOWACCOUNT";


  return (
    <main className={styles.page}>
      <form className={styles.container} onSubmit={submit}>
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>จัดการสินค้า <span>/</span> แก้ไขสินค้า</div>
            <h1>แก้ไขสินค้า</h1>
            <p>{product.code} · ID {product.id}</p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={() => router.push("/admin/products")}>ยกเลิก</button>
            <button type="submit" className={styles.save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
          </div>
        </header>


        {error && <div className={styles.alertError}>{error}</div>}
        {message && <div className={styles.alertSuccess}>{message}</div>}


        <section className={styles.card}>
          <h2>ข้อมูลสินค้า</h2>
          <div className={styles.grid}>
            <label>รหัสสินค้า *<input value={product.code} onChange={(e) => update("code", e.target.value)} /></label>
            <label>ชื่อสินค้า *<input value={product.websiteName} onChange={(e) => update("websiteName", e.target.value)} /></label>
            <label>หมวดสินค้า<select value={product.category} onChange={(e) => update("category", e.target.value)}><option value="">ไม่มีหมวด</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
            <label>วัสดุ<input value={product.material} onChange={(e) => update("material", e.target.value)} /></label>
            <label>หน่วยสินค้า<input value={product.unitName} onChange={(e) => update("unitName", e.target.value)} /></label>
            <label>บาร์โค้ด<input value={product.barcode} onChange={(e) => update("barcode", e.target.value)} /></label>
            <label>ประเภทสินค้า<select value={product.productType} onChange={(e) => update("productType", e.target.value as Product["productType"])}><option value="STOCK">สินค้านับสต๊อก</option><option value="NON_STOCK">สินค้าไม่นับสต๊อก</option><option value="SERVICE">บริการ</option></select></label>
            <label>ภาษี<select value={product.taxType} onChange={(e) => update("taxType", e.target.value)}><option value="EXCLUDE_VAT">ยังไม่รวม VAT</option><option value="INCLUDE_VAT">รวม VAT</option><option value="NO_VAT">ไม่มี VAT</option></select></label>
            <label>ราคาต่อหน่วย<input type="number" min="0" step="0.01" disabled={priceLocked} value={product.sellPrice} onChange={(e) => update("sellPrice", Number(e.target.value || 0))} />{priceLocked && <small>สินค้านี้เชื่อม FlowAccount แล้ว ราคาไม่ถูกหน้าเว็บทับ</small>}</label>
            <label>จำนวนคงคลัง<input type="number" min="0" step="1" disabled={stockLocked || product.productType !== "STOCK"} value={product.stock} onChange={(e) => update("stock", Number(e.target.value || 0))} />{stockLocked && <small>Stock มาจาก FlowAccount</small>}</label>
            <label>จุดแจ้งเตือนสต็อก<input type="number" min="0" value={product.lowStockThreshold} onChange={(e) => update("lowStockThreshold", Number(e.target.value || 0))} /></label>
            <label>สถานะ<select value={product.active ? "ACTIVE" : "INACTIVE"} onChange={(e) => update("active", e.target.value === "ACTIVE")}><option value="ACTIVE">ใช้งาน</option><option value="INACTIVE">ปิดใช้งาน</option></select></label>
          </div>
          <label className={styles.full}>รายละเอียดสินค้า<textarea rows={5} value={product.websiteDescription} onChange={(e) => update("websiteDescription", e.target.value)} /></label>
        </section>


        {(product.flowProductMasterId != null || product.stockSource === "FLOWACCOUNT") && (
          <section className={styles.flowNotice}>
            <strong>สินค้านี้เชื่อม FlowAccount</strong>
            <span>แก้ไขชื่อเว็บ หมวดหมู่ วัสดุ และรายละเอียดได้ตามปกติ แต่ค่าที่ FlowAccount เป็นเจ้าของจะไม่ถูกเขียนทับจากหน้านี้</span>
          </section>
        )}
      </form>
    </main>
  );
}
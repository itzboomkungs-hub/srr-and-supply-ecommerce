"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import "./ProductCategoriesPage.css";


type Category = {
  id: number;
  name: string;
  code: string;
  description: string;
  productCount: number;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
  updatedAt: string;
};


type ImportStatus = "READY" | "EXISTS" | "INVALID" | "DUPLICATE_FILE";


type ImportRow = {
  sourceRow: number;
  no: string;
  sourceItem: string;
  code: string;
  category: string;
  sizeMaterial: string;
  material: string;
  price: number;
  websiteName: string;
  valid: boolean;
  error: string;
  status: ImportStatus;
  message: string;
  existingProductId: number | null;
  linkedToFlow: boolean;
  newCategory: boolean;
};


type ImportPreview = {
  fileName: string;
  sheetName: string;
  summary: {
    total: number;
    ready: number;
    existing: number;
    invalid: number;
    duplicateFile: number;
  };
  newCategories: string[];
  rows: ImportRow[];
};


function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}


function statusLabel(status: ImportStatus) {
  if (status === "READY") return "พร้อมนำเข้า";
  if (status === "EXISTS") return "มีอยู่แล้ว";
  if (status === "DUPLICATE_FILE") return "ซ้ำในไฟล์";
  return "ไม่นำเข้า";
}


export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [saving, setSaving] = useState(false);


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<"SKIP" | "UPDATE">("SKIP");
  const [importSaving, setImportSaving] = useState(false);


  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/product-categories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {
        throw new Error(data?.message || "โหลดหมวดหมู่ไม่สำเร็จ");
      }
      setCategories(data.categories);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดหมวดหมู่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void loadCategories();
  }, []);


  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.code.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" || category.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);


  const totalProducts = categories.reduce((sum, category) => sum + Number(category.productCount || 0), 0);
  const activeCount = categories.filter((category) => category.status === "ACTIVE").length;
  const emptyCount = categories.filter((category) => Number(category.productCount || 0) === 0).length;


  function openCreate() {
    setEditingCategory(null);
    setName("");
    setCode("");
    setDescription("");
    setStatus("ACTIVE");
    setError("");
    setSuccess("");
    setShowModal(true);
  }


  function openEdit(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setCode(category.code);
    setDescription(category.description || "");
    setStatus(category.status);
    setError("");
    setSuccess("");
    setShowModal(true);
  }


  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingCategory(null);
  }


  async function saveCategory() {
    if (!name.trim() || !code.trim()) {
      setError("กรุณากรอกชื่อและรหัสหมวดหมู่");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        editingCategory
          ? `/api/admin/product-categories/${editingCategory.id}`
          : "/api/admin/product-categories",
        {
          method: editingCategory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim(),
            status,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");
      setShowModal(false);
      setEditingCategory(null);
      setSuccess(data?.message || "บันทึกหมวดหมู่เรียบร้อย");
      await loadCategories();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }


  async function deleteCategory(category: Category) {
    if (!window.confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/product-categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "ลบไม่สำเร็จ");
      setSuccess(data?.message || "ลบหมวดหมู่เรียบร้อย");
      await loadCategories();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "ลบไม่สำเร็จ");
    }
  }


  async function previewFile(file: File) {
    setImportLoading(true);
    setError("");
    setSuccess("");
    setImportPreview(null);
    setDuplicateMode("SKIP");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/products/import/preview", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "อ่านไฟล์ไม่สำเร็จ");
      setImportPreview(data as ImportPreview);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "อ่านไฟล์ไม่สำเร็จ");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }


  async function commitImport() {
    if (!importPreview || importSaving) return;
    setImportSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: importPreview.fileName,
          duplicateMode,
          rows: importPreview.rows,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.message || "นำเข้าไม่สำเร็จ");
      setImportPreview(null);
      setSuccess(data?.message || "นำเข้าสินค้าเรียบร้อย");
      await loadCategories();
      window.dispatchEvent(new Event("srr-products-updated"));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setImportSaving(false);
    }
  }


  function exportCategories() {
    const header = ["name", "code", "description", "status", "productCount"];
    const rows = categories.map((category) => [
      category.name,
      category.code,
      category.description,
      category.status,
      String(category.productCount),
    ]);
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "srr-product-categories.csv";
    link.click();
    URL.revokeObjectURL(url);
  }


  return (
    <main className="product-categories-page">
      <div className="product-categories-container">
        <section className="product-categories-header">
          <div>
            <div className="product-categories-breadcrumb">
              จัดการสินค้า <span>/</span> หมวดหมู่สินค้า
            </div>
            <h1>หมวดหมู่สินค้า</h1>
            <p>หมวดหมู่จริงจาก MySQL ใช้ร่วมกับสินค้าและการนำเข้าไฟล์ลูกค้า</p>
          </div>
          <div className="product-categories-header-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void previewFile(file);
              }}
            />
            <button
              type="button"
              className="product-categories-secondary-button"
              disabled={importLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {importLoading ? "กำลังอ่านไฟล์..." : "↓ นำเข้าข้อมูล"}
            </button>
            <button type="button" className="product-categories-primary-button" onClick={openCreate}>
              + เพิ่มหมวดหมู่
            </button>
          </div>
        </section>


        {error && <div className="product-categories-alert error">{error}</div>}
        {success && <div className="product-categories-alert success">{success}</div>}


        <section className="product-categories-summary">
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon blue">▦</div>
            <div><span>หมวดหมู่ทั้งหมด</span><strong>{categories.length}</strong><small>หมวดหมู่</small></div>
          </div>
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon green">✓</div>
            <div><span>หมวดหมู่ที่ใช้งาน</span><strong>{activeCount}</strong><small>หมวดหมู่</small></div>
          </div>
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon yellow">△</div>
            <div><span>สินค้าทั้งหมด</span><strong>{totalProducts}</strong><small>รายการ</small></div>
          </div>
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon red">!</div>
            <div><span>หมวดหมู่ไม่มีสินค้า</span><strong>{emptyCount}</strong><small>หมวดหมู่</small></div>
          </div>
        </section>


        <section className="product-categories-toolbar">
          <div className="product-categories-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อหมวดหมู่, รหัส..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">ทุกสถานะ</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </section>


        <section className="product-categories-table-card">
          <div className="product-categories-table-header">
            <div>
              <h2>รายการหมวดหมู่สินค้า</h2>
              <p>{loading ? "กำลังโหลด..." : `แสดง ${filteredCategories.length} จาก ${categories.length} รายการ`}</p>
            </div>
            <div className="product-categories-table-actions">
              <button type="button" onClick={() => setSearch("")}>↺ ล้างตัวกรอง</button>
              <button type="button" onClick={exportCategories}>↓ ส่งออก CSV</button>
            </div>
          </div>


          <div className="product-categories-table-scroll">
            <table className="product-categories-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th><th>รหัส</th><th>รายละเอียด</th><th>จำนวนสินค้า</th>
                  <th>อัปเดตล่าสุด</th><th>สถานะ</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="product-categories-name">
                        <div className="product-categories-name-icon">▦</div>
                        <div><strong>{category.name}</strong><span>Category</span></div>
                      </div>
                    </td>
                    <td><span className="product-categories-code">{category.code}</span></td>
                    <td><span className="product-categories-description">{category.description || "-"}</span></td>
                    <td><strong className="product-categories-count">{category.productCount}</strong><span className="product-categories-unit"> รายการ</span></td>
                    <td>{formatDate(category.updatedAt)}</td>
                    <td>
                      <span className={`product-categories-status ${category.status === "ACTIVE" ? "active" : "inactive"}`}>
                        <i />{category.status === "ACTIVE" ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td>
                      <div className="product-categories-row-actions">
                        <button type="button" onClick={() => openEdit(category)}>แก้ไข</button>
                        <button type="button" className="delete" onClick={() => void deleteCategory(category)}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredCategories.length === 0 && (
                  <tr><td colSpan={7}><div className="product-categories-empty"><strong>ไม่พบหมวดหมู่สินค้า</strong><span>ลองเปลี่ยนคำค้นหาหรือเพิ่มหมวดหมู่ใหม่</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="product-categories-footer">
            <span>แสดง {filteredCategories.length} รายการ</span>
            <div className="product-categories-pagination"><button disabled>‹</button><button className="current">1</button><button disabled>›</button></div>
          </div>
        </section>
      </div>


      {showModal && (
        <div className="product-categories-modal-overlay" onMouseDown={closeModal}>
          <div className="product-categories-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="product-categories-modal-header">
              <div><h2>{editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2><p>ข้อมูลนี้จะบันทึกลง MySQL</p></div>
              <button type="button" className="product-categories-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="product-categories-form">
              <label>ชื่อหมวดหมู่ *<input value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น O-Ring" /></label>
              <label>รหัสหมวดหมู่ *<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="เช่น O-RING" /></label>
              <label>รายละเอียด<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="รายละเอียดหมวดหมู่" rows={4} /></label>
              <label>สถานะ<select value={status} onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}><option value="ACTIVE">ใช้งาน</option><option value="INACTIVE">ปิดใช้งาน</option></select></label>
            </div>
            <div className="product-categories-modal-footer">
              <button type="button" className="product-categories-cancel" onClick={closeModal}>ยกเลิก</button>
              <button type="button" className="product-categories-save" disabled={saving} onClick={() => void saveCategory()}>{saving ? "กำลังบันทึก..." : editingCategory ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}</button>
            </div>
          </div>
        </div>
      )}


      {importPreview && (
        <div className="product-categories-modal-overlay" onMouseDown={() => !importSaving && setImportPreview(null)}>
          <div className="product-categories-modal product-categories-import-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="product-categories-modal-header">
              <div>
                <h2>Preview นำเข้าสินค้า</h2>
                <p>{importPreview.fileName} · Sheet: {importPreview.sheetName}</p>
              </div>
              <button type="button" className="product-categories-modal-close" disabled={importSaving} onClick={() => setImportPreview(null)}>×</button>
            </div>


            <div className="product-categories-import-body">
              <div className="product-categories-import-summary">
                <div><span>ทั้งหมด</span><strong>{importPreview.summary.total}</strong></div>
                <div><span>พร้อมเพิ่ม</span><strong>{importPreview.summary.ready}</strong></div>
                <div><span>มีอยู่แล้ว</span><strong>{importPreview.summary.existing}</strong></div>
                <div><span>ไม่มี TG_NO</span><strong>{importPreview.summary.invalid}</strong></div>
                <div><span>ซ้ำในไฟล์</span><strong>{importPreview.summary.duplicateFile}</strong></div>
              </div>


              {importPreview.newCategories.length > 0 && (
                <div className="product-categories-import-new-categories">
                  <strong>หมวดหมู่ใหม่ที่จะสร้างอัตโนมัติ</strong>
                  <div>{importPreview.newCategories.map((item) => <span key={item}>+ {item}</span>)}</div>
                </div>
              )}


              <div className="product-categories-import-options">
                <div>
                  <strong>เมื่อ TG_NO มีอยู่ในระบบแล้ว</strong>
                  <small>Flow-linked product จะไม่ถูกไฟล์ Import ทับราคาจาก FlowAccount</small>
                </div>
                <select value={duplicateMode} onChange={(event) => setDuplicateMode(event.target.value as "SKIP" | "UPDATE")}>
                  <option value="SKIP">ข้ามรายการเดิม (แนะนำ)</option>
                  <option value="UPDATE">อัปเดตข้อมูลเว็บ/ราคา Local</option>
                </select>
              </div>


              <div className="product-categories-import-table-wrap">
                <table className="product-categories-import-table">
                  <thead><tr><th>แถว</th><th>TG_NO</th><th>TYPE</th><th>SIZE &amp; MAT.</th><th>วัสดุ</th><th>ราคา</th><th>สถานะ</th></tr></thead>
                  <tbody>
                    {importPreview.rows.slice(0, 300).map((row, index) => (
                      <tr key={`${row.sourceRow}-${row.code}-${index}`}>
                        <td>{row.sourceRow}</td>
                        <td><strong>{row.code || "-"}</strong></td>
                        <td>{row.category}</td>
                        <td>{row.sizeMaterial || "-"}</td>
                        <td>{row.material || "-"}</td>
                        <td>{row.price.toLocaleString("th-TH", { maximumFractionDigits: 4 })}</td>
                        <td><span className={`product-categories-import-status ${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span><small>{row.message}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.rows.length > 300 && <p className="product-categories-import-note">แสดง Preview 300 แถวแรก แต่ตอนบันทึกจะประมวลผลครบ {importPreview.rows.length} แถว</p>}
              <p className="product-categories-import-note">แถวที่ TG_NO ว่างจะไม่ถูกนำเข้า เพื่อให้รหัสสินค้าใช้จับคู่ FlowAccount ได้ถูกต้องในอนาคต</p>
            </div>


            <div className="product-categories-modal-footer">
              <button type="button" className="product-categories-cancel" disabled={importSaving} onClick={() => setImportPreview(null)}>ยกเลิก</button>
              <button type="button" className="product-categories-save" disabled={importSaving || importPreview.summary.ready + importPreview.summary.existing === 0} onClick={() => void commitImport()}>
                {importSaving ? "กำลังนำเข้า..." : `นำเข้า ${importPreview.summary.ready + (duplicateMode === "UPDATE" ? importPreview.summary.existing : 0)} รายการ`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
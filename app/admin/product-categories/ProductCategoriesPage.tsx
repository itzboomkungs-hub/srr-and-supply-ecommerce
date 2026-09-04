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
  sourceSheet: string;
  sourceRow: number;
  no: string;
  sourceItem: string;
  code: string;
  codeSource: string;
  tgNo: string;
  sog: string;
  sogNp: string;
  category: string;
  size?: string;
  sizeMaterial: string;
  material: string;
  price: number;
  stock: number;
  hasPrice: boolean;
  hasStock: boolean;
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


function formatImportNumber(value: number, hasValue: boolean, maximumFractionDigits = 4) {
  if (!hasValue) return "-";


  return Number(value || 0).toLocaleString("th-TH", {
    maximumFractionDigits,
  });
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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<"SKIP" | "UPDATE">("SKIP");
  const [importSaving, setImportSaving] = useState(false);


  async function loadCategories() {
    setLoading(true);
    setError("");


    try {
      const response = await fetch("/api/admin/product-categories", {
        cache: "no-store",
      });


      const data = await response.json();


      if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {
        throw new Error(data?.message || "โหลดหมวดหมู่ไม่สำเร็จ");
      }


      setCategories(data.categories);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "โหลดหมวดหมู่ไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void loadCategories();
  }, []);


  useEffect(() => {
    if (!importPreview) return;


    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";


    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [importPreview]);


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


  const totalProducts = categories.reduce(
    (sum, category) => sum + Number(category.productCount || 0),
    0
  );


  const activeCount = categories.filter(
    (category) => category.status === "ACTIVE"
  ).length;


  const emptyCount = categories.filter(
    (category) => Number(category.productCount || 0) === 0
  ).length;


  const importCount = importPreview
    ? importPreview.summary.ready +
      (duplicateMode === "UPDATE" ? importPreview.summary.existing : 0)
    : 0;


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


  function closeImportPreview() {
    if (importSaving) return;
    setImportPreview(null);
    setImportFile(null);
  }


  async function saveCategory() {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อหมวดหมู่");
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim(),
            status,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "บันทึกไม่สำเร็จ");
      }


      setShowModal(false);
      setEditingCategory(null);
      setSuccess(data?.message || "บันทึกหมวดหมู่เรียบร้อย");
      await loadCategories();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "บันทึกไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  }


  async function deleteCategory(category: Category) {
    if (!window.confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) {
      return;
    }


    setError("");
    setSuccess("");


    try {
      const response = await fetch(
        `/api/admin/product-categories/${category.id}`,
        {
          method: "DELETE",
        }
      );


      const data = await response.json();


      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "ลบไม่สำเร็จ");
      }


      setSuccess(data?.message || "ลบหมวดหมู่เรียบร้อย");
      await loadCategories();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "ลบไม่สำเร็จ"
      );
    }
  }


  async function previewFile(file: File) {
    setImportFile(file);
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


      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "อ่านไฟล์ไม่สำเร็จ");
      }


      setImportPreview(data as ImportPreview);
    } catch (previewError) {
      setImportFile(null);
      setError(
        previewError instanceof Error
          ? previewError.message
          : "อ่านไฟล์ไม่สำเร็จ"
      );
    } finally {
      setImportLoading(false);


      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }


  async function commitImport() {
    if (!importPreview || !importFile || importSaving) return;


    setImportSaving(true);
    setError("");
    setSuccess("");


    try {
      const form = new FormData();
      form.append("file", importFile);
      form.append("duplicateMode", duplicateMode);


      const response = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        body: form,
      });


      const data = await response.json();


      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "นำเข้าไม่สำเร็จ");
      }


      setImportPreview(null);
      setImportFile(null);
      setSuccess(data?.message || "นำเข้าสินค้าเรียบร้อย");
      await loadCategories();
      window.dispatchEvent(new Event("srr-products-updated"));
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "นำเข้าไม่สำเร็จ"
      );
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


    const escape = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;


    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");


    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });


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


            <button
              type="button"
              className="product-categories-primary-button"
              onClick={openCreate}
            >
              + เพิ่มหมวดหมู่
            </button>
          </div>
        </section>


        {error && <div className="product-categories-alert error">{error}</div>}
        {success && (
          <div className="product-categories-alert success">{success}</div>
        )}


        <section className="product-categories-summary">
          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon blue">▦</div>
            <div>
              <span>หมวดหมู่ทั้งหมด</span>
              <strong>{categories.length}</strong>
              <small>หมวดหมู่</small>
            </div>
          </div>


          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon green">✓</div>
            <div>
              <span>หมวดหมู่ที่ใช้งาน</span>
              <strong>{activeCount}</strong>
              <small>หมวดหมู่</small>
            </div>
          </div>


          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon yellow">△</div>
            <div>
              <span>สินค้าทั้งหมด</span>
              <strong>{totalProducts}</strong>
              <small>รายการ</small>
            </div>
          </div>


          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon red">!</div>
            <div>
              <span>หมวดหมู่ไม่มีสินค้า</span>
              <strong>{emptyCount}</strong>
              <small>หมวดหมู่</small>
            </div>
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


          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </section>


        <section className="product-categories-table-card">
          <div className="product-categories-table-header">
            <div>
              <h2>รายการหมวดหมู่สินค้า</h2>
              <p>
                {loading
                  ? "กำลังโหลด..."
                  : `แสดง ${filteredCategories.length} จาก ${categories.length} รายการ`}
              </p>
            </div>


            <div className="product-categories-table-actions">
              <button type="button" onClick={() => setSearch("")}>
                ↺ ล้างตัวกรอง
              </button>
              <button type="button" onClick={exportCategories}>
                ↓ ส่งออก CSV
              </button>
            </div>
          </div>


          <div className="product-categories-table-scroll">
            <table className="product-categories-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th>รหัสหมวดหมู่</th>
                  <th>รายละเอียด</th>
                  <th>จำนวนสินค้า</th>
                  <th>อัปเดตล่าสุด</th>
                  <th>สถานะ</th>
                  <th />
                </tr>
              </thead>


              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="product-categories-name">
                        <div className="product-categories-name-icon">▦</div>
                        <div>
                          <strong>{category.name}</strong>
                          <span>Category</span>
                        </div>
                      </div>
                    </td>


                    <td>
                      <span className="product-categories-code">
                        {category.code}
                      </span>
                    </td>


                    <td>
                      <span className="product-categories-description">
                        {category.description || "-"}
                      </span>
                    </td>


                    <td>
                      <strong className="product-categories-count">
                        {category.productCount}
                      </strong>
                      <span className="product-categories-unit"> รายการ</span>
                    </td>


                    <td>{formatDate(category.updatedAt)}</td>


                    <td>
                      <span
                        className={`product-categories-status ${
                          category.status === "ACTIVE" ? "active" : "inactive"
                        }`}
                      >
                        <i />
                        {category.status === "ACTIVE" ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>


                    <td>
                      <div className="product-categories-row-actions">
                        <button type="button" onClick={() => openEdit(category)}>
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="delete"
                          onClick={() => void deleteCategory(category)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}


                {!loading && filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="product-categories-empty">
                        <strong>ไม่พบหมวดหมู่สินค้า</strong>
                        <span>ลองเปลี่ยนคำค้นหาหรือเพิ่มหมวดหมู่ใหม่</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          <div className="product-categories-footer">
            <span>แสดง {filteredCategories.length} รายการ</span>
            <div className="product-categories-pagination">
              <button disabled>‹</button>
              <button className="current">1</button>
              <button disabled>›</button>
            </div>
          </div>
        </section>
      </div>


      {showModal && (
        <div className="product-categories-modal-overlay" onMouseDown={closeModal}>
          <div
            className="product-categories-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="product-categories-modal-header">
              <div>
                <h2>{editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2>
                <p>ข้อมูลนี้จะบันทึกลง MySQL</p>
              </div>


              <button
                type="button"
                className="product-categories-modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>


            <div className="product-categories-form">
              <label>
                ชื่อหมวดหมู่ *
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="เช่น O-Ring"
                />
              </label>


              <label>
                รหัสหมวดหมู่
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="เว้นว่างได้ ระบบสร้างให้อัตโนมัติ"
                />
                <small>
                  นี่คือรหัสหมวดหมู่ ไม่ใช่รหัสสินค้า เช่น G02580V
                </small>
              </label>


              <label>
                รายละเอียด
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="รายละเอียดหมวดหมู่"
                  rows={4}
                />
              </label>


              <label>
                สถานะ
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "ACTIVE" | "INACTIVE")
                  }
                >
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="INACTIVE">ปิดใช้งาน</option>
                </select>
              </label>
            </div>


            <div className="product-categories-modal-footer">
              <button
                type="button"
                className="product-categories-cancel"
                onClick={closeModal}
              >
                ยกเลิก
              </button>


              <button
                type="button"
                className="product-categories-save"
                disabled={saving}
                onClick={() => void saveCategory()}
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingCategory
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มหมวดหมู่"}
              </button>
            </div>
          </div>
        </div>
      )}


      {importPreview && (
        <div
          className="srr-import-overlay"
          onMouseDown={closeImportPreview}
          role="presentation"
        >
          <section
            className="srr-import-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="srr-import-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="srr-import-header">
              <div className="srr-import-heading">
                <div className="srr-import-heading-icon">⇩</div>
                <div className="srr-import-heading-copy">
                  <h2 id="srr-import-title">ตรวจสอบก่อนนำเข้าสินค้า</h2>
                  <p>
                    <strong>{importPreview.fileName}</strong>
                    <span>•</span>
                    <span>{importPreview.sheetName}</span>
                  </p>
                </div>
              </div>


              <button
                type="button"
                className="srr-import-close"
                disabled={importSaving}
                aria-label="ปิดหน้าต่างนำเข้า"
                onClick={closeImportPreview}
              >
                ×
              </button>
            </header>


            <div className="srr-import-body">
              <section className="srr-import-summary-grid">
                <article className="srr-import-summary-card total">
                  <span>ทั้งหมด</span>
                  <strong>{importPreview.summary.total.toLocaleString("th-TH")}</strong>
                  <small>รายการจากทุก Sheet</small>
                </article>


                <article className="srr-import-summary-card ready">
                  <span>พร้อมเพิ่ม</span>
                  <strong>{importPreview.summary.ready.toLocaleString("th-TH")}</strong>
                  <small>สร้างสินค้าใหม่</small>
                </article>


                <article className="srr-import-summary-card exists">
                  <span>มีอยู่แล้ว</span>
                  <strong>{importPreview.summary.existing.toLocaleString("th-TH")}</strong>
                  <small>ขึ้นกับโหมดรหัสซ้ำ</small>
                </article>


                <article className="srr-import-summary-card invalid">
                  <span>ไม่มีรหัสสินค้า</span>
                  <strong>{importPreview.summary.invalid.toLocaleString("th-TH")}</strong>
                  <small>จะไม่นำเข้า</small>
                </article>


                <article className="srr-import-summary-card duplicate">
                  <span>ซ้ำในไฟล์</span>
                  <strong>
                    {importPreview.summary.duplicateFile.toLocaleString("th-TH")}
                  </strong>
                  <small>เก็บรายการแรก</small>
                </article>
              </section>


              {importPreview.newCategories.length > 0 && (
                <section className="srr-import-category-panel">
                  <div className="srr-import-category-title">
                    <div>
                      <strong>หมวดหมู่ใหม่ที่จะสร้างอัตโนมัติ</strong>
                      <span>
                        พบ {importPreview.newCategories.length.toLocaleString("th-TH")} หมวดหมู่
                      </span>
                    </div>
                  </div>


                  <div className="srr-import-category-chips">
                    {importPreview.newCategories.map((item) => (
                      <span key={item}>+ {item}</span>
                    ))}
                  </div>
                </section>
              )}


              <section className="srr-import-control-panel">
                <div className="srr-import-control-copy">
                  <strong>เมื่อรหัสสินค้ามีอยู่ในระบบแล้ว</strong>
                  <span>
                    รหัสสินค้าอ่านตามโครงของแต่ละ Sheet จาก TG_NO / SOG_NP / SOG / SOG_NO
                  </span>
                  <small>
                    สินค้าที่เชื่อม FlowAccount จะไม่ถูกไฟล์ Import ทับข้อมูลที่ Flow เป็นเจ้าของ
                  </small>
                </div>


                <label className="srr-import-mode-field">
                  <span>วิธีจัดการรหัสซ้ำ</span>
                  <select
                    value={duplicateMode}
                    disabled={importSaving}
                    onChange={(event) =>
                      setDuplicateMode(event.target.value as "SKIP" | "UPDATE")
                    }
                  >
                    <option value="SKIP">ข้ามรายการเดิม (แนะนำ)</option>
                    <option value="UPDATE">อัปเดตข้อมูลเว็บ / Local</option>
                  </select>
                </label>
              </section>


              <section className="srr-import-table-card">
                <div className="srr-import-table-toolbar">
                  <div>
                    <strong>ตัวอย่างข้อมูลก่อนนำเข้า</strong>
                    <span>
                      แสดง {Math.min(importPreview.rows.length, 300).toLocaleString("th-TH")} จาก {importPreview.rows.length.toLocaleString("th-TH")} แถว
                    </span>
                  </div>


                  <div className="srr-import-table-hint">
                    ↔ เลื่อนตารางซ้าย–ขวาได้
                  </div>
                </div>


                <div className="srr-import-table-scroll">
                  <table className="srr-import-table">
                    <thead>
                      <tr>
                        <th>Sheet</th>
                        <th>แถว</th>
                        <th>รหัสสินค้า</th>
                        <th>มาจาก</th>
                        <th>TYPE</th>
                        <th>SIZE &amp; MAT.</th>
                        <th>TG_NO</th>
                        <th>SOG</th>
                        <th>SOG_NP</th>
                        <th className="number">ราคา</th>
                        <th className="number">Stock</th>
                        <th>สถานะ</th>
                      </tr>
                    </thead>


                    <tbody>
                      {importPreview.rows.slice(0, 300).map((row, index) => (
                        <tr
                          key={`${row.sourceSheet}-${row.sourceRow}-${row.code}-${index}`}
                        >
                          <td>
                            <span className="srr-import-sheet">{row.sourceSheet}</span>
                          </td>


                          <td className="srr-import-row-number">{row.sourceRow}</td>


                          <td>
                            <strong className="srr-import-product-code">
                              {row.code || "-"}
                            </strong>
                          </td>


                          <td>
                            <span className="srr-import-code-source">
                              {row.codeSource || "-"}
                            </span>
                          </td>


                          <td>{row.category || "-"}</td>


                          <td>
                            <span className="srr-import-size">
                              {row.sizeMaterial || "-"}
                            </span>
                          </td>


                          <td>{row.tgNo || "-"}</td>
                          <td>{row.sog || "-"}</td>
                          <td>{row.sogNp || "-"}</td>


                          <td className="number">
                            {formatImportNumber(row.price, row.hasPrice, 4)}
                          </td>


                          <td className="number">
                            {formatImportNumber(row.stock, row.hasStock, 3)}
                          </td>


                          <td>
                            <div className="srr-import-status-cell">
                              <span
                                className={`srr-import-status ${row.status.toLowerCase()}`}
                              >
                                {statusLabel(row.status)}
                              </span>
                              {row.message && <small>{row.message}</small>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>


              <div className="srr-import-notes">
                {importPreview.rows.length > 300 && (
                  <p>
                    Preview แสดง 300 แถวแรก แต่ตอนกดนำเข้าระบบจะอ่านไฟล์ต้นฉบับและประมวลผลครบทุกแถว
                  </p>
                )}


                <p>
                  แถวที่ไม่มีรหัสสินค้า TG_NO / SOG / SOG_NO / SOG_NP จะถูกข้าม เพื่อให้การจับคู่ FlowAccount ในอนาคตไม่ผิดสินค้า
                </p>
              </div>
            </div>


            <footer className="srr-import-footer">
              <div className="srr-import-footer-copy">
                <strong>{importCount.toLocaleString("th-TH")}</strong>
                <span>รายการที่จะนำเข้าตามตัวเลือกปัจจุบัน</span>
              </div>


              <div className="srr-import-footer-actions">
                <button
                  type="button"
                  className="srr-import-cancel"
                  disabled={importSaving}
                  onClick={closeImportPreview}
                >
                  ยกเลิก
                </button>


                <button
                  type="button"
                  className="srr-import-submit"
                  disabled={importSaving || importCount === 0}
                  onClick={() => void commitImport()}
                >
                  {importSaving
                    ? "กำลังนำเข้า..."
                    : `นำเข้า ${importCount.toLocaleString("th-TH")} รายการ`}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
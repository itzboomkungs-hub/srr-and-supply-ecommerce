"use client";

import { useMemo, useState } from "react";
import "./admin/ProductCategoriesPage.css";

type Category = {
  id: number;
  name: string;
  code: string;
  description: string;
  productCount: number;
  status: "active" | "inactive";
  updatedAt: string;
};

const initialCategories: Category[] = [
  {
    id: 1,
    name: "O-Ring",
    code: "O-RING",
    description: "ซีลยางโอริงสำหรับงานอุตสาหกรรม",
    productCount: 5,
    status: "active",
    updatedAt: "31 ส.ค. 2026",
  },
  {
    id: 2,
    name: "Oil Seal",
    code: "OIL-SEAL",
    description: "ซีลน้ำมันสำหรับเครื่องจักร",
    productCount: 2,
    status: "active",
    updatedAt: "30 ส.ค. 2026",
  },
  {
    id: 3,
    name: "Mechanical Seal",
    code: "MECH-SEAL",
    description: "ซีลสำหรับระบบปั๊มและเครื่องจักร",
    productCount: 1,
    status: "active",
    updatedAt: "28 ส.ค. 2026",
  },
  {
    id: 4,
    name: "Bearing",
    code: "BEARING",
    description: "ตลับลูกปืนและอุปกรณ์ที่เกี่ยวข้อง",
    productCount: 0,
    status: "active",
    updatedAt: "25 ส.ค. 2026",
  },
  {
    id: 5,
    name: "อะไหล่อื่นๆ",
    code: "OTHER",
    description: "สินค้าและอะไหล่ประเภทอื่น",
    productCount: 0,
    status: "inactive",
    updatedAt: "20 ส.ค. 2026",
  },
];

export default function ProductCategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] =
    useState<"active" | "inactive">("active");

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.code.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const totalProducts = categories.reduce(
    (sum, category) => sum + category.productCount,
    0
  );

  const activeCount = categories.filter(
    (category) => category.status === "active"
  ).length;

  const emptyCount = categories.filter(
    (category) => category.productCount === 0
  ).length;

  function openCreate() {
    setEditingCategory(null);
    setName("");
    setCode("");
    setDescription("");
    setStatus("active");
    setShowModal(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setCode(category.code);
    setDescription(category.description);
    setStatus(category.status);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCategory(null);
  }

  function saveCategory() {
    if (!name.trim() || !code.trim()) {
      alert("กรุณากรอกชื่อและรหัสหมวดหมู่");
      return;
    }

    if (editingCategory) {
      setCategories((current) =>
        current.map((item) =>
          item.id === editingCategory.id
            ? {
                ...item,
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim(),
                status,
                updatedAt: "31 ส.ค. 2026",
              }
            : item
        )
      );
    } else {
      setCategories((current) => [
        {
          id: Date.now(),
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          productCount: 0,
          status,
          updatedAt: "31 ส.ค. 2026",
        },
        ...current,
      ]);
    }

    closeModal();
  }

  function deleteCategory(category: Category) {
    if (category.productCount > 0) {
      alert("ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่ได้");
      return;
    }

    const confirmed = window.confirm(
      `ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    setCategories((current) =>
      current.filter((item) => item.id !== category.id)
    );
  }

  return (
    <main className="product-categories-page">
      <div className="product-categories-container">

        {/* HEADER */}
        <section className="product-categories-header">
          <div>
            <div className="product-categories-breadcrumb">
              จัดการสินค้า
              <span>/</span>
              หมวดหมู่สินค้า
            </div>

            <h1>หมวดหมู่สินค้า</h1>

            <p>
              จัดการหมวดหมู่สินค้าและข้อมูลที่เกี่ยวข้อง
            </p>
          </div>

          <div className="product-categories-header-actions">
            <button className="product-categories-secondary-button">
              ↓ นำเข้าข้อมูล
            </button>

            <button
              className="product-categories-primary-button"
              onClick={openCreate}
            >
              + เพิ่มหมวดหมู่
            </button>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="product-categories-summary">

          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon blue">
              ▦
            </div>

            <div>
              <span>หมวดหมู่ทั้งหมด</span>
              <strong>{categories.length}</strong>
              <small>หมวดหมู่</small>
            </div>
          </div>

          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon green">
              ✓
            </div>

            <div>
              <span>หมวดหมู่ที่ใช้งาน</span>
              <strong>{activeCount}</strong>
              <small>หมวดหมู่</small>
            </div>
          </div>

          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon yellow">
              △
            </div>

            <div>
              <span>สินค้าทั้งหมด</span>
              <strong>{totalProducts}</strong>
              <small>รายการ</small>
            </div>
          </div>

          <div className="product-categories-summary-card">
            <div className="product-categories-summary-icon red">
              !
            </div>

            <div>
              <span>หมวดหมู่ไม่มีสินค้า</span>
              <strong>{emptyCount}</strong>
              <small>หมวดหมู่</small>
            </div>
          </div>

        </section>

        {/* FILTER */}
        <section className="product-categories-toolbar">

          <div className="product-categories-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="ค้นหาชื่อหมวดหมู่, รหัส..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>

        </section>

        {/* TABLE */}
        <section className="product-categories-table-card">

          <div className="product-categories-table-header">

            <div>
              <h2>รายการหมวดหมู่สินค้า</h2>

              <p>
                แสดง {filteredCategories.length} จาก{" "}
                {categories.length} รายการ
              </p>
            </div>

            <div className="product-categories-table-actions">
              <button>☷ ตัวกรอง</button>
              <button>↓ ส่งออก</button>
            </div>

          </div>

          <div className="product-categories-table-scroll">

            <table className="product-categories-table">

              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th>รหัส</th>
                  <th>รายละเอียด</th>
                  <th>จำนวนสินค้า</th>
                  <th>อัปเดตล่าสุด</th>
                  <th>สถานะ</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredCategories.map((category) => (
                  <tr key={category.id}>

                    <td>
                      <div className="product-categories-name">

                        <div className="product-categories-name-icon">
                          ▦
                        </div>

                        <div>
                          <strong>
                            {category.name}
                          </strong>

                          <span>
                            Category
                          </span>
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
                        {category.description}
                      </span>
                    </td>

                    <td>
                      <strong className="product-categories-count">
                        {category.productCount}
                      </strong>

                      <span className="product-categories-unit">
                        {" "}รายการ
                      </span>
                    </td>

                    <td>
                      {category.updatedAt}
                    </td>

                    <td>
                      <span
                        className={`product-categories-status ${
                          category.status === "active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <i />

                        {category.status === "active"
                          ? "ใช้งาน"
                          : "ปิดใช้งาน"}
                      </span>
                    </td>

                    <td>
                      <div className="product-categories-row-actions">

                        <button
                          onClick={() =>
                            openEdit(category)
                          }
                        >
                          แก้ไข
                        </button>

                        <button
                          className="delete"
                          onClick={() =>
                            deleteCategory(category)
                          }
                        >
                          ลบ
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={7}>

                      <div className="product-categories-empty">
                        <strong>
                          ไม่พบหมวดหมู่สินค้า
                        </strong>

                        <span>
                          ลองเปลี่ยนคำค้นหาหรือตัวกรอง
                        </span>
                      </div>

                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <div className="product-categories-footer">

            <span>
              แสดง {filteredCategories.length} รายการ
            </span>

            <div className="product-categories-pagination">
              <button disabled>‹</button>
              <button className="current">1</button>
              <button disabled>›</button>
            </div>

          </div>

        </section>

      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="product-categories-modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="product-categories-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="product-categories-modal-header">

              <div>
                <h2>
                  {editingCategory
                    ? "แก้ไขหมวดหมู่"
                    : "เพิ่มหมวดหมู่"}
                </h2>

                <p>
                  กรอกข้อมูลหมวดหมู่สินค้า
                </p>
              </div>

              <button
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
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="เช่น O-Ring"
                />
              </label>

              <label>
                รหัสหมวดหมู่ *

                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  placeholder="เช่น O-RING"
                />
              </label>

              <label>
                รายละเอียด

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="รายละเอียดหมวดหมู่"
                  rows={4}
                />
              </label>

              <label>
                สถานะ

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as
                        | "active"
                        | "inactive"
                    )
                  }
                >
                  <option value="active">
                    ใช้งาน
                  </option>

                  <option value="inactive">
                    ปิดใช้งาน
                  </option>
                </select>
              </label>

            </div>

            <div className="product-categories-modal-footer">

              <button
                className="product-categories-cancel"
                onClick={closeModal}
              >
                ยกเลิก
              </button>

              <button
                className="product-categories-save"
                onClick={saveCategory}
              >
                {editingCategory
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มหมวดหมู่"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}
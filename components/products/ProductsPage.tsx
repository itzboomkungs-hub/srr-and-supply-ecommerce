"use client";

import { useMemo, useState } from "react";
import styles from "./ProductsPage.module.css";

type Product = {
  id: number;
  name: string;
  code: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  reserved: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "O-Ring NBR M70",
    code: "OR-NBR-M70",
    category: "O-Ring",
    material: "NBR",
    price: 35,
    stock: 820,
    reserved: 120,
  },
  {
    id: 2,
    name: "O-Ring NBR M60",
    code: "OR-NBR-M60",
    category: "O-Ring",
    material: "NBR",
    price: 30,
    stock: 650,
    reserved: 85,
  },
  {
    id: 3,
    name: "O-Ring EPDM M50",
    code: "OR-EPDM-M50",
    category: "O-Ring",
    material: "EPDM",
    price: 42,
    stock: 540,
    reserved: 40,
  },
  {
    id: 4,
    name: "O-Ring Viton M40",
    code: "OR-VITON-M40",
    category: "O-Ring",
    material: "Viton",
    price: 65,
    stock: 42,
    reserved: 20,
  },
  {
    id: 5,
    name: "O-Ring Silicone M30",
    code: "OR-SIL-M30",
    category: "O-Ring",
    material: "Silicone",
    price: 55,
    stock: 0,
    reserved: 0,
  },
  {
    id: 6,
    name: "O-Ring NBR M50",
    code: "OR-NBR-M50",
    category: "O-Ring",
    material: "NBR",
    price: 32,
    stock: 280,
    reserved: 35,
  },
  {
    id: 7,
    name: "Oil Seal NBR 35",
    code: "OS-NBR-35",
    category: "Oil Seal",
    material: "NBR",
    price: 85,
    stock: 125,
    reserved: 15,
  },
  {
    id: 8,
    name: "Oil Seal Viton 40",
    code: "OS-VITON-40",
    category: "Oil Seal",
    material: "Viton",
    price: 120,
    stock: 68,
    reserved: 8,
  },
];

function getStockStatus(stock: number) {
  if (stock === 0) {
    return {
      label: "หมดสต็อก",
      type: "danger",
    };
  }

  if (stock <= 50) {
    return {
      label: "ใกล้หมด",
      type: "warning",
    };
  }

  return {
    label: "พร้อมขาย",
    type: "success",
  };
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  const [showInactive, setShowInactive] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.toLowerCase().trim();

      const matchesSearch =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.code.toLowerCase().includes(keyword) ||
        product.material.toLowerCase().includes(keyword);

      const matchesCategory =
        category === "ทั้งหมด" ||
        product.category === category;

      const productStatus = getStockStatus(product.stock);

      const matchesStatus =
        status === "ทั้งหมด" ||
        productStatus.label === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, status]);

  const totalProducts = products.length;

  const sellingProducts = products.filter(
    (product) => product.stock > 0
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 50
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.stock === 0
  ).length;

  return (
    <div className={styles.productsPage}>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className={styles.pageHeader}>

        <div>
          <div className={styles.breadcrumb}>
            จัดการสินค้า
            <span>/</span>
            สินค้า
          </div>

          <h1>สินค้า</h1>

          <p>
            จัดการรายการสินค้า ราคา SKU และสถานะสต็อกของ SRR AND SUPPLY
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.secondaryButton}>
            ↓ &nbsp; นำเข้าสินค้า
          </button>

          <button className={styles.primaryButton}>
            ＋ &nbsp; เพิ่มสินค้า
          </button>
        </div>

      </section>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className={styles.summaryGrid}>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            ▣
          </div>

          <div>
            <span>สินค้าทั้งหมด</span>
            <strong>{totalProducts}</strong>
            <small>รายการสินค้า</small>
          </div>
        </div>


        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            ✓
          </div>

          <div>
            <span>สินค้าเปิดขาย</span>
            <strong>{sellingProducts}</strong>
            <small>รายการ</small>
          </div>
        </div>


        <div className={`${styles.summaryCard} ${styles.warningCard}`}>
          <div className={styles.summaryIcon}>
            △
          </div>

          <div>
            <span>สินค้าใกล้หมด</span>
            <strong>{lowStockProducts}</strong>
            <small>ต้องตรวจสอบ</small>
          </div>
        </div>


        <div className={`${styles.summaryCard} ${styles.dangerCard}`}>
          <div className={styles.summaryIcon}>
            !
          </div>

          <div>
            <span>สินค้าหมด</span>
            <strong>{outOfStockProducts}</strong>
            <small>ต้องเติมสต็อก</small>
          </div>
        </div>

      </section>


      {/* =====================================================
          SEARCH / FILTER
      ===================================================== */}

      <section className={styles.filterCard}>

        <div className={styles.searchBox}>
          <span>⌕</span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, วัสดุ..."
          />
        </div>


        <select
          className={styles.filterSelect}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="ทั้งหมด">ทุกหมวดหมู่</option>
          <option value="O-Ring">O-Ring</option>
          <option value="Oil Seal">Oil Seal</option>
        </select>


        <select
          className={styles.filterSelect}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ทั้งหมด">ทุกสถานะ</option>
          <option value="พร้อมขาย">พร้อมขาย</option>
          <option value="ใกล้หมด">ใกล้หมด</option>
          <option value="หมดสต็อก">หมดสต็อก</option>
        </select>


        <label className={styles.checkboxFilter}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              setShowInactive(event.target.checked)
            }
          />

          <span>แสดงสินค้าที่ปิดการขาย</span>
        </label>

      </section>


      {/* =====================================================
          PRODUCT TABLE
      ===================================================== */}

      <section className={styles.tableCard}>

        <div className={styles.tableHeader}>

          <div>
            <h2>รายการสินค้า</h2>

            <p>
              แสดง {filteredProducts.length} จาก {products.length} รายการ
            </p>
          </div>

          <div className={styles.tableActions}>
            <button className={styles.tableButton}>
              ☷ &nbsp; ตัวกรอง
            </button>

            <button className={styles.tableButton}>
              ↓ &nbsp; ส่งออก
            </button>
          </div>

        </div>


        <div className={styles.tableWrapper}>

          <table className={styles.productsTable}>

            <thead>
              <tr>
                <th className={styles.checkColumn}>
                  <input type="checkbox" />
                </th>

                <th>สินค้า</th>
                <th>SKU</th>
                <th>หมวดหมู่</th>
                <th>วัสดุ</th>
                <th>ราคาขาย</th>
                <th>สต็อก</th>
                <th>จองแล้ว</th>
                <th>คงเหลือ</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>


            <tbody>

              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const remaining =
                  product.stock - product.reserved;

                return (
                  <tr key={product.id}>

                    <td className={styles.checkColumn}>
                      <input type="checkbox" />
                    </td>


                    <td>

                      <div className={styles.productCell}>

                        <div className={styles.productIcon}>
                          O
                        </div>

                        <div className={styles.productName}>
                          <strong>
                            {product.name}
                          </strong>

                          <span>
                            {product.code}
                          </span>
                        </div>

                      </div>

                    </td>


                    <td>
                      <span className={styles.sku}>
                        {product.code}
                      </span>
                    </td>


                    <td>
                      {product.category}
                    </td>


                    <td>
                      <span className={styles.materialTag}>
                        {product.material}
                      </span>
                    </td>


                    <td>
                      <strong className={styles.price}>
                        ฿{product.price}
                      </strong>
                    </td>


                    <td>
                      <strong
                        className={
                          product.stock === 0
                            ? styles.stockDanger
                            : product.stock <= 50
                              ? styles.stockWarning
                              : styles.stockGood
                        }
                      >
                        {product.stock.toLocaleString()}
                      </strong>
                    </td>


                    <td>
                      {product.reserved.toLocaleString()}
                    </td>


                    <td>
                      {remaining.toLocaleString()}
                    </td>


                    <td>

                      <span
                        className={`${styles.status} ${
                          styles[stockStatus.type]
                        }`}
                      >
                        <i />
                        {stockStatus.label}
                      </span>

                    </td>


                    <td>
                      <button
                        className={styles.moreButton}
                        aria-label={`จัดการ ${product.name}`}
                      >
                        •••
                      </button>
                    </td>

                  </tr>
                );
              })}


              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className={styles.emptyState}
                  >
                    <div>⌕</div>

                    <strong>
                      ไม่พบสินค้าที่ค้นหา
                    </strong>

                    <span>
                      ลองเปลี่ยนคำค้นหาหรือตัวกรอง
                    </span>
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>


        {/* =====================================================
            TABLE FOOTER
        ===================================================== */}

        <div className={styles.tableFooter}>

          <span>
            แสดง 1 - {filteredProducts.length} จาก{" "}
            {filteredProducts.length} รายการ
          </span>

          <div className={styles.pagination}>

            <button disabled>
              ‹
            </button>

            <button className={styles.activePage}>
              1
            </button>

            <button>
              2
            </button>

            <button>
              ›
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}
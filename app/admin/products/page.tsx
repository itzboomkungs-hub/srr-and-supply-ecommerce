"use client";


import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./AdminProductsPage.module.css";


type Product = {
  id: number;
  code: string;
  name: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  active: boolean;
  stockSource?: "LOCAL" | "FLOWACCOUNT";
};


type Category = {
  id: number;
  name: string;
  code: string;
};


type StockFilter = "ALL" | "IN_STOCK" | "LOW" | "OUT";
type PageToken = number | "ellipsis-left" | "ellipsis-right";


const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];


function normalizeProduct(value: unknown): Product {
  const item = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;


  return {
    id: Number(item.id || 0),
    code: String(item.code || ""),
    name: String(item.name || item.websiteName || item.code || ""),
    category: String(item.category || ""),
    material: String(item.material || ""),
    price: Number(item.price ?? item.sellPrice ?? 0),
    stock: Math.max(0, Number(item.stock ?? 0)),
    active: item.active !== false && item.active !== 0,
    stockSource:
      item.stockSource === "FLOWACCOUNT" ? "FLOWACCOUNT" : "LOCAL",
  };
}


function stockLabel(stock: number) {
  if (stock <= 0) return { label: "หมดสต็อก", type: "out" as const };
  if (stock <= 10) return { label: "ใกล้หมด", type: "low" as const };
  return { label: "มีสินค้า", type: "ready" as const };
}


function clampPage(page: number, totalPages: number) {
  const max = Math.max(1, totalPages);
  return Math.min(Math.max(1, Math.floor(page || 1)), max);
}


function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }


  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }


  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }


  return [
    1,
    "ellipsis-left",
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    "ellipsis-right",
    totalPages,
  ];
}


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [showInactive, setShowInactive] = useState(true);


  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);


  async function loadProducts() {
    setLoading(true);
    setError("");


    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/products?includeInactive=1", { cache: "no-store" }),
        fetch("/api/product-categories", { cache: "no-store" }),
      ]);


      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();


      if (
        !productsResponse.ok ||
        !productsData?.ok ||
        !Array.isArray(productsData?.products)
      ) {
        throw new Error(productsData?.message || "โหลดสินค้าไม่สำเร็จ");
      }


      const normalized = productsData.products.map(normalizeProduct);
      setProducts(normalized);


      if (
        categoriesResponse.ok &&
        categoriesData?.ok &&
        Array.isArray(categoriesData?.categories)
      ) {
        setCategories(categoriesData.categories);
      } else {
        const fallbackNames: string[] = Array.from(
          new Set<string>(
            normalized
              .map((item: Product) => String(item.category || "").trim())
              .filter((name: string) => name.length > 0)
          )
        );


        setCategories(
          fallbackNames.map((name, index) => ({
            id: index + 1,
            name,
            code: name,
          }))
        );
      }
    } catch (loadError) {
      setProducts([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "โหลดสินค้าไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void loadProducts();


    function handleProductsUpdated() {
      void loadProducts();
    }


    window.addEventListener("srr-products-updated", handleProductsUpdated);


    return () => {
      window.removeEventListener(
        "srr-products-updated",
        handleProductsUpdated
      );
    };
  }, []);


  useEffect(() => {
    setPage(1);
  }, [search, category, stockFilter, showInactive, pageSize]);


  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();


    return products.filter((product) => {
      if (!showInactive && !product.active) return false;


      const matchesSearch =
        !keyword ||
        product.code.toLowerCase().includes(keyword) ||
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.material.toLowerCase().includes(keyword);


      const matchesCategory =
        category === "ALL" || product.category === category;


      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "IN_STOCK" && product.stock > 10) ||
        (stockFilter === "LOW" && product.stock > 0 && product.stock <= 10) ||
        (stockFilter === "OUT" && product.stock <= 0);


      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter, showInactive]);


  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = clampPage(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + pageSize);
  const from = filteredProducts.length === 0 ? 0 : pageStart + 1;
  const to = Math.min(pageStart + pageSize, filteredProducts.length);
  const pageTokens = buildPageTokens(safePage, totalPages);


  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.active).length;
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;
  const outOfStockProducts = products.filter(
    (product) => product.stock <= 0
  ).length;


  function resetFilters() {
    setSearch("");
    setCategory("ALL");
    setStockFilter("ALL");
    setShowInactive(true);
    setPage(1);
  }


  function goToPage(nextPage: number) {
    setPage(clampPage(nextPage, totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function exportCsv() {
    const header = [
      "รหัสสินค้า",
      "ชื่อสินค้า",
      "ราคาต่อหน่วย",
      "จำนวนคงคลัง",
      "หมวดสินค้า",
      "สถานะ",
    ];


    const rows = filteredProducts.map((product) => [
      product.code,
      product.name,
      product.price.toFixed(2),
      String(product.stock),
      product.category,
      product.active ? "ใช้งาน" : "ปิดใช้งาน",
    ]);


    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");


    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });


    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "srr-products.csv";
    link.click();
    URL.revokeObjectURL(url);
  }


  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>
              จัดการสินค้า <span>/</span> สินค้าทั้งหมด
            </div>
            <h1>สินค้าทั้งหมด</h1>
            <p>
              รายการสินค้าจาก MySQL พร้อมค้นหา กรอง แก้ไข และแบ่งหน้า
            </p>
          </div>


          <div className={styles.headerActions}>
            <Link
              href="/admin/product-categories"
              className={styles.secondaryButton}
            >
              หมวดหมู่สินค้า
            </Link>
            <Link href="/admin/products/new" className={styles.primaryButton}>
              + เพิ่มสินค้า
            </Link>
          </div>
        </section>


        {error && <div className={styles.errorAlert}>{error}</div>}


        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.blue}`}>▦</div>
            <div>
              <span>สินค้าทั้งหมด</span>
              <strong>{totalProducts.toLocaleString("th-TH")}</strong>
              <small>รายการใน MySQL</small>
            </div>
          </article>


          <article className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.green}`}>✓</div>
            <div>
              <span>สินค้าที่ใช้งาน</span>
              <strong>{activeProducts.toLocaleString("th-TH")}</strong>
              <small>พร้อมแสดงหน้าเว็บ</small>
            </div>
          </article>


          <article className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.yellow}`}>△</div>
            <div>
              <span>สินค้าใกล้หมด</span>
              <strong>{lowStockProducts.toLocaleString("th-TH")}</strong>
              <small>คงเหลือ 1–10</small>
            </div>
          </article>


          <article className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.red}`}>!</div>
            <div>
              <span>สินค้าหมด</span>
              <strong>{outOfStockProducts.toLocaleString("th-TH")}</strong>
              <small>คงเหลือ 0</small>
            </div>
          </article>
        </section>


        <section className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า, หมวดสินค้า, วัสดุ..."
            />
          </div>


          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="ALL">ทุกหมวดสินค้า</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>


          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(event.target.value as StockFilter)
            }
          >
            <option value="ALL">ทุกสถานะสต็อก</option>
            <option value="IN_STOCK">มีสินค้า</option>
            <option value="LOW">ใกล้หมด</option>
            <option value="OUT">หมดสต็อก</option>
          </select>


          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            รวมสินค้าปิดใช้งาน
          </label>
        </section>


        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2>รายการสินค้า</h2>
              <p>
                {loading
                  ? "กำลังโหลดข้อมูล."
                  : `แสดง ${from.toLocaleString("th-TH")}–${to.toLocaleString(
                      "th-TH"
                    )} จาก ${filteredProducts.length.toLocaleString(
                      "th-TH"
                    )} รายการ`}
              </p>
            </div>


            <div className={styles.tableActions}>
              <label className={styles.pageSizeControl}>
                <span>แสดงต่อหน้า</span>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>


              <button type="button" onClick={resetFilters}>
                ↺ ล้างตัวกรอง
              </button>
              <button type="button" onClick={exportCsv}>
                ↓ ส่งออก CSV
              </button>
            </div>
          </div>


          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>รหัสสินค้า</th>
                  <th>ชื่อสินค้า</th>
                  <th className={styles.numberColumn}>ราคาต่อหน่วย</th>
                  <th className={styles.numberColumn}>จำนวนคงคลัง</th>
                  <th>หมวดสินค้า</th>
                  <th>สถานะ</th>
                  <th className={styles.actionColumn}>จัดการ</th>
                </tr>
              </thead>


              <tbody>
                {visibleProducts.map((product) => {
                  const stock = stockLabel(product.stock);


                  return (
                    <tr key={product.id}>
                      <td>
                        <strong className={styles.productCode}>
                          {product.code || "-"}
                        </strong>
                      </td>


                      <td>
                        <div className={styles.productName}>
                          <strong>{product.name || product.code || "-"}</strong>
                          {product.material && (
                            <span>วัสดุ: {product.material}</span>
                          )}
                        </div>
                      </td>


                      <td className={styles.numberColumn}>
                        <strong className={styles.price}>
                          ฿
                          {product.price.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </strong>
                      </td>


                      <td className={styles.numberColumn}>
                        <div className={styles.stockCell}>
                          <strong>{product.stock.toLocaleString("th-TH")}</strong>
                          <span
                            className={`${styles.stockBadge} ${styles[stock.type]}`}
                          >
                            {stock.label}
                          </span>
                        </div>
                      </td>


                      <td>
                        <span className={styles.categoryBadge}>
                          {product.category || "ไม่มีหมวด"}
                        </span>
                      </td>


                      <td>
                        <div className={styles.statusCell}>
                          <span
                            className={`${styles.activeBadge} ${
                              product.active ? styles.active : styles.inactive
                            }`}
                          >
                            <i />
                            {product.active ? "ใช้งาน" : "ปิดใช้งาน"}
                          </span>


                          {product.stockSource === "FLOWACCOUNT" && (
                            <small className={styles.flowBadge}>FlowAccount</small>
                          )}
                        </div>
                      </td>


                      <td className={styles.actionColumn}>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className={styles.editButton}
                        >
                          แก้ไข
                        </Link>
                      </td>
                    </tr>
                  );
                })}


                {!loading && visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className={styles.emptyState}>
                        <strong>ไม่พบสินค้า</strong>
                        <span>
                          ลองเปลี่ยนคำค้นหา/ตัวกรอง หรือเพิ่มสินค้าใหม่
                        </span>
                      </div>
                    </td>
                  </tr>
                )}


                {loading && (
                  <tr>
                    <td colSpan={7}>
                      <div className={styles.emptyState}>
                        <strong>กำลังโหลดสินค้า...</strong>
                        <span>กำลังอ่านข้อมูล</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          <div className={styles.footer}>
            <div className={styles.footerInfo}>
              <span>
                แสดง {from.toLocaleString("th-TH")}–{to.toLocaleString("th-TH")} จาก {filteredProducts.length.toLocaleString("th-TH")} รายการ
              </span>
              <span>
                หน้า {safePage.toLocaleString("th-TH")} / {totalPages.toLocaleString("th-TH")}
              </span>
            </div>


            <nav className={styles.pagination} aria-label="แบ่งหน้าสินค้า">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => goToPage(safePage - 1)}
              >
                ‹ ก่อนหน้า
              </button>


              {pageTokens.map((token) => {
                if (typeof token !== "number") {
                  return (
                    <span key={token} className={styles.ellipsis}>
                      …
                    </span>
                  );
                }


                return (
                  <button
                    key={token}
                    type="button"
                    className={token === safePage ? styles.currentPage : ""}
                    aria-current={token === safePage ? "page" : undefined}
                    onClick={() => goToPage(token)}
                  >
                    {token}
                  </button>
                );
              })}


              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => goToPage(safePage + 1)}
              >
                ถัดไป ›
              </button>
            </nav>
          </div>
        </section>
      </div>
    </main>
  );
}
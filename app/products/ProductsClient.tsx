"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";


import styles from "./ProductsPage.module.css";


import SiteHeader from "../../components/layout/SiteHeader";
import CartDrawer from "../../components/cart/CartDrawer";
import ProductQuickView from "../../components/product/ProductQuickView";


import type { CartItem } from "../../components/cart/types";
import type { ProductQuickViewData } from "../../components/product/types";


import { normalizeApiProduct } from "../../lib/products/product-normalize.mjs";


const CART_KEY = "srr-demo-cart";
const PAGE_SIZE = 16;


type Product = ProductQuickViewData & {
  reserved: number;
  active: boolean;
};


type SqlCategory = {
  id: number;
  name: string;
  code: string;
  description: string;
  productCount?: number;
};


type PageToken = number | "left" | "right";


function getStockStatus(stock: number) {
  if (stock <= 0) {
    return { label: "หมดสต็อก", type: "danger" as const };
  }


  if (stock <= 50) {
    return { label: "ใกล้หมด", type: "warning" as const };
  }


  return { label: "พร้อมขาย", type: "success" as const };
}


function buildPageTokens(current: number, total: number): PageToken[] {
  if (total <= 8) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }


  if (current <= 5) {
    return [1, 2, 3, 4, 5, 6, "right", total];
  }


  if (current >= total - 4) {
    return [
      1,
      "left",
      total - 5,
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }


  return [
    1,
    "left",
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
    "right",
    total,
  ];
}


function SearchIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


function ViewIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


const paginationWrapStyle = {
  marginTop: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap" as const,
  padding: "14px 4px 4px",
};


const paginationButtonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap" as const,
};


function pageButtonStyle(active = false, disabled = false) {
  return {
    minWidth: 36,
    height: 36,
    padding: "0 10px",
    borderRadius: 7,
    border: active ? "1px solid #075bb7" : "1px solid #d7e0e8",
    background: active ? "#075bb7" : "#ffffff",
    color: active ? "#ffffff" : "#405b74",
    fontWeight: 700,
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
  } as const;
}


export default function ProductsClient() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category")?.trim() || "ทั้งหมด";
  const shopSectionRef = useRef<HTMLElement | null>(null);


  const [sqlCategories, setSqlCategories] = useState<SqlCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");


  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(categoryFromUrl);
  const [status, setStatus] = useState("พร้อมขาย");
  const [showInactive, setShowInactive] = useState(false);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);


  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductQuickViewData | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);


  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);


  useEffect(() => {
    setCategory(categoryFromUrl);
  }, [categoryFromUrl]);


  useEffect(() => {
    let cancelled = false;


    async function loadCategories() {
      try {
        const response = await fetch("/api/product-categories", { cache: "no-store" });
        const data = await response.json();


        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {
          throw new Error(data?.message || "โหลดหมวดหมู่ไม่สำเร็จ");
        }


        if (!cancelled) {
          setSqlCategories(data.categories as SqlCategory[]);
        }
      } catch (error) {
        console.error("Load product categories error:", error);
        if (!cancelled) setSqlCategories([]);
      }
    }


    void loadCategories();


    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    let cancelled = false;


    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");


      try {
        const response = await fetch(
          `/api/products?includeInactive=${showInactive ? "1" : "0"}`,
          { cache: "no-store" }
        );
        const data = await response.json();


        if (!response.ok || !data?.ok || !Array.isArray(data?.products)) {
          throw new Error(data?.message || "โหลดสินค้าไม่สำเร็จ");
        }


        if (!cancelled) {
          setProducts(
            data.products.map((item: unknown) => normalizeApiProduct(item) as Product)
          );
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          setProductsError(
            error instanceof Error ? error.message : "โหลดสินค้าไม่สำเร็จ"
          );
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }


    void loadProducts();


    function handleUpdated() {
      void loadProducts();
    }


    window.addEventListener("srr-products-updated", handleUpdated);


    return () => {
      cancelled = true;
      window.removeEventListener("srr-products-updated", handleUpdated);
    };
  }, [showInactive]);


  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
    } catch (error) {
      console.error("Load cart error:", error);
    } finally {
      setCartLoaded(true);
    }
  }, []);


  useEffect(() => {
    if (!cartLoaded) return;


    window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    window.dispatchEvent(new Event("srr-cart-updated"));
  }, [cartItems, cartLoaded]);


  useEffect(() => {
    setPage(1);
  }, [search, category, status, showInactive, sort]);


  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);


  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();


    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.code.toLowerCase().includes(keyword) ||
        product.material.toLowerCase().includes(keyword);


      const matchesCategory =
        category === "ทั้งหมด" || product.category === category;


      const productStatus = getStockStatus(product.stock);
      const matchesStatus = status === "ทั้งหมด" || productStatus.label === status;
      const matchesActive = showInactive || product.active;


      return matchesSearch && matchesCategory && matchesStatus && matchesActive;
    });
  }, [products, search, category, status, showInactive]);


  const displayedProducts = useMemo(() => {
    const result = [...filteredProducts];


    if (sort === "latest") result.sort((a, b) => b.id - a.id);
    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));


    return result;
  }, [filteredProducts, sort]);


  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageProducts = displayedProducts.slice(startIndex, startIndex + PAGE_SIZE);
  const pageFrom = displayedProducts.length === 0 ? 0 : startIndex + 1;
  const pageTo = Math.min(startIndex + PAGE_SIZE, displayedProducts.length);
  const pageTokens = buildPageTokens(safePage, totalPages);


  const totalProducts = products.length;
  const sellingProducts = products.filter((product) => product.stock > 0).length;
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 50
  ).length;
  const outOfStockProducts = products.filter((product) => product.stock <= 0).length;


  function goToPage(nextPage: number) {
    const next = Math.min(Math.max(1, nextPage), totalPages);
    setPage(next);
    window.setTimeout(() => {
      shopSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }


  function toggleFavorite(productId: number) {
    setFavoriteIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }


  function addToCart(product: ProductQuickViewData, quantityToAdd = 1) {
    if (product.stock <= 0) return;


    const safeQuantity = Math.max(1, Math.min(quantityToAdd, product.stock));


    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);


      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + safeQuantity, product.stock),
              }
            : item
        );
      }


      return [
        ...current,
        {
          product: {
            id: product.id,
            name: product.name,
            code: product.code,
            category: product.category,
            material: product.material,
            price: product.price,
            stock: product.stock,
          },
          quantity: safeQuantity,
        },
      ];
    });


    setSelectedProductId(product.id);
    setIsCartOpen(true);
  }


  function increaseCartItem(productId: number) {
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, item.product.stock),
            }
          : item
      )
    );
  }


  function decreaseCartItem(productId: number) {
    setCartItems((current) =>
      current.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        if (item.quantity <= 1) return [];
        return [{ ...item, quantity: item.quantity - 1 }];
      })
    );
  }


  function removeCartItem(productId: number) {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }


  return (
    <div className={styles.productsPage}>
      <SiteHeader
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />


      <div className={styles.productsLayout}>
        <aside className={styles.categorySidebar}>
          <div className={styles.sidebarTitle}>
            <span>☰</span>
            หมวดหมู่สินค้า
          </div>


          <div className={styles.sidebarList}>
            {sqlCategories.map((item) => {
              const active = category === item.name;


              return (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.sidebarItem} ${
                    active ? styles.sidebarItemActive : ""
                  }`}
                  onClick={() => setCategory(item.name)}
                >
                  <span className={styles.sidebarIcon}>○</span>
                  <span className={styles.sidebarLabel}>{item.name}</span>
                  <span className={styles.sidebarArrow}>›</span>
                </button>
              );
            })}
          </div>


          <button
            type="button"
            className={styles.sidebarButton}
            onClick={() => setCategory("ทั้งหมด")}
          >
            ดูสินค้าทั้งหมด
          </button>
        </aside>


        <main className={styles.productsMain}>
          <section className={styles.pageHeader}>
            <div>
              <div className={styles.breadcrumb}>
                สินค้า <span>/</span> สินค้าทั้งหมด
              </div>
              <h1>สินค้า</h1>
              <p></p>
            </div>
          </section>


          <section className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>▣</div>
              <div>
                <span>สินค้าทั้งหมด</span>
                <strong>{totalProducts.toLocaleString("th-TH")}</strong>
                <small>รายการสินค้า</small>
              </div>
            </div>


            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>✓</div>
              <div>
                <span>สินค้าเปิดขาย</span>
                <strong>{sellingProducts.toLocaleString("th-TH")}</strong>
                <small>รายการ</small>
              </div>
            </div>


            <div className={`${styles.summaryCard} ${styles.warningCard}`}>
              <div className={styles.summaryIcon}>△</div>
              <div>
                <span>สินค้าใกล้หมด</span>
                <strong>{lowStockProducts.toLocaleString("th-TH")}</strong>
                <small>ต้องตรวจสอบ</small>
              </div>
            </div>


            <div className={`${styles.summaryCard} ${styles.dangerCard}`}>
              <div className={styles.summaryIcon}>!</div>
              <div>
                <span>สินค้าหมด</span>
                <strong>{outOfStockProducts.toLocaleString("th-TH")}</strong>
                <small>ต้องเติมสต็อก</small>
              </div>
            </div>
          </section>


          <section className={styles.filterCard}>
            <div className={styles.searchBox}>
              <span><SearchIcon /></span>
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
              {sqlCategories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
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
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              <span>แสดงสินค้าที่ปิดการขาย</span>
            </label>
          </section>


          <section className={styles.shopSection} ref={shopSectionRef}>
            <div className={styles.shopToolbar}>
              <div>
                <h2>{category === "ทั้งหมด" ? "รายการสินค้า" : `สินค้า ${category}`}</h2>
                <p>
                  แสดง {pageFrom.toLocaleString("th-TH")}–{pageTo.toLocaleString("th-TH")} จาก{" "}
                  {displayedProducts.length.toLocaleString("th-TH")} รายการ
                </p>
              </div>


              <div className={styles.shopSort}>
                <span>เรียงตาม</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="latest">ลำดับล่าสุด</option>
                  <option value="price-low">ราคาต่ำ - สูง</option>
                  <option value="price-high">ราคาสูง - ต่ำ</option>
                  <option value="name">ชื่อสินค้า</option>
                </select>
              </div>
            </div>


            <div className={styles.shopGrid}>
              {productsLoading && (
                <div className={styles.shopEmpty}>
                  <strong>กำลังโหลดสินค้า...</strong>
                  <span>กำลังอ่านข้อมูล</span>
                </div>
              )}


              {!productsLoading && productsError && (
                <div className={styles.shopEmpty}>
                  <strong>โหลดสินค้าไม่สำเร็จ</strong>
                  <span>{productsError}</span>
                </div>
              )}


              {!productsLoading &&
                !productsError &&
                pageProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const isSelected = selectedProductId === product.id;
                  const isFavorite = favoriteIds.includes(product.id);


                  return (
                    <article
                      key={product.id}
                      className={`${styles.shopCard} ${
                        isSelected ? styles.shopCardSelected : ""
                      }`}
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <button
                        type="button"
                        className={`${styles.favoriteButton} ${
                          isFavorite ? styles.favoriteButtonActive : ""
                        }`}
                        aria-label="รายการโปรด"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                      >
                        {isFavorite ? "♥" : "♡"}
                      </button>


                      <div
                        className={styles.shopImage}
                        onClick={(event) => {
                          event.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <div className={styles.productArtwork}>
                            <span className={styles.outerRing} />
                            <span className={styles.innerRing} />
                          </div>
                        )}
                      </div>


                      <div className={styles.shopInfo}>
                        <span className={styles.shopCategory}>{product.category}</span>
                        <div className={styles.shopName}>{product.name}</div>
                        <span className={styles.shopSku}>{product.code}</span>


                        <div className={styles.shopBottom}>
                          <strong className={styles.shopPrice}>
                            ฿{product.price.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </strong>


                          <span
                            className={`${styles.shopStock} ${
                              product.stock <= 0
                                ? styles.shopStockDanger
                                : product.stock <= 50
                                  ? styles.shopStockWarning
                                  : styles.shopStockReady
                            }`}
                          >
                            {product.stock > 0
                              ? `${stockStatus.label} · ${product.stock.toLocaleString("th-TH")} ชิ้น`
                              : stockStatus.label}
                          </span>
                        </div>
                      </div>


                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.addCartButton}
                          disabled={product.stock <= 0}
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(product, 1);
                          }}
                        >
                          {product.stock <= 0 ? "สินค้าหมด" : "หยิบใส่ตะกร้า"}
                        </button>


                        <button
                          type="button"
                          className={styles.iconActionButton}
                          title="ดูรายละเอียดสินค้า"
                          aria-label="ดูรายละเอียดสินค้า"
                          onClick={(event) => {
                            event.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                        >
                          <ViewIcon />
                        </button>
                      </div>
                    </article>
                  );
                })}


              {!productsLoading &&
                !productsError &&
                displayedProducts.length === 0 && (
                  <div className={styles.shopEmpty}>
                    <SearchIcon />
                    <strong>ไม่พบสินค้าที่ค้นหา</strong>
                    <span>ลองเปลี่ยนคำค้นหา หมวดหมู่ หรือสถานะสินค้า</span>
                  </div>
                )}
            </div>


            {!productsLoading && !productsError && displayedProducts.length > 0 && (
              <div style={paginationWrapStyle}>
                <div style={{ color: "#7e90a3", fontSize: 11 }}>
                  หน้า {safePage.toLocaleString("th-TH")} จาก {totalPages.toLocaleString("th-TH")} · {PAGE_SIZE} รายการ/หน้า
                </div>


                <div style={paginationButtonsStyle}>
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    style={pageButtonStyle(false, safePage <= 1)}
                    onClick={() => goToPage(safePage - 1)}
                  >
                    ‹
                  </button>


                  {pageTokens.map((token, index) => {
                    if (token === "left" || token === "right") {
                      return (
                        <span key={`${token}-${index}`} style={{ padding: "0 4px", color: "#8b9bad" }}>
                          …
                        </span>
                      );
                    }


                    return (
                      <button
                        type="button"
                        key={token}
                        style={pageButtonStyle(token === safePage, false)}
                        onClick={() => goToPage(token)}
                      >
                        {token}
                      </button>
                    );
                  })}


                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    style={pageButtonStyle(false, safePage >= totalPages)}
                    onClick={() => goToPage(safePage + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>


      <ProductQuickView
        open={quickViewProduct !== null}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
      />


      <CartDrawer
        open={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onIncrease={increaseCartItem}
        onDecrease={decreaseCartItem}
        onRemove={removeCartItem}
        onViewCart={() => {
          window.location.href = "/cart";
        }}
        onCheckout={() => {
          window.location.href = "/cart";
        }}
      />
    </div>
  );
}
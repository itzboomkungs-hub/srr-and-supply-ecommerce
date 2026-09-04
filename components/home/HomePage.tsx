"use client";


import Link from "next/link";
import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";


import styles from "./HomePage.module.css";


import SiteHeader from "../../components/layout/SiteHeader";
import CartDrawer from "../../components/cart/CartDrawer";
import ProductQuickView from "../../components/product/ProductQuickView";


import type { CartItem } from "../../components/cart/types";
import type { ProductQuickViewData } from "../../components/product/types";


import { normalizeApiProduct } from "../../lib/products/product-normalize.mjs";


const CART_KEY = "srr-demo-cart";


type Product = ProductQuickViewData;


type SrrHomeCategory = {
  id: number;
  name: string;
  code: string;
  description: string;
  productCount?: number;
};

const categories = [
  { name: "O-Ring", thai: "โอริง", icon: "◎" },
  { name: "Oil Seal", thai: "ซีลน้ำมัน", icon: "◉" },
  { name: "Hydraulic Seal", thai: "ซีลไฮดรอลิค", icon: "◌" },
  { name: "Pneumatic Seal", thai: "ซีลกระบอกลม", icon: "◍" },
  { name: "Rotary Seal", thai: "ซีลเพลาหมุน", icon: "◈" },
  { name: "Gasket", thai: "ประเก็น", icon: "◇" },
  { name: "Pump Parts", thai: "อะไหล่ปั๊ม", icon: "⚙" },
  { name: "Valve", thai: "วาล์ว", icon: "▣" },
  { name: "Industrial Parts", thai: "อะไหล่อุตสาหกรรม", icon: "⌘" },
];


const sideCategories = [
  "O-Ring",
  "Oil Seal",
  "Hydraulic Seal",
  "Pneumatic Seal",
  "Rotary Seal",
  "ประเก็น (Gasket)",
  "อะไหล่ปั๊มทุกชนิด",
  "วาล์ว (Valve)",
  "อะไหล่อุตสาหกรรม",
  "ชุดซ่อม (Repair Kit)",
  "น้ำมันและจาระบี",
  "อุปกรณ์อื่นๆ",
];


function getStockStatus(stock: number) {
  if (stock === 0) {
    return { label: "หมดสต็อก", type: "danger" };
  }


  if (stock <= 50) {
    return { label: "ใกล้หมด", type: "warning" };
  }


  return { label: "พร้อมขาย", type: "success" };
}


function TruckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
    </svg>
  );
}


function HeadsetIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5" />
    </svg>
  );
}


function ViewIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


const productStateStyle = {
  gridColumn: "1 / -1",
  minHeight: "180px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  padding: "28px",
  border: "1px solid #e1e7ef",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#73869a",
  textAlign: "center" as const,
};


export default function HomePage() {
  const [srrHomeCategoryRows, setSrrHomeCategoryRows] =
    useState<SrrHomeCategory[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSrrHomeCategories() {
      try {
        const response = await fetch("/api/product-categories", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {
          throw new Error(data?.message || "โหลดหมวดหมู่ไม่สำเร็จ");
        }

        if (!cancelled) {
          setSrrHomeCategoryRows(data.categories);
        }
      } catch (error) {
        console.error("Load home SQL categories error:", error);
        if (!cancelled) setSrrHomeCategoryRows([]);
      }
    }

    void loadSrrHomeCategories();

    function handleSrrProductsUpdated() {
      void loadSrrHomeCategories();
    }

    window.addEventListener("srr-products-updated", handleSrrProductsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("srr-products-updated", handleSrrProductsUpdated);
    };
  }, []);

  const srrHomeCategoryCards = srrHomeCategoryRows.map((item) => ({
    id: item.id,
    name: item.name,
    thai: item.description || "หมวดหมู่สินค้า",
    icon: "▦",
  }));

  const srrHomeSideCategories = srrHomeCategoryRows.map((item) => item.name);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");


  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductQuickViewData | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);


  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);


  useEffect(() => {
    let cancelled = false;


    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");


      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });


        const data = await response.json();


        if (!response.ok || !data?.ok || !Array.isArray(data?.products)) {
          throw new Error(data?.message || "โหลดสินค้าไม่สำเร็จ");
        }


        const normalized = data.products
          .map((item: unknown) => normalizeApiProduct(item) as Product)
          .slice(0, 6);


        if (!cancelled) {
          setProducts(normalized);
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          setProductsError(
            error instanceof Error ? error.message : "โหลดสินค้าไม่สำเร็จ"
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }


    void loadProducts();


    function handleProductsUpdated() {
      void loadProducts();
    }


    window.addEventListener("srr-products-updated", handleProductsUpdated);


    return () => {
      cancelled = true;
      window.removeEventListener("srr-products-updated", handleProductsUpdated);
    };
  }, []);


  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_KEY);


      if (saved) {
        const parsed = JSON.parse(saved);


        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (error) {
      console.error("Load cart error:", error);
    } finally {
      setCartLoaded(true);
    }
  }, []);


  useEffect(() => {
    if (!cartLoaded) {
      return;
    }


    window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    window.dispatchEvent(new Event("srr-cart-updated"));
  }, [cartItems, cartLoaded]);


  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );


  function toggleFavorite(productId: number) {
    setFavoriteIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }


      return [...current, productId];
    });
  }


  function addToCart(product: ProductQuickViewData, quantityToAdd = 1) {
    if (product.stock <= 0) {
      return;
    }


    const safeQuantity = Math.max(
      1,
      Math.min(quantityToAdd, product.stock)
    );


    setCartItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );


      if (existing) {
        return current.map((item) => {
          if (item.product.id !== product.id) {
            return item;
          }


          return {
            ...item,
            product: {
              ...item.product,
              name: product.name,
              code: product.code,
              category: product.category,
              material: product.material,
              price: product.price,
              stock: product.stock,
            },
            quantity: Math.min(
              item.quantity + safeQuantity,
              product.stock
            ),
          };
        });
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
      current.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }


        return {
          ...item,
          quantity: Math.min(
            item.quantity + 1,
            item.product.stock
          ),
        };
      })
    );
  }


  function decreaseCartItem(productId: number) {
    setCartItems((current) =>
      current.flatMap((item) => {
        if (item.product.id !== productId) {
          return [item];
        }


        if (item.quantity <= 1) {
          return [];
        }


        return [
          {
            ...item,
            quantity: item.quantity - 1,
          },
        ];
      })
    );
  }


  function removeCartItem(productId: number) {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }


  function openQuickView(product: ProductQuickViewData) {
    setSelectedProductId(product.id);
    setQuickViewProduct(product);
  }


  function closeQuickView() {
    setQuickViewProduct(null);
  }


  function handleQuickViewKeyDown(
    event: KeyboardEvent<HTMLElement>,
    product: ProductQuickViewData
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openQuickView(product);
    }
  }


  return (
    <div className={styles.homePage}>
      <SiteHeader
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />


      <main>
        <div className={`${styles.container} ${styles.homeMainLayout}`}>
          <aside className={styles.categorySidebar}>
            <div className={styles.sidebarTitle}>
              <span>☰</span>
              หมวดหมู่สินค้า
            </div>


            <div className={styles.sidebarList}>
              {srrHomeSideCategories.map((item) => (
                <Link
                  key={item}
                  href={`/products?category=${encodeURIComponent(item)}`}
                  className={styles.sidebarItem}
                >
                  <span className={styles.sidebarIcon}>○</span>
                  <span className={styles.sidebarLabel}>{item}</span>
                  <span className={styles.sidebarArrow}>›</span>
                </Link>
              ))}
            </div>


            <Link href="/products" className={styles.sidebarButton}>
              ดูสินค้าทั้งหมด
            </Link>
          </aside>


          <div className={styles.homeMainArea}>
            <section className={styles.hero}>
              <div className={styles.heroContent}>
                <div className={styles.heroLabel}>SRR AND SUPPLY</div>


                <h1>
                  ซีลและอะไหล่อุตสาหกรรม
                  <br />
                  ครบทุกประเภท
                </h1>


                <p>คุณภาพสูง • ทนทาน • พร้อมส่งทั่วประเทศ</p>


                <div className={styles.heroBenefits}>
                  <div>
                    <span>✓</span>
                    <strong>สินค้าคุณภาพ</strong>
                    <small>ได้มาตรฐาน</small>
                  </div>


                  <div>
                    <span>
                      <TruckIcon />
                    </span>
                    <strong>สต็อกพร้อมส่ง</strong>
                    <small>จัดส่งรวดเร็ว</small>
                  </div>


                  <div>
                    <span>฿</span>
                    <strong>ราคายุติธรรม</strong>
                    <small>คุ้มค่า</small>
                  </div>


                  <div>
                    <span>
                      <HeadsetIcon />
                    </span>
                    <strong>บริการให้คำปรึกษา</strong>
                    <small>โดยทีมงานมืออาชีพ</small>
                  </div>
                </div>


                <Link href="/products" className={styles.heroButton}>
                  เลือกซื้อสินค้าเลย
                </Link>
              </div>


              <div
                className={styles.heroProducts}
                style={{
                  width: "48%",
                  height: "100%",
                  minHeight: "360px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  padding: "18px",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src="/logo/hero-industrial-parts.png"
                  alt="ซีล โอริง ประเก็น อะไหล่ปั๊ม วาล์ว และอะไหล่อุตสาหกรรม SRR AND SUPPLY"
                  className={styles.heroImage}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    maxWidth: "580px",
                    maxHeight: "390px",
                    objectFit: "contain",
                    objectPosition: "center",
                    borderRadius: "12px",
                  }}
                />
              </div>
            </section>


            <section className={styles.homeSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2>หมวดหมู่สินค้า</h2>
                  <p>เลือกดูสินค้าตามประเภทที่ต้องการ</p>
                </div>


                <Link href="/products">ดูทั้งหมด →</Link>
              </div>


              <div className={styles.homeCategoryGrid}>
                {srrHomeCategoryCards.map((item) => (
                  <Link
                    href={`/products?category=${encodeURIComponent(item.name)}`}
                    key={item.id}
                    className={styles.homeCategoryCard}
                  >
                    <div className={styles.homeCategoryImage}>
                      {item.icon}
                    </div>
                    <strong>{item.name}</strong>
                    <span>{item.thai}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>


        <section className={styles.benefits}>
          <div className={`${styles.container} ${styles.benefitsGrid}`}>
            <div className={styles.benefit}>
              <span>✓</span>
              <div>
                <strong>สินค้าคุณภาพสูง</strong>
                <small>คัดสรรสินค้าคุณภาพได้มาตรฐาน</small>
              </div>
            </div>


            <div className={styles.benefit}>
              <span>
                <TruckIcon />
              </span>
              <div>
                <strong>สต็อกแน่น พร้อมส่ง</strong>
                <small>มีสินค้าครบ พร้อมจัดส่งรวดเร็ว</small>
              </div>
            </div>


            <div className={styles.benefit}>
              <span>฿</span>
              <div>
                <strong>ราคายุติธรรม</strong>
                <small>ราคาคุ้มค่า เหมาะกับทุกธุรกิจ</small>
              </div>
            </div>


            <div className={styles.benefit}>
              <span>
                <HeadsetIcon />
              </span>
              <div>
                <strong>บริการให้คำปรึกษา</strong>
                <small>ทีมงานพร้อมช่วยเลือกสินค้า</small>
              </div>
            </div>


            <div className={styles.benefit}>
              <span>✓</span>
              <div>
                <strong>รับประกันสินค้า</strong>
                <small>มั่นใจในคุณภาพและบริการหลังการขาย</small>
              </div>
            </div>
          </div>
        </section>


        <section className={styles.productsSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>สินค้าแนะนำ</h2>
                <p>สินค้าล่าสุดจากระบบ SRR AND SUPPLY</p>
              </div>


              <Link href="/products">ดูสินค้าทั้งหมด →</Link>
            </div>


            <div className={styles.productGrid}>
              {productsLoading && (
                <div style={productStateStyle}>
                  <strong style={{ color: "#173e6d" }}>
                    กำลังโหลดสินค้า...
                  </strong>
                  <span>กำลังอ่านข้อมูล</span>
                </div>
              )}


              {!productsLoading && productsError && (
                <div style={productStateStyle}>
                  <strong style={{ color: "#c84955" }}>
                    โหลดสินค้าไม่สำเร็จ
                  </strong>
                  <span>{productsError}</span>
                </div>
              )}


              {!productsLoading && !productsError && products.length === 0 && (
                <div style={productStateStyle}>
                  <strong style={{ color: "#173e6d" }}>
                    ยังไม่มีสินค้า
                  </strong>
                  <span>
                    เพิ่มสินค้าจากหลังบ้าน แล้วสินค้าใหม่จะแสดงในส่วนนี้
                  </span>
                </div>
              )}


              {!productsLoading &&
                !productsError &&
                products.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const isSelected = selectedProductId === product.id;
                  const isFavorite = favoriteIds.includes(product.id);


                  return (
                    <article
                      key={product.id}
                      className={`${styles.productCard} ${
                        isSelected ? styles.productCardSelected : ""
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
                        className={styles.productImage}
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          openQuickView(product);
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          handleQuickViewKeyDown(event, product);
                        }}
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <div className={styles.productArtwork}>
                            <span className={styles.outerRing} />
                            <span className={styles.innerRing} />
                          </div>
                        )}
                      </div>


                      <div className={styles.productInfo}>
                        <span className={styles.productCategory}>
                          {product.category || "สินค้า"}
                        </span>


                        <div
                          className={styles.productName}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            openQuickView(product);
                          }}
                          onKeyDown={(event) => {
                            event.stopPropagation();
                            handleQuickViewKeyDown(event, product);
                          }}
                        >
                          {product.name}
                        </div>


                        <span className={styles.productSku}>{product.code}</span>


                        <div className={styles.productBottom}>
                          <strong className={styles.productPrice}>
                            ฿{product.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>


                          <span
                            className={`${styles.productStock} ${
                              product.stock === 0
                                ? styles.productStockDanger
                                : product.stock <= 50
                                  ? styles.productStockWarning
                                  : styles.productStockReady
                            }`}
                          >
                            {product.stock > 0
                              ? `${stockStatus.label} · ${product.stock.toLocaleString()} ชิ้น`
                              : stockStatus.label}
                          </span>
                        </div>
                      </div>


                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.addCartButton}
                          disabled={product.stock === 0}
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(product, 1);
                          }}
                        >
                          {product.stock === 0
                            ? "สินค้าหมด"
                            : "หยิบใส่ตะกร้า"}
                        </button>


                        <button
                          type="button"
                          className={styles.iconActionButton}
                          aria-label="ดูรายละเอียด"
                          title="ดูรายละเอียด"
                          onClick={(event) => {
                            event.stopPropagation();
                            openQuickView(product);
                          }}
                        >
                          <ViewIcon />
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        </section>


        <section className={styles.contactBanner}>
          <div className={`${styles.container} ${styles.contactBannerInner}`}>
            <div>
              <strong>หาสินค้าที่ต้องการไม่เจอ?</strong>
              <p>
                แจ้งขนาด รุ่น หรือรายละเอียดที่ต้องการ ทีมงาน SRR AND SUPPLY
                พร้อมช่วยค้นหาให้
              </p>
            </div>


            <div className={styles.contactButtons}>
              <Link href="/contact">ติดต่อเรา</Link>
              <button type="button">สอบถามสินค้า</button>
            </div>
          </div>
        </section>
      </main>


      <ProductQuickView
        open={quickViewProduct !== null}
        product={quickViewProduct}
        onClose={closeQuickView}
        onAddToCart={addToCart}
      />


      <CartDrawer
        open={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onIncrease={increaseCartItem}
        onDecrease={decreaseCartItem}
        onRemove={removeCartItem}
        onContinueShopping={() => {
          setIsCartOpen(false);
          window.location.href = "/products";
        }}
        onViewCart={() => {
          setIsCartOpen(false);
          window.location.href = "/cart";
        }}
        onCheckout={() => {
          setIsCartOpen(false);
          window.location.href = "/cart";
        }}
      />
    </div>
  );
}
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./ProductsPage.module.css";

import SiteHeader from "../../components/layout/SiteHeader";
import CartDrawer from "../../components/cart/CartDrawer";
import ProductQuickView from "../../components/product/ProductQuickView";

import type {
  CartItem,
} from "../../components/cart/types";

import type {
  ProductQuickViewData,
} from "../../components/product/types";

const CART_KEY =
  "srr-demo-cart";

/* =====================================================
   PRODUCT TYPE
===================================================== */

type Product =
  ProductQuickViewData & {
    reserved: number;
  };

/* =====================================================
   PRODUCT CATEGORIES
===================================================== */

const categories = [
  {
    name: "O-Ring",
    thai: "โอริง",
    icon: "◎",
  },
  {
    name: "Oil Seal",
    thai: "ซีลน้ำมัน",
    icon: "◉",
  },
  {
    name: "Hydraulic Seal",
    thai: "ซีลไฮดรอลิค",
    icon: "◌",
  },
  {
    name: "Pneumatic Seal",
    thai: "ซีลกระบอกลม",
    icon: "◍",
  },
  {
    name: "Rotary Seal",
    thai: "ซีลเพลาหมุน",
    icon: "◈",
  },
  {
    name: "Gasket",
    thai: "ประเก็น",
    icon: "◇",
  },
  {
    name: "Pump Parts",
    thai: "อะไหล่ปั๊ม",
    icon: "⚙",
  },
  {
    name: "Valve",
    thai: "วาล์ว",
    icon: "▣",
  },
  {
    name: "Industrial Parts",
    thai: "อะไหล่อุตสาหกรรม",
    icon: "⌘",
  },
];

/* =====================================================
   SIDEBAR
===================================================== */

const sideCategories = [
  {
    label: "O-Ring",
    category: "O-Ring",
  },
  {
    label: "Oil Seal",
    category: "Oil Seal",
  },
  {
    label: "Hydraulic Seal",
    category: "Hydraulic Seal",
  },
  {
    label: "Pneumatic Seal",
    category: "Pneumatic Seal",
  },
  {
    label: "Rotary Seal",
    category: "Rotary Seal",
  },
  {
    label: "ประเก็น (Gasket)",
    category: "Gasket",
  },
  {
    label: "อะไหล่ปั๊มทุกชนิด",
    category: "Pump Parts",
  },
  {
    label: "วาล์ว (Valve)",
    category: "Valve",
  },
  {
    label: "อะไหล่อุตสาหกรรม",
    category: "Industrial Parts",
  },
  {
    label: "ชุดซ่อม (Repair Kit)",
    category: "",
  },
  {
    label: "น้ำมันและจาระบี",
    category: "",
  },
  {
    label: "อุปกรณ์อื่นๆ",
    category: "",
  },
];

/* =====================================================
   DEMO PRODUCTS
===================================================== */

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

/* =====================================================
   STOCK STATUS
===================================================== */

function getStockStatus(
  stock: number
) {
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

/* =====================================================
   SEARCH ICON
===================================================== */

function SearchIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =====================================================
   VIEW ICON
===================================================== */

function ViewIcon() {
  return (
    <svg
      width="19"
      height="19"
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

/* =====================================================
   PAGE
===================================================== */

export default function ProductsPage() {
  /* =====================================================
     FILTER
  ===================================================== */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("ทั้งหมด");

  const [
    status,
    setStatus,
  ] =
    useState("ทั้งหมด");

  const [
    showInactive,
    setShowInactive,
  ] =
    useState(false);

  const [
    sort,
    setSort,
  ] =
    useState("latest");

  /* =====================================================
     SELECTED PRODUCT
  ===================================================== */

  const [
    selectedProductId,
    setSelectedProductId,
  ] =
    useState<
      number | null
    >(null);

  /* =====================================================
     QUICK VIEW
  ===================================================== */

  const [
    quickViewProduct,
    setQuickViewProduct,
  ] =
    useState<
      ProductQuickViewData | null
    >(null);

  /* =====================================================
     FAVORITES
  ===================================================== */

  const [
    favoriteIds,
    setFavoriteIds,
  ] =
    useState<
      number[]
    >([]);

  /* =====================================================
     CART
  ===================================================== */

  const [
    cartItems,
    setCartItems,
  ] =
    useState<
      CartItem[]
    >([]);

  const [
    cartLoaded,
    setCartLoaded,
  ] =
    useState(false);

  const [
    isCartOpen,
    setIsCartOpen,
  ] =
    useState(false);

  /* =====================================================
     LOAD CART
  ===================================================== */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          CART_KEY
        );

      if (saved) {
        const data =
          JSON.parse(
            saved
          );

        if (
          Array.isArray(
            data
          )
        ) {
          setCartItems(
            data
          );
        }
      }
    } catch (error) {
      console.error(
        "Load cart error:",
        error
      );
    } finally {
      setCartLoaded(
        true
      );
    }
  }, []);

  /* =====================================================
     SAVE CART
  ===================================================== */

  useEffect(() => {
    if (!cartLoaded) {
      return;
    }

    window.localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        cartItems
      )
    );

    window.dispatchEvent(
      new Event(
        "srr-cart-updated"
      )
    );
  }, [
    cartItems,
    cartLoaded,
  ]);

  /* =====================================================
     CART COUNT
  ===================================================== */

  const cartCount =
    cartItems.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    );

  /* =====================================================
     FILTER PRODUCTS
  ===================================================== */

  const filteredProducts =
    useMemo(() => {
      return products.filter(
        (product) => {
          const keyword =
            search
              .toLowerCase()
              .trim();

          const matchesSearch =
            !keyword ||
            product.name
              .toLowerCase()
              .includes(
                keyword
              ) ||
            product.code
              .toLowerCase()
              .includes(
                keyword
              ) ||
            product.material
              .toLowerCase()
              .includes(
                keyword
              );

          const matchesCategory =
            category ===
              "ทั้งหมด" ||
            product.category ===
              category;

          const productStatus =
            getStockStatus(
              product.stock
            );

          const matchesStatus =
            status ===
              "ทั้งหมด" ||
            productStatus.label ===
              status;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        }
      );
    }, [
      search,
      category,
      status,
    ]);

  /* =====================================================
     SORT
  ===================================================== */

  const displayedProducts =
    useMemo(() => {
      const result = [
        ...filteredProducts,
      ];

      if (
        sort ===
        "latest"
      ) {
        result.sort(
          (
            a,
            b
          ) =>
            b.id -
            a.id
        );
      }

      if (
        sort ===
        "price-low"
      ) {
        result.sort(
          (
            a,
            b
          ) =>
            a.price -
            b.price
        );
      }

      if (
        sort ===
        "price-high"
      ) {
        result.sort(
          (
            a,
            b
          ) =>
            b.price -
            a.price
        );
      }

      if (
        sort ===
        "name"
      ) {
        result.sort(
          (
            a,
            b
          ) =>
            a.name.localeCompare(
              b.name
            )
        );
      }

      return result;
    }, [
      filteredProducts,
      sort,
    ]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalProducts =
    products.length;

  const sellingProducts =
    products.filter(
      (product) =>
        product.stock > 0
    ).length;

  const lowStockProducts =
    products.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= 50
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        product.stock ===
        0
    ).length;

  /* =====================================================
     FAVORITE
  ===================================================== */

  function toggleFavorite(
    productId: number
  ) {
    setFavoriteIds(
      (current) => {
        if (
          current.includes(
            productId
          )
        ) {
          return current.filter(
            (id) =>
              id !==
              productId
          );
        }

        return [
          ...current,
          productId,
        ];
      }
    );
  }

  /* =====================================================
     ADD TO CART
     ใช้ Product ตัวกลาง
  ===================================================== */

  function addToCart(
    product: ProductQuickViewData,
    quantityToAdd = 1
  ) {
    if (
      product.stock <= 0
    ) {
      return;
    }

    const safeQuantity =
      Math.max(
        1,
        Math.min(
          quantityToAdd,
          product.stock
        )
      );

    setCartItems(
      (current) => {
        const existing =
          current.find(
            (item) =>
              item.product.id ===
              product.id
          );

        if (existing) {
          return current.map(
            (item) => {
              if (
                item.product.id !==
                product.id
              ) {
                return item;
              }

              return {
                ...item,

                quantity:
                  Math.min(
                    item.quantity +
                      safeQuantity,
                    product.stock
                  ),
              };
            }
          );
        }

        return [
          ...current,

          {
            product: {
              id:
                product.id,

              name:
                product.name,

              code:
                product.code,

              category:
                product.category,

              material:
                product.material,

              price:
                product.price,

              stock:
                product.stock,
            },

            quantity:
              safeQuantity,
          },
        ];
      }
    );

    setSelectedProductId(
      product.id
    );

    setIsCartOpen(
      true
    );
  }

  /* =====================================================
     INCREASE CART
  ===================================================== */

  function increaseCartItem(
    productId: number
  ) {
    setCartItems(
      (current) =>
        current.map(
          (item) => {
            if (
              item.product.id !==
              productId
            ) {
              return item;
            }

            return {
              ...item,

              quantity:
                Math.min(
                  item.quantity +
                    1,
                  item.product.stock
                ),
            };
          }
        )
    );
  }

  /* =====================================================
     DECREASE CART
  ===================================================== */

  function decreaseCartItem(
    productId: number
  ) {
    setCartItems(
      (current) =>
        current.flatMap(
          (item) => {
            if (
              item.product.id !==
              productId
            ) {
              return [
                item,
              ];
            }

            if (
              item.quantity <=
              1
            ) {
              return [];
            }

            return [
              {
                ...item,

                quantity:
                  item.quantity -
                  1,
              },
            ];
          }
        )
    );
  }

  /* =====================================================
     REMOVE CART
  ===================================================== */

  function removeCartItem(
    productId: number
  ) {
    setCartItems(
      (current) =>
        current.filter(
          (item) =>
            item.product.id !==
            productId
        )
    );
  }

  /* =====================================================
     VIEW CART
  ===================================================== */

  function handleViewCart() {
    window.location.href =
      "/cart";
  }

  /* =====================================================
     CHECKOUT
  ===================================================== */

  function handleCheckout() {
    window.location.href =
      "/cart";
  }

  /* =====================================================
     OPEN QUICK VIEW
  ===================================================== */

  function openQuickView(
    product: ProductQuickViewData
  ) {
    setSelectedProductId(
      product.id
    );

    setQuickViewProduct(
      product
    );
  }

  /* =====================================================
     CLOSE QUICK VIEW
  ===================================================== */

  function closeQuickView() {
    setQuickViewProduct(
      null
    );
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div
      className={
        styles.productsPage
      }
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <SiteHeader
        cartCount={
          cartCount
        }
        onCartClick={() =>
          setIsCartOpen(
            true
          )
        }
      />


      {/* =================================================
          PRODUCTS LAYOUT
      ================================================= */}

      <div
        className={
          styles.productsLayout
        }
      >

        {/* =============================================
            SIDEBAR
        ============================================= */}

        <aside
          className={
            styles.categorySidebar
          }
        >

          <div
            className={
              styles.sidebarTitle
            }
          >
            <span>
              ☰
            </span>

            หมวดหมู่สินค้า
          </div>


          <div
            className={
              styles.sidebarList
            }
          >

            {sideCategories.map(
              (item) => {
                const isActive =
                  item.category !==
                    "" &&
                  category ===
                    item.category;

                return (
                  <button
                    type="button"
                    key={
                      item.label
                    }
                    className={`${styles.sidebarItem} ${
                      isActive
                        ? styles.sidebarItemActive
                        : ""
                    }`}
                    onClick={() => {
                      if (
                        item.category !==
                        ""
                      ) {
                        setCategory(
                          item.category
                        );
                      }
                    }}
                  >

                    <span
                      className={
                        styles.sidebarIcon
                      }
                    >
                      ○
                    </span>

                    <span
                      className={
                        styles.sidebarLabel
                      }
                    >
                      {
                        item.label
                      }
                    </span>

                    <span
                      className={
                        styles.sidebarArrow
                      }
                    >
                      ›
                    </span>

                  </button>
                );
              }
            )}

          </div>


          <button
            type="button"
            className={
              styles.sidebarButton
            }
            onClick={() =>
              setCategory(
                "ทั้งหมด"
              )
            }
          >
            ดูสินค้าทั้งหมด
          </button>

        </aside>


        {/* =============================================
            MAIN
        ============================================= */}

        <main
          className={
            styles.productsMain
          }
        >

          {/* =========================================
              PAGE HEADER
          ========================================= */}

          <section
            className={
              styles.pageHeader
            }
          >

            <div>

              <div
                className={
                  styles.breadcrumb
                }
              >
                จัดการสินค้า

                <span>
                  /
                </span>

                สินค้า
              </div>


              <h1>
                สินค้า
              </h1>


              <p>
                จัดการรายการสินค้า ราคา SKU และสถานะสต็อกของ SRR AND SUPPLY
              </p>

            </div>

          </section>


          {/* =========================================
              SUMMARY
          ========================================= */}

          <section
            className={
              styles.summaryGrid
            }
          >

            <div
              className={
                styles.summaryCard
              }
            >

              <div
                className={
                  styles.summaryIcon
                }
              >
                ▣
              </div>

              <div>
                <span>
                  สินค้าทั้งหมด
                </span>

                <strong>
                  {
                    totalProducts
                  }
                </strong>

                <small>
                  รายการสินค้า
                </small>
              </div>

            </div>


            <div
              className={
                styles.summaryCard
              }
            >

              <div
                className={
                  styles.summaryIcon
                }
              >
                ✓
              </div>

              <div>
                <span>
                  สินค้าเปิดขาย
                </span>

                <strong>
                  {
                    sellingProducts
                  }
                </strong>

                <small>
                  รายการ
                </small>
              </div>

            </div>


            <div
              className={`${styles.summaryCard} ${styles.warningCard}`}
            >

              <div
                className={
                  styles.summaryIcon
                }
              >
                △
              </div>

              <div>
                <span>
                  สินค้าใกล้หมด
                </span>

                <strong>
                  {
                    lowStockProducts
                  }
                </strong>

                <small>
                  ต้องตรวจสอบ
                </small>
              </div>

            </div>


            <div
              className={`${styles.summaryCard} ${styles.dangerCard}`}
            >

              <div
                className={
                  styles.summaryIcon
                }
              >
                !
              </div>

              <div>
                <span>
                  สินค้าหมด
                </span>

                <strong>
                  {
                    outOfStockProducts
                  }
                </strong>

                <small>
                  ต้องเติมสต็อก
                </small>
              </div>

            </div>

          </section>


          {/* =========================================
              FILTER
          ========================================= */}

          <section
            className={
              styles.filterCard
            }
          >

            <div
              className={
                styles.searchBox
              }
            >

              <span>
                <SearchIcon />
              </span>

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="ค้นหาชื่อสินค้า, SKU, วัสดุ..."
              />

            </div>


            <select
              className={
                styles.filterSelect
              }
              value={
                category
              }
              onChange={(
                event
              ) =>
                setCategory(
                  event.target.value
                )
              }
            >

              <option
                value="ทั้งหมด"
              >
                ทุกหมวดหมู่
              </option>

              {categories.map(
                (item) => (

                  <option
                    key={
                      item.name
                    }
                    value={
                      item.name
                    }
                  >
                    {
                      item.name
                    }
                  </option>

                )
              )}

            </select>


            <select
              className={
                styles.filterSelect
              }
              value={
                status
              }
              onChange={(
                event
              ) =>
                setStatus(
                  event.target.value
                )
              }
            >

              <option
                value="ทั้งหมด"
              >
                ทุกสถานะ
              </option>

              <option
                value="พร้อมขาย"
              >
                พร้อมขาย
              </option>

              <option
                value="ใกล้หมด"
              >
                ใกล้หมด
              </option>

              <option
                value="หมดสต็อก"
              >
                หมดสต็อก
              </option>

            </select>


            <label
              className={
                styles.checkboxFilter
              }
            >

              <input
                type="checkbox"
                checked={
                  showInactive
                }
                onChange={(
                  event
                ) =>
                  setShowInactive(
                    event.target.checked
                  )
                }
              />

              <span>
                แสดงสินค้าที่ปิดการขาย
              </span>

            </label>

          </section>


          {/* =========================================
              PRODUCT LIST
          ========================================= */}

          <section
            className={
              styles.shopSection
            }
          >

            {/* TOOLBAR */}

            <div
              className={
                styles.shopToolbar
              }
            >

              <div>

                <h2>
                  รายการสินค้า
                </h2>

                <p>
                  แสดง{" "}
                  {
                    displayedProducts.length
                  }{" "}
                  จาก{" "}
                  {
                    products.length
                  }{" "}
                  รายการ
                </p>

              </div>


              <div
                className={
                  styles.shopSort
                }
              >

                <span>
                  เรียงตาม
                </span>

                <select
                  value={
                    sort
                  }
                  onChange={(
                    event
                  ) =>
                    setSort(
                      event.target.value
                    )
                  }
                >

                  <option
                    value="latest"
                  >
                    ลำดับล่าสุด
                  </option>

                  <option
                    value="price-low"
                  >
                    ราคาต่ำ - สูง
                  </option>

                  <option
                    value="price-high"
                  >
                    ราคาสูง - ต่ำ
                  </option>

                  <option
                    value="name"
                  >
                    ชื่อสินค้า
                  </option>

                </select>

              </div>

            </div>


            {/* =========================================
                GRID
            ========================================= */}

            <div
              className={
                styles.shopGrid
              }
            >

              {displayedProducts.map(
                (product) => {

                  const stockStatus =
                    getStockStatus(
                      product.stock
                    );

                  const isSelected =
                    selectedProductId ===
                    product.id;

                  const isFavorite =
                    favoriteIds.includes(
                      product.id
                    );

                  return (

                    <article
                      key={
                        product.id
                      }
                      className={`${styles.shopCard} ${
                        isSelected
                          ? styles.shopCardSelected
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedProductId(
                          product.id
                        )
                      }
                    >

                      {/* FAVORITE */}

                      <button
                        type="button"
                        className={`${styles.favoriteButton} ${
                          isFavorite
                            ? styles.favoriteButtonActive
                            : ""
                        }`}
                        aria-label="รายการโปรด"
                        onClick={(
                          event
                        ) => {

                          event.stopPropagation();

                          toggleFavorite(
                            product.id
                          );

                        }}
                      >
                        {isFavorite
                          ? "♥"
                          : "♡"}
                      </button>


                      {/* =====================================
                          PRODUCT IMAGE
                      ===================================== */}

                      <div
                        className={
                          styles.shopImage
                        }
                        onClick={(
                          event
                        ) => {

                          event.stopPropagation();

                          openQuickView(
                            product
                          );

                        }}
                      >

                        {product.image ? (

                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            style={{
                              width:
                                "100%",
                              height:
                                "100%",
                              objectFit:
                                "contain",
                            }}
                          />

                        ) : (

                          <div
                            className={
                              styles.productArtwork
                            }
                          >

                            <span
                              className={
                                styles.outerRing
                              }
                            />

                            <span
                              className={
                                styles.innerRing
                              }
                            />

                          </div>

                        )}

                      </div>


                      {/* =====================================
                          INFORMATION
                      ===================================== */}

                      <div
                        className={
                          styles.shopInfo
                        }
                      >

                        <span
                          className={
                            styles.shopCategory
                          }
                        >
                          {
                            product.category
                          }
                        </span>


                        <div
                          className={
                            styles.shopName
                          }
                        >
                          {
                            product.name
                          }
                        </div>


                        <span
                          className={
                            styles.shopSku
                          }
                        >
                          {
                            product.code
                          }
                        </span>


                        <div
                          className={
                            styles.shopBottom
                          }
                        >

                          <strong
                            className={
                              styles.shopPrice
                            }
                          >
                            ฿
                            {product.price.toLocaleString()}
                            .00
                          </strong>


                          <span
                            className={`${styles.shopStock} ${
                              product.stock ===
                              0
                                ? styles.shopStockDanger
                                : product.stock <=
                                    50
                                  ? styles.shopStockWarning
                                  : styles.shopStockReady
                            }`}
                          >
                            {
                              stockStatus.label
                            }
                          </span>

                        </div>

                      </div>


                      {/* =====================================
                          ACTIONS
                      ===================================== */}

                      <div
                        className={
                          styles.cardActions
                        }
                      >

                        {/* ADD CART */}

                        <button
                          type="button"
                          className={
                            styles.addCartButton
                          }
                          disabled={
                            product.stock ===
                            0
                          }
                          onClick={(
                            event
                          ) => {

                            event.stopPropagation();

                            addToCart(
                              product,
                              1
                            );

                          }}
                        >
                          {product.stock ===
                          0
                            ? "สินค้าหมด"
                            : "หยิบใส่ตะกร้า"}
                        </button>


                        {/* QUICK VIEW */}

                        <button
                          type="button"
                          className={
                            styles.iconActionButton
                          }
                          title="ดูรายละเอียดสินค้า"
                          aria-label="ดูรายละเอียดสินค้า"
                          onClick={(
                            event
                          ) => {

                            event.stopPropagation();

                            openQuickView(
                              product
                            );

                          }}
                        >
                          <ViewIcon />
                        </button>

                      </div>

                    </article>

                  );
                }
              )}


              {/* =========================================
                  EMPTY
              ========================================= */}

              {displayedProducts.length ===
                0 && (

                <div
                  className={
                    styles.shopEmpty
                  }
                >

                  <SearchIcon />

                  <strong>
                    ไม่พบสินค้าที่ค้นหา
                  </strong>

                  <span>
                    ลองเปลี่ยนคำค้นหา หมวดหมู่ หรือสถานะสินค้า
                  </span>

                </div>

              )}

            </div>

          </section>

        </main>

      </div>


      {/* =================================================
          PRODUCT QUICK VIEW
      ================================================= */}

      <ProductQuickView
        open={
          quickViewProduct !==
          null
        }
        product={
          quickViewProduct
        }
        onClose={
          closeQuickView
        }
        onAddToCart={
          addToCart
        }
      />


      {/* =================================================
          CART DRAWER
      ================================================= */}

      <CartDrawer
        open={
          isCartOpen
        }
        items={
          cartItems
        }
        onClose={() =>
          setIsCartOpen(
            false
          )
        }
        onIncrease={
          increaseCartItem
        }
        onDecrease={
          decreaseCartItem
        }
        onRemove={
          removeCartItem
        }
        onViewCart={
          handleViewCart
        }
        onCheckout={
          handleCheckout
        }
      />

    </div>
  );
}
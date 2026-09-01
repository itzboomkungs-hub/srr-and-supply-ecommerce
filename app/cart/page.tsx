"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./CartPage.module.css";
import SiteHeader from "../../components/layout/SiteHeader";

import type { CartItem } from "../../components/cart/types";

const CART_KEY = "srr-demo-cart";

/* =====================================================
   PRODUCT ARTWORK
===================================================== */

function ProductArtwork() {
  return (
    <div className={styles.productArtwork}>
      <span className={styles.outerRing} />
      <span className={styles.innerRing} />
    </div>
  );
}

/* =====================================================
   CART ICON
===================================================== */

function CartIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4H5L7.2 14.2C7.35 14.9 7.95 15.4 8.67 15.4H17.4C18.08 15.4 18.67 14.94 18.85 14.29L20.5 8H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="9" cy="19" r="1.4" fill="currentColor" />
      <circle cx="17" cy="19" r="1.4" fill="currentColor" />
    </svg>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function CartPage() {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  const [shipping, setShipping] =
    useState("later");

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          CART_KEY
        );

      if (saved) {
        const data =
          JSON.parse(saved);

        if (Array.isArray(data)) {
          setItems(data);
        }
      }
    } catch (error) {
      console.error(
        "Load cart error:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =====================================================
     SAVE
  ===================================================== */

  useEffect(() => {
  if (!loaded) return;

  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(
    new Event("srr-cart-updated")
  );
}, [items, loaded]);

  /* =====================================================
     TOTAL
  ===================================================== */

  const itemCount =
    useMemo(() => {
      return items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      );
    }, [items]);

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (total, item) =>
          total +
          item.product.price *
            item.quantity,
        0
      );
    }, [items]);

  /* =====================================================
     INCREASE
  ===================================================== */

  function increase(
    productId: number
  ) {
    setItems((current) =>
      current.map((item) => {
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
              item.quantity + 1,
              item.product.stock
            ),
        };
      })
    );
  }

  /* =====================================================
     DECREASE
  ===================================================== */

  function decrease(
    productId: number
  ) {
    setItems((current) =>
      current.flatMap((item) => {
        if (
          item.product.id !==
          productId
        ) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [
          {
            ...item,
            quantity:
              item.quantity - 1,
          },
        ];
      })
    );
  }

  /* =====================================================
     REMOVE
  ===================================================== */

  function remove(
    productId: number
  ) {
    setItems((current) =>
      current.filter(
        (item) =>
          item.product.id !==
          productId
      )
    );
  }

  /* =====================================================
     CLEAR
  ===================================================== */

  function clearCart() {
    setItems([]);
  }

  /* =====================================================
     LOADING
  ===================================================== */

 if (!loaded) {
  return (
    <>
      <SiteHeader />

      <main className={styles.page}>
        <div className={styles.loading}>
          กำลังโหลดตะกร้าสินค้า...
        </div>
      </main>
    </>
  );
}

  return (
   <>
    <SiteHeader />

    <main className={styles.page}>

      <div className={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className={styles.pageHeader}>

          <div>

            <div className={styles.breadcrumb}>
              <Link href="/">
                หน้าแรก
              </Link>

              <span>/</span>

              <span>
                ตะกร้าสินค้า
              </span>
            </div>

            <h1>
              ตะกร้าสินค้า
            </h1>

            <p>
              ตรวจสอบสินค้าและจำนวนก่อนดำเนินการสั่งซื้อ
            </p>

          </div>


          <Link
            href="/products"
            className={styles.continueButton}
          >
            ← เลือกซื้อสินค้าต่อ
          </Link>

        </div>


        {/* =================================================
            EMPTY
        ================================================= */}

        {items.length === 0 ? (

          <div className={styles.emptyCart}>

            <div className={styles.emptyIcon}>
              <CartIcon />
            </div>

            <h2>
              ตะกร้าสินค้าว่าง
            </h2>

            <p>
              ยังไม่มีสินค้าในตะกร้าของคุณ
            </p>

            <Link href="/products">
              เลือกซื้อสินค้า
            </Link>

          </div>

        ) : (

          /* =================================================
             CART
          ================================================= */

          <div className={styles.cartLayout}>

            {/* ===============================================
                LEFT
            =============================================== */}

            <section className={styles.cartTable}>

              {/* HEADER */}

              <div className={styles.tableHeader}>

                <div />

                <div />

                <div>
                  สินค้า
                </div>

                <div>
                  รหัสสินค้า
                </div>

                <div>
                  ราคา
                </div>

                <div>
                  จำนวน
                </div>

                <div className={styles.right}>
                  ยอดรวม
                </div>

              </div>


              {/* ITEMS */}

              {items.map((item) => {

                const total =
                  item.product.price *
                  item.quantity;

                return (

                  <div
                    key={item.product.id}
                    className={styles.cartRow}
                  >

                    {/* REMOVE */}

                    <div>

                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() =>
                          remove(
                            item.product.id
                          )
                        }
                        aria-label="ลบสินค้า"
                      >
                        ×
                      </button>

                    </div>


                    {/* IMAGE */}

                    <div>

                      <div className={styles.productImage}>

                        <ProductArtwork />

                      </div>

                    </div>


                    {/* PRODUCT */}

                    <div className={styles.productName}>

                      <strong>
                        {item.product.name}
                      </strong>

                      <small>
                        {item.product.category}
                      </small>

                    </div>


                    {/* SKU */}

                    <div className={styles.sku}>
                      {item.product.code}
                    </div>


                    {/* PRICE */}

                    <div className={styles.price}>
                      {item.product.price.toLocaleString()}
                      .00 บาท
                    </div>


                    {/* QUANTITY */}

                    <div>

                      <div className={styles.quantity}>

                        <button
                          type="button"
                          onClick={() =>
                            decrease(
                              item.product.id
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increase(
                              item.product.id
                            )
                          }
                          disabled={
                            item.quantity >=
                            item.product.stock
                          }
                        >
                          +
                        </button>

                      </div>

                    </div>


                    {/* TOTAL */}

                    <div className={styles.lineTotal}>
                      {total.toLocaleString()}
                      .00 บาท
                    </div>

                  </div>

                );
              })}


              {/* CART ACTION */}

              <div className={styles.cartBottom}>

                <Link href="/products">
                  ← เลือกซื้อสินค้าต่อ
                </Link>


                <button
                  type="button"
                  onClick={clearCart}
                >
                  ล้างตะกร้า
                </button>

              </div>

            </section>


            {/* ===============================================
                SUMMARY
            =============================================== */}

            <aside className={styles.summary}>

              <h2>
                ยอดรวม
              </h2>


              <div className={styles.summaryRow}>

                <span>
                  จำนวนสินค้า
                </span>

                <strong>
                  {itemCount} ชิ้น
                </strong>

              </div>


              <div className={styles.summaryRow}>

                <span>
                  ยอดรวม
                </span>

                <strong>
                  {subtotal.toLocaleString()}
                  .00 บาท
                </strong>

              </div>


              {/* SHIPPING */}

              <div className={styles.shipping}>

                <div className={styles.shippingTitle}>
                  การจัดส่ง
                </div>


                <label>

                  <input
                    type="radio"
                    name="shipping"
                    checked={
                      shipping === "later"
                    }
                    onChange={() =>
                      setShipping("later")
                    }
                  />

                  <span>

                    <strong>
                      คำนวณค่าจัดส่งก่อนชำระเงิน
                    </strong>

                    <small>
                      ยังไม่ได้ทำ
                    </small>

                  </span>

                </label>


                <label>

                  <input
                    type="radio"
                    name="shipping"
                    checked={
                      shipping === "pickup"
                    }
                    onChange={() =>
                      setShipping("pickup")
                    }
                  />

                  <span>

                    <strong>
                      รับสินค้าด้วยตนเอง
                    </strong>

                    <small>
                      รับสินค้าที่ร้าน SRR AND SUPPLY
                    </small>

                  </span>

                </label>

              </div>


              {/* GRAND TOTAL */}

              <div className={styles.grandTotal}>

                <span>
                  รวม
                </span>

                <strong>
                  {subtotal.toLocaleString()}
                  .00 บาท
                </strong>

              </div>


              <button
                type="button"
                className={styles.checkout}
                onClick={() =>
                  alert(
                    "รอทำ2"
                  )
                }
              >
                ดำเนินการสั่งซื้อ
              </button>

            </aside>

          </div>

        )}

      </div>

       </main>
  </>
);
}
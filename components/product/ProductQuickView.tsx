"use client";

import {
  useEffect,
  useState,
} from "react";

import styles from "./ProductQuickView.module.css";

import type {
  ProductQuickViewData,
} from "./types";

/* =====================================================
   PROPS
===================================================== */

type ProductQuickViewProps = {
  open: boolean;

  product:
    | ProductQuickViewData
    | null;

  onClose: () => void;

  onAddToCart: (
    product: ProductQuickViewData,
    quantity: number
  ) => void;
};

/* =====================================================
   PRODUCT FALLBACK ARTWORK
===================================================== */

function ProductArtwork() {
  return (
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
  );
}

/* =====================================================
   COMPONENT
===================================================== */

export default function ProductQuickView({
  open,
  product,
  onClose,
  onAddToCart,
}: ProductQuickViewProps) {
  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  /* =====================================================
     RESET QUANTITY
  ===================================================== */

  useEffect(() => {
    if (open) {
      setQuantity(1);
    }
  }, [
    open,
    product?.id,
  ]);

  /* =====================================================
     ESC CLOSE
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [
    open,
    onClose,
  ]);

  /* =====================================================
     HIDDEN
  ===================================================== */

  if (
    !open ||
    !product
  ) {
    return null;
  }

  /* =====================================================
     STOCK
  ===================================================== */

  const outOfStock =
    product.stock <= 0;

  const lowStock =
    product.stock > 0 &&
    product.stock <= 50;

  /* =====================================================
     QUANTITY
  ===================================================== */

  function decrease() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  }

  function increase() {
    setQuantity(
      (current) =>
        Math.min(
          product.stock,
          current + 1
        )
    );
  }

  /* =====================================================
     ADD
  ===================================================== */

  function handleAdd() {
    if (outOfStock) {
      return;
    }

    onAddToCart(
      product,
      quantity
    );

    onClose();
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div
      className={
        styles.overlay
      }
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className={
          styles.modal
        }
        role="dialog"
        aria-modal="true"
        aria-label={
          product.name
        }
      >

        {/* =============================================
            CLOSE
        ============================================= */}

        <button
          type="button"
          className={
            styles.closeButton
          }
          onClick={
            onClose
          }
          aria-label="ปิด"
        >
          ×
        </button>


        {/* =============================================
            IMAGE
        ============================================= */}

        <div
          className={
            styles.imageArea
          }
        >

          {product.image ? (

            <img
              src={
                product.image
              }
              alt={
                product.name
              }
              className={
                styles.productImage
              }
            />

          ) : (

            <ProductArtwork />

          )}

        </div>


        {/* =============================================
            INFORMATION
        ============================================= */}

        <div
          className={
            styles.information
          }
        >

          <div
            className={
              styles.category
            }
          >
            {
              product.category
            }
          </div>


          <h2>
            {
              product.name
            }
          </h2>


          <div
            className={
              styles.code
            }
          >
            SKU:{" "}
            {
              product.code
            }
          </div>


          <div
            className={
              styles.price
            }
          >
            ฿
            {product.price.toLocaleString()}
            .00
          </div>


          {/* =========================================
              PRODUCT DETAILS
          ========================================= */}

          <div
            className={
              styles.details
            }
          >

            <div>
              <span>
                วัสดุ
              </span>

              <strong>
                {
                  product.material
                }
              </strong>
            </div>


            <div>
              <span>
                สต็อก
              </span>

              <strong>
                {
                  product.stock.toLocaleString()
                }{" "}
                ชิ้น
              </strong>
            </div>

          </div>


          {/* =========================================
              STOCK STATUS
          ========================================= */}

          <div
            className={`${styles.stockStatus} ${
              outOfStock
                ? styles.stockDanger
                : lowStock
                  ? styles.stockWarning
                  : styles.stockReady
            }`}
          >
            {outOfStock
              ? "สินค้าหมด"
              : lowStock
                ? "สินค้าใกล้หมด"
                : "พร้อมขาย"}
          </div>


          {/* =========================================
              DESCRIPTION
          ========================================= */}

          <div
            className={
              styles.description
            }
          >
            <p>
              สินค้าอุตสาหกรรมคุณภาพสูง
              สำหรับงานซ่อมบำรุงและงานอุตสาหกรรม
              เลือกขนาดและรุ่นให้เหมาะสมกับการใช้งาน
            </p>

            <p>
              กรุณาตรวจสอบรหัสสินค้า
              วัสดุ และขนาดก่อนสั่งซื้อ
            </p>
          </div>


          {/* =========================================
              BOTTOM ACTION
          ========================================= */}

          <div
            className={
              styles.bottom
            }
          >

            <div
              className={
                styles.quantity
              }
            >

              <button
                type="button"
                onClick={
                  decrease
                }
                disabled={
                  outOfStock
                }
              >
                −
              </button>

              <span>
                {
                  outOfStock
                    ? 0
                    : quantity
                }
              </span>

              <button
                type="button"
                onClick={
                  increase
                }
                disabled={
                  outOfStock ||
                  quantity >=
                    product.stock
                }
              >
                +
              </button>

            </div>


            <button
              type="button"
              className={
                styles.addButton
              }
              disabled={
                outOfStock
              }
              onClick={
                handleAdd
              }
            >
              {outOfStock
                ? "สินค้าหมด"
                : "หยิบใส่ตะกร้า"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
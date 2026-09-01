"use client";

import styles from "./CartDrawer.module.css";
import type { CartItem } from "./types";

type CartDrawerProps = {
  open: boolean;
  items: CartItem[];

  onClose: () => void;

  onIncrease: (productId: number) => void;

  onDecrease: (productId: number) => void;

  onRemove: (productId: number) => void;

  onViewCart?: () => void;

  onCheckout?: () => void;
};

/* =====================================================
   ICONS
===================================================== */

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M9 3H15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M6.5 7L7.4 20H16.6L17.5 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M10 11V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M14 11V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="22"
      height="22"
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

      <circle
        cx="9"
        cy="19"
        r="1.4"
        fill="currentColor"
      />

      <circle
        cx="17"
        cy="19"
        r="1.4"
        fill="currentColor"
      />
    </svg>
  );
}

/* =====================================================
   PRODUCT MOCK IMAGE
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
   CART DRAWER
===================================================== */

export default function CartDrawer({
  open,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onViewCart,
  onCheckout,
}: CartDrawerProps) {
  const totalQuantity = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      item.product.price *
        item.quantity,
    0
  );

  return (
    <>
      {/* =================================================
          OVERLAY
      ================================================= */}

      <div
        className={`${styles.overlay} ${
          open
            ? styles.overlayOpen
            : ""
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />


      {/* =================================================
          DRAWER
      ================================================= */}

      <aside
        className={`${styles.drawer} ${
          open
            ? styles.drawerOpen
            : ""
        }`}
        aria-hidden={!open}
      >

        {/* ===============================================
            HEADER
        =============================================== */}

        <header className={styles.header}>

          <div>

            <span className={styles.headerIcon}>
              <CartIcon />
            </span>

            <div>
              <h2>
                ตะกร้าสินค้า
              </h2>

              <small>
                {totalQuantity} รายการ
              </small>
            </div>

          </div>


          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="ปิดตะกร้าสินค้า"
          >
            <CloseIcon />
          </button>

        </header>


        {/* ===============================================
            BODY
        =============================================== */}

        <div className={styles.body}>

          {items.length === 0 ? (

            <div className={styles.emptyState}>

              <div className={styles.emptyIcon}>
                <CartIcon />
              </div>

              <strong>
                ยังไม่มีสินค้าในตะกร้า
              </strong>

              <span>
                เลือกสินค้าที่ต้องการแล้วกด
                “หยิบใส่ตะกร้า”
              </span>

              <button
                type="button"
                onClick={onClose}
              >
                เลือกซื้อสินค้า
              </button>

            </div>

          ) : (

            <div className={styles.itemList}>

              {items.map((item) => {

                const {
                  product,
                  quantity,
                } = item;

                const lineTotal =
                  product.price *
                  quantity;

                return (

                  <article
                    key={product.id}
                    className={styles.cartItem}
                  >

                    {/* IMAGE */}

                    <div className={styles.productImage}>

                      <ProductArtwork />

                    </div>


                    {/* INFO */}

                    <div className={styles.productInfo}>

                      <div className={styles.productTop}>

                        <div>

                          <span className={styles.category}>
                            {product.category}
                          </span>

                          <strong>
                            {product.name}
                          </strong>

                          <small>
                            SKU: {product.code}
                          </small>

                        </div>


                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() =>
                            onRemove(
                              product.id
                            )
                          }
                          aria-label={`ลบ ${product.name}`}
                        >
                          <TrashIcon />
                        </button>

                      </div>


                      {/* QUANTITY */}

                      <div className={styles.itemBottom}>

                        <div className={styles.quantityBox}>

                          <button
                            type="button"
                            onClick={() =>
                              onDecrease(
                                product.id
                              )
                            }
                            aria-label="ลดจำนวน"
                          >
                            −
                          </button>


                          <span>
                            {quantity}
                          </span>


                          <button
                            type="button"
                            onClick={() =>
                              onIncrease(
                                product.id
                              )
                            }
                            disabled={
                              quantity >=
                              product.stock
                            }
                            aria-label="เพิ่มจำนวน"
                          >
                            +
                          </button>

                        </div>


                        <div className={styles.priceBlock}>

                          {quantity > 1 && (
                            <small>
                              {quantity} ×{" "}
                              ฿
                              {product.price.toLocaleString()}
                            </small>
                          )}

                          <strong>
                            ฿
                            {lineTotal.toLocaleString()}
                            .00
                          </strong>

                        </div>

                      </div>

                    </div>

                  </article>

                );
              })}

            </div>

          )}

        </div>


        {/* ===============================================
            FOOTER
        =============================================== */}

        {items.length > 0 && (

          <footer className={styles.footer}>

            <div className={styles.summaryRow}>

              <span>
                จำนวนสินค้า
              </span>

              <strong>
                {totalQuantity} ชิ้น
              </strong>

            </div>


            <div className={styles.totalRow}>

              <span>
                รวม
              </span>

              <strong>
                ฿
                {subtotal.toLocaleString()}
                .00
              </strong>

            </div>


            <p className={styles.priceNote}>
              * กรุณาตรวจสอบราคาสินค้าและค่าจัดส่งอีกครั้งก่อนชำระเงิน
            </p>


            <button
              type="button"
              className={styles.viewCartButton}
              onClick={onViewCart}
            >
              ดูตะกร้าสินค้า
            </button>


            <button
              type="button"
              className={styles.checkoutButton}
              onClick={onCheckout}
            >
              สั่งซื้อและชำระเงิน
            </button>

          </footer>

        )}

      </aside>
    </>
  );
}
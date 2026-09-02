"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import styles from "./CartDrawer.module.css";
import type { CartItem } from "./types";


/* =====================================================
   TYPES
===================================================== */

type CartDrawerProps = {
  open: boolean;

  items: CartItem[];

  onClose: () => void;

  onIncrease: (
    productId: number
  ) => void;

  onDecrease: (
    productId: number
  ) => void;

  onRemove: (
    productId: number
  ) => void;

  /*
    ถ้ามี handler สำหรับกำหนดจำนวนตรง ๆ
    สามารถส่งเข้ามาได้

    ถ้าไม่มี ระบบจะใช้ onIncrease / onDecrease เดิม
  */
  onQuantityChange?: (
    productId: number,
    quantity: number
  ) => void;

  onViewCart?: () => void;

  onCheckout?: () => void;

  onContinueShopping?: () => void;
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
   PRODUCT IMAGE
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
   QUANTITY INPUT
===================================================== */

type QuantityInputProps = {
  productId: number;

  quantity: number;

  stock: number;

  onIncrease: (
    productId: number
  ) => void;

  onDecrease: (
    productId: number
  ) => void;

  onQuantityChange?: (
    productId: number,
    quantity: number
  ) => void;
};


function QuantityInput({
  productId,
  quantity,
  stock,
  onIncrease,
  onDecrease,
  onQuantityChange,
}: QuantityInputProps) {

  /*
    ค่าที่กำลังพิมพ์

    เช่น stock = 32
    สามารถพิมพ์ 100 ได้ก่อน

    พอกด Enter หรือคลิกออก
    จะเปลี่ยนกลับเป็น 32
  */
  const [
    draft,
    setDraft,
  ] =
    useState(
      String(quantity)
    );


  /* =====================================================
     SYNC CART -> INPUT
  ===================================================== */

  useEffect(() => {
    setDraft(
      String(quantity)
    );
  }, [
    quantity,
  ]);


  /* =====================================================
     SAFE STOCK
  ===================================================== */

  const safeStock =
    Math.max(
      0,
      Math.floor(
        Number.isFinite(
          stock
        )
          ? stock
          : 0
      )
    );


  /* =====================================================
     CLAMP QUANTITY
  ===================================================== */

  function normalizeQuantity(
    requestedQuantity: number
  ) {

    /*
      ไม่มีสต็อก
    */
    if (
      safeStock <= 0
    ) {
      return 0;
    }


    /*
      ต่ำสุด = 1
      สูงสุด = stock จริง
    */
    return Math.max(
      1,
      Math.min(
        Math.floor(
          requestedQuantity
        ),
        safeStock
      )
    );
  }


  /* =====================================================
     UPDATE CART
  ===================================================== */

  function updateCartQuantity(
    nextQuantity: number
  ) {

    /*
      ถ้าหน้าแม่มี function
      สำหรับกำหนดจำนวนโดยตรง
    */
    if (
      onQuantityChange
    ) {

      onQuantityChange(
        productId,
        nextQuantity
      );

      return;
    }


    /*
      รองรับระบบเดิม

      ถ้าจำนวนใหม่มากกว่าเดิม
      เรียก onIncrease
    */
    const difference =
      nextQuantity -
      quantity;


    if (
      difference > 0
    ) {

      for (
        let index = 0;
        index <
        difference;
        index += 1
      ) {

        onIncrease(
          productId
        );
      }

      return;
    }


    /*
      ถ้าจำนวนใหม่น้อยกว่าเดิม
    */
    if (
      difference < 0
    ) {

      for (
        let index = 0;
        index <
        Math.abs(
          difference
        );
        index += 1
      ) {

        onDecrease(
          productId
        );
      }
    }
  }


  /* =====================================================
     COMMIT INPUT
  ===================================================== */

  function commitDraft() {

    /*
      STOCK = 0
    */
    if (
      safeStock <= 0
    ) {

      setDraft("0");

      if (
        quantity !== 0
      ) {

        updateCartQuantity(
          0
        );
      }

      return;
    }


    /*
      ถ้าลบเลขจนช่องว่าง
      ให้กลับเป็นค่าเดิม
    */
    if (
      draft.trim() === ""
    ) {

      setDraft(
        String(quantity)
      );

      return;
    }


    const parsedQuantity =
      Number.parseInt(
        draft,
        10
      );


    /*
      ค่าผิดปกติ
    */
    if (
      Number.isNaN(
        parsedQuantity
      )
    ) {

      setDraft(
        String(quantity)
      );

      return;
    }


    /*
      ==============================
      ตัวอย่าง

      stock = 32
      กรอก = 100

      nextQuantity = 32
      ==============================
    */

    const nextQuantity =
      normalizeQuantity(
        parsedQuantity
      );


    /*
      เปลี่ยนเลขในช่องกลับ
      เป็นจำนวนที่มีจริง
    */
    setDraft(
      String(
        nextQuantity
      )
    );


    /*
      ถ้าจำนวนเปลี่ยน
      update cart
    */
    if (
      nextQuantity !==
      quantity
    ) {

      updateCartQuantity(
        nextQuantity
      );
    }
  }


  /* =====================================================
     TYPE
  ===================================================== */

  function handleChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {

    /*
      รับเฉพาะ 0-9

      แต่ยังไม่จำกัด stock
      ระหว่างกำลังพิมพ์
    */
    const value =
      event
        .target
        .value
        .replace(
          /[^0-9]/g,
          ""
        );


    setDraft(
      value
    );
  }


  /* =====================================================
     KEYBOARD
  ===================================================== */

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLInputElement>
  ) {

    /*
      ENTER

      ตรวจจำนวน
      ถ้าเกิน stock
      เด้งกลับทันที
    */
    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      commitDraft();

      event
        .currentTarget
        .blur();

      return;
    }


    /*
      ESC

      ยกเลิกเลขที่กำลังพิมพ์
    */
    if (
      event.key ===
      "Escape"
    ) {

      event.preventDefault();

      setDraft(
        String(quantity)
      );

      event
        .currentTarget
        .blur();
    }
  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <input
      type="text"

      inputMode="numeric"

      pattern="[0-9]*"

      value={
        draft
      }

      disabled={
        safeStock <= 0
      }

      onChange={
        handleChange
      }

      /*
        คลิกออกจากช่อง
        ตรวจ stock
      */
      onBlur={
        commitDraft
      }

      onKeyDown={
        handleKeyDown
      }

      /*
        คลิกช่องแล้ว
        select เลขเดิมทั้งหมด

        เช่น:
        1

        คลิกแล้วพิมพ์ 25
        ได้เลย
      */
      onFocus={(
        event
      ) => {

        event
          .currentTarget
          .select();
      }}

      aria-label="จำนวนสินค้า"

      title={
        safeStock > 0
          ? `กรอกได้สูงสุด ${safeStock} ชิ้น`
          : "สินค้าหมด"
      }

      style={{
        width:
          "46px",

        minWidth:
          "46px",

        height:
          "100%",

        padding:
          "0 4px",

        borderTop:
          "0",

        borderBottom:
          "0",

        borderLeft:
          "1px solid #e2e8ef",

        borderRight:
          "1px solid #e2e8ef",

        outline:
          "none",

        background:
          safeStock > 0
            ? "#ffffff"
            : "#f3f5f7",

        color:
          safeStock > 0
            ? "#263b53"
            : "#9aa7b5",

        fontFamily:
          "inherit",

        fontSize:
          "12px",

        fontWeight:
          700,

        textAlign:
          "center",

        boxSizing:
          "border-box",
      }}
    />
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

  onQuantityChange,

  onViewCart,

  onCheckout,

  onContinueShopping,
}: CartDrawerProps) {


  /* =====================================================
     TOTAL QUANTITY
  ===================================================== */

  const totalQuantity =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    );


  /* =====================================================
     SUBTOTAL
  ===================================================== */

  const subtotal =
    items.reduce(
      (
        total,
        item
      ) =>
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

        onClick={
          onClose
        }

        aria-hidden={
          !open
        }
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

        aria-hidden={
          !open
        }
      >

        {/* ===============================================
            HEADER
        =============================================== */}

        <header
          className={
            styles.header
          }
        >

          <div>

            <span
              className={
                styles.headerIcon
              }
            >
              <CartIcon />
            </span>


            <div>

              <h2>
                ตะกร้าสินค้า
              </h2>

              <small>
                {
                  totalQuantity
                }{" "}
                รายการ
              </small>

            </div>

          </div>


          <button
            type="button"

            className={
              styles.closeButton
            }

            onClick={
              onClose
            }

            aria-label="ปิดตะกร้าสินค้า"
          >
            <CloseIcon />
          </button>

        </header>


        {/* ===============================================
            BODY
        =============================================== */}

        <div
          className={
            styles.body
          }
        >

          {items.length ===
          0 ? (

            /* ===========================================
               EMPTY CART
            =========================================== */

            <div
              className={
                styles.emptyState
              }
            >

              <div
                className={
                  styles.emptyIcon
                }
              >
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

                onClick={() => {

                  onClose();

                  onContinueShopping?.();
                }}
              >
                เลือกซื้อสินค้า
              </button>

            </div>

          ) : (

            /* ===========================================
               CART ITEMS
            =========================================== */

            <div
              className={
                styles.itemList
              }
            >

              {items.map(
                (
                  item
                ) => {

                  const {
                    product,
                    quantity,
                  } =
                    item;


                  const lineTotal =
                    product.price *
                    quantity;


                  return (

                    <article
                      key={
                        product.id
                      }

                      className={
                        styles.cartItem
                      }
                    >

                      {/* ===============================
                          IMAGE
                      =============================== */}

                      <div
                        className={
                          styles.productImage
                        }
                      >
                        <ProductArtwork />
                      </div>


                      {/* ===============================
                          INFO
                      =============================== */}

                      <div
                        className={
                          styles.productInfo
                        }
                      >

                        <div
                          className={
                            styles.productTop
                          }
                        >

                          <div>

                            <span
                              className={
                                styles.category
                              }
                            >
                              {
                                product.category
                              }
                            </span>


                            <strong>
                              {
                                product.name
                              }
                            </strong>


                            <small>
                              SKU:{" "}
                              {
                                product.code
                              }
                            </small>

                          </div>


                          <button
                            type="button"

                            className={
                              styles.removeButton
                            }

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


                        {/* ===============================
                            QUANTITY / PRICE
                        =============================== */}

                        <div
                          className={
                            styles.itemBottom
                          }
                        >

                          {/* =============================
                              QUANTITY BOX
                          ============================= */}

                          <div
                            className={
                              styles.quantityBox
                            }

                            style={{
                              gridTemplateColumns:
                                "31px 46px 31px",
                            }}
                          >

                            {/* MINUS */}

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


                            {/* INPUT */}

                            <QuantityInput
                              productId={
                                product.id
                              }

                              quantity={
                                quantity
                              }

                              stock={
                                product.stock
                              }

                              onIncrease={
                                onIncrease
                              }

                              onDecrease={
                                onDecrease
                              }

                              onQuantityChange={
                                onQuantityChange
                              }
                            />


                            {/* PLUS */}

                            <button
                              type="button"

                              onClick={() =>
                                onIncrease(
                                  product.id
                                )
                              }

                              disabled={
                                product.stock <=
                                  0 ||
                                quantity >=
                                  product.stock
                              }

                              aria-label="เพิ่มจำนวน"
                            >
                              +
                            </button>

                          </div>


                          {/* =============================
                              PRICE
                          ============================= */}

                          <div
                            className={
                              styles.priceBlock
                            }
                          >

                            {quantity >
                              1 && (

                              <small>
                                {
                                  quantity
                                }{" "}
                                × ฿
                                {
                                  product.price.toLocaleString()
                                }
                              </small>

                            )}


                            <strong>
                              ฿
                              {
                                lineTotal.toLocaleString()
                              }
                              .00
                            </strong>

                          </div>

                        </div>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </div>


        {/* ===============================================
            FOOTER
        =============================================== */}

        {items.length >
          0 && (

          <footer
            className={
              styles.footer
            }
          >

            <div
              className={
                styles.summaryRow
              }
            >

              <span>
                จำนวนสินค้า
              </span>

              <strong>
                {
                  totalQuantity
                }{" "}
                ชิ้น
              </strong>

            </div>


            <div
              className={
                styles.totalRow
              }
            >

              <span>
                รวม
              </span>

              <strong>
                ฿
                {
                  subtotal.toLocaleString()
                }
                .00
              </strong>

            </div>


            <p
              className={
                styles.priceNote
              }
            >
              * กรุณาตรวจสอบราคาสินค้าและค่าจัดส่งอีกครั้งก่อนชำระเงิน
            </p>


            <button
              type="button"

              className={
                styles.viewCartButton
              }

              onClick={
                onViewCart
              }
            >
              ดูตะกร้าสินค้า
            </button>


            <button
              type="button"

              className={
                styles.checkoutButton
              }

              onClick={
                onCheckout
              }
            >
              สั่งซื้อและชำระเงิน
            </button>

          </footer>

        )}

      </aside>

    </>
  );
}
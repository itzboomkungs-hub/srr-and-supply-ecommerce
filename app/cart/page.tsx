"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import styles from "./CartPage.module.css";
import SiteHeader from "../../components/layout/SiteHeader";
import type { CartItem } from "../../components/cart/types";

const CART_KEY = "srr-demo-cart";
const CART_OWNER_KEY = "srr-cart-owner";

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
};

type CartApiResponse = {
  ok: boolean;
  items?: CartItem[];
  message?: string;
};

type SyncState = "idle" | "saving" | "error";

/* =====================================================
   LOCAL CART HELPERS
===================================================== */

function readLocalCart() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);

    if (!raw) {
      return {
        exists: false,
        items: [] as CartItem[],
      };
    }

    const parsed = JSON.parse(raw);

    return {
      exists: true,
      items: Array.isArray(parsed)
        ? (parsed as CartItem[])
        : [],
    };
  } catch {
    return {
      exists: false,
      items: [] as CartItem[],
    };
  }
}

function writeLocalCart(
  items: CartItem[],
  owner: string
) {
  /*
    Guest cart ว่างไม่จำเป็นต้องค้าง key ไว้
    และช่วยให้หลัง Logout browser สะอาดจริง
  */
  if (
    owner === "guest" &&
    items.length === 0
  ) {
    window.localStorage.removeItem(
      CART_KEY
    );

    window.localStorage.removeItem(
      CART_OWNER_KEY
    );

    window.dispatchEvent(
      new Event("srr-cart-updated")
    );

    return;
  }

  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify(items)
  );

  window.localStorage.setItem(
    CART_OWNER_KEY,
    owner
  );

  window.dispatchEvent(
    new Event("srr-cart-updated")
  );
}

function clampQuantity(
  quantity: number,
  stock: number
) {
  const safeStock = Math.max(
    0,
    Math.floor(Number(stock) || 0)
  );

  if (safeStock <= 0) return 0;

  return Math.max(
    1,
    Math.min(
      Math.floor(Number(quantity) || 0),
      safeStock
    )
  );
}

/* =====================================================
   QUANTITY INPUT
===================================================== */

type QuantityInputProps = {
  quantity: number;
  stock: number;
  onCommit: (quantity: number) => void;
};

function QuantityInput({
  quantity,
  stock,
  onCommit,
}: QuantityInputProps) {
  const [draft, setDraft] = useState(
    String(quantity)
  );

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  function commit() {
    if (draft.trim() === "") {
      setDraft(String(quantity));
      return;
    }

    const parsed = Number.parseInt(draft, 10);

    if (Number.isNaN(parsed)) {
      setDraft(String(quantity));
      return;
    }

    const next = clampQuantity(parsed, stock);
    setDraft(String(next));

    if (next !== quantity) {
      onCommit(next);
    }
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setDraft(
      event.target.value.replace(/[^0-9]/g, "")
    );
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(String(quantity));
      event.currentTarget.blur();
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      disabled={stock <= 0}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      onFocus={(event) =>
        event.currentTarget.select()
      }
      aria-label="จำนวนสินค้า"
      title={`กรอกได้สูงสุด ${stock} ชิ้น`}
    />
  );
}

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
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [shipping, setShipping] = useState("later");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncMessage, setSyncMessage] = useState("");

  /* =====================================================
     INITIAL LOAD

     Guest:
       localStorage

     Member:
       MySQL Cart / CartItem

     ถ้าเพิ่ง Login และมี Guest cart:
       merge เข้า MySQL ครั้งแรก
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      const localCart = readLocalCart();
      const localOwner =
        window.localStorage.getItem(CART_OWNER_KEY);

      try {
        const authResponse = await fetch(
          "/api/auth/me",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!authResponse.ok) {
          const guestItems =
            localOwner && localOwner !== "guest"
              ? []
              : localCart.items;

          if (!cancelled) {
            setAuthUser(null);
            setItems(guestItems);
          }

          writeLocalCart(guestItems, "guest");
          return;
        }

        const authResult = await authResponse.json();
        const user = authResult.user as AuthUser;

        if (!cancelled) {
          setAuthUser(user);
        }

        let cartResponse: Response;

        if (
          localCart.exists &&
          localOwner === user.id
        ) {
          // local cart เป็น working copy ของสมาชิกคนเดิม
          cartResponse = await fetch(
            "/api/cart/sync",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mode: "replace",
                items: localCart.items,
              }),
            }
          );
        } else if (
          localCart.items.length > 0 &&
          (!localOwner || localOwner === "guest")
        ) {
          // Guest cart -> Member cart
          cartResponse = await fetch(
            "/api/cart/sync",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mode: "merge",
                items: localCart.items,
              }),
            }
          );
        } else {
          // เครื่องใหม่ / ไม่มี local cart / local cart ของ user อื่น
          cartResponse = await fetch("/api/cart", {
            credentials: "include",
            cache: "no-store",
          });
        }

        const cartResult =
          (await cartResponse.json()) as CartApiResponse;

        if (!cartResponse.ok || !cartResult.ok) {
          throw new Error(
            cartResult.message ||
              "ไม่สามารถโหลดตะกร้าจากบัญชีได้"
          );
        }

        const serverItems = cartResult.items || [];

        if (!cancelled) {
          setItems(serverItems);
        }

        writeLocalCart(serverItems, user.id);
      } catch (error) {
        console.error("Load cart error:", error);

        if (!cancelled) {
          setSyncState("error");
          setSyncMessage(
            "เชื่อมตะกร้ากับ MySQL ไม่สำเร็จ กำลังใช้ข้อมูลในเครื่องชั่วคราว"
          );
          setItems(localCart.items);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     LOGOUT / ACCOUNT SWITCH RESET

     เมื่อ SiteHeader Logout สำเร็จ:
     - ไม่ลบ Cart ใน MySQL
     - ล้าง Cart ที่กำลังแสดงใน browser
     - เปลี่ยนหน้าปัจจุบันกลับเป็น Guest Cart ว่าง
  ===================================================== */

  useEffect(() => {
    function handleCartSessionReset() {
      setAuthUser(null);
      setItems([]);
      setSyncState("idle");
      setSyncMessage("");

      window.localStorage.removeItem(
        CART_KEY
      );

      window.localStorage.removeItem(
        CART_OWNER_KEY
      );

      window.dispatchEvent(
        new Event("srr-cart-updated")
      );
    }

    window.addEventListener(
      "srr-cart-session-reset",
      handleCartSessionReset
    );

    return () => {
      window.removeEventListener(
        "srr-cart-session-reset",
        handleCartSessionReset
      );
    };
  }, []);

  /* =====================================================
     LOCAL MIRROR

     แม้ Member ใช้ MySQL เป็นหลัก
     เรายัง mirror ลง localStorage เพื่อให้ Header / หน้า Products
     ชุดเดิมเห็นจำนวนตะกร้าได้
  ===================================================== */

  useEffect(() => {
    if (!loaded) return;

    writeLocalCart(
      items,
      authUser?.id || "guest"
    );
  }, [items, loaded, authUser]);

  /* =====================================================
     TOTAL
  ===================================================== */

  const itemCount = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );
  }, [items]);

  /* =====================================================
     SERVER HELPERS
  ===================================================== */

  async function updateMemberQuantity(
    productId: number,
    quantity: number
  ) {
    if (!authUser) return;

    setSyncState("saving");
    setSyncMessage("");

    try {
      const response = await fetch(
        "/api/cart/items",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            quantity,
          }),
        }
      );

      const result =
        (await response.json()) as CartApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message || "บันทึกตะกร้าไม่สำเร็จ"
        );
      }

      setItems(result.items || []);
      setSyncState("idle");
    } catch (error) {
      console.error("Update cart item error:", error);
      setSyncState("error");
      setSyncMessage(
        "บันทึกจำนวนลง MySQL ไม่สำเร็จ กรุณาลองใหม่"
      );
    }
  }

  async function removeMemberItem(
    productId: number
  ) {
    if (!authUser) return;

    setSyncState("saving");
    setSyncMessage("");

    try {
      const response = await fetch(
        `/api/cart/items?productId=${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result =
        (await response.json()) as CartApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message || "ลบสินค้าไม่สำเร็จ"
        );
      }

      setItems(result.items || []);
      setSyncState("idle");
    } catch (error) {
      console.error("Remove cart item error:", error);
      setSyncState("error");
      setSyncMessage(
        "ลบสินค้าจาก MySQL ไม่สำเร็จ กรุณาลองใหม่"
      );
    }
  }

  /* =====================================================
     QUANTITY
  ===================================================== */

  function setQuantity(
    productId: number,
    requestedQuantity: number
  ) {
    const item = items.find(
      (current) => current.product.id === productId
    );

    if (!item) return;

    const nextQuantity = clampQuantity(
      requestedQuantity,
      item.product.stock
    );

    if (nextQuantity <= 0) {
      remove(productId);
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.product.id === productId
          ? {
              ...currentItem,
              quantity: nextQuantity,
            }
          : currentItem
      )
    );

    void updateMemberQuantity(
      productId,
      nextQuantity
    );
  }

  function increase(productId: number) {
    const item = items.find(
      (current) => current.product.id === productId
    );

    if (!item) return;

    setQuantity(
      productId,
      item.quantity + 1
    );
  }

  function decrease(productId: number) {
    const item = items.find(
      (current) => current.product.id === productId
    );

    if (!item) return;

    if (item.quantity <= 1) {
      remove(productId);
      return;
    }

    setQuantity(
      productId,
      item.quantity - 1
    );
  }

  /* =====================================================
     REMOVE
  ===================================================== */

  function remove(productId: number) {
    setItems((current) =>
      current.filter(
        (item) => item.product.id !== productId
      )
    );

    void removeMemberItem(productId);
  }

  /* =====================================================
     CLEAR
  ===================================================== */

  async function clearCart() {
    setItems([]);

    if (!authUser) return;

    setSyncState("saving");
    setSyncMessage("");

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        credentials: "include",
      });

      const result =
        (await response.json()) as CartApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message || "ล้างตะกร้าไม่สำเร็จ"
        );
      }

      setItems([]);
      setSyncState("idle");
    } catch (error) {
      console.error("Clear cart error:", error);
      setSyncState("error");
      setSyncMessage(
        "ล้างตะกร้าใน MySQL ไม่สำเร็จ กรุณาลองใหม่"
      );
    }
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
      <SiteHeader cartCount={itemCount} />

      <main className={styles.page}>
        <div className={styles.container}>
          {/* =================================================
              HEADER
          ================================================= */}

          <div className={styles.pageHeader}>
            <div>
              <div className={styles.breadcrumb}>
                <Link href="/">หน้าแรก</Link>
                <span>/</span>
                <span>ตะกร้าสินค้า</span>
              </div>

              <h1>ตะกร้าสินค้า</h1>

              <p>
                ตรวจสอบสินค้าและจำนวนก่อนดำเนินการสั่งซื้อ
              </p>

              <div
                className={`${styles.cartMode} ${
                  authUser
                    ? styles.cartModeMember
                    : styles.cartModeGuest
                }`}
              >
                <span className={styles.cartModeDot} />

                {authUser ? (
                  <span>
                    บันทึกตะกร้ากับบัญชี <strong>{authUser.fullName}</strong>
                  </span>
                ) : (
                  <span>
                    สินค้าที่เพิ่มเข้าตะกร้า
                  </span>
                )}

                {syncState === "saving" && (
                  <small>กำลังบันทึก...</small>
                )}
              </div>

              {syncState === "error" && syncMessage && (
                <div className={styles.syncError}>
                  {syncMessage}
                </div>
              )}
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

              <h2>ตะกร้าสินค้าว่าง</h2>

              <p>ยังไม่มีสินค้าในตะกร้าของคุณ</p>

              <Link href="/products">
                เลือกซื้อสินค้า
              </Link>
            </div>
          ) : (
            <div className={styles.cartLayout}>
              {/* ===============================================
                  LEFT
              =============================================== */}

              <section className={styles.cartTable}>
                <div className={styles.tableHeader}>
                  <div />
                  <div />
                  <div>สินค้า</div>
                  <div>รหัสสินค้า</div>
                  <div>ราคา</div>
                  <div>จำนวน</div>
                  <div className={styles.right}>
                    ยอดรวม
                  </div>
                </div>

                {items.map((item) => {
                  const total =
                    item.product.price * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className={styles.cartRow}
                    >
                      <div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() =>
                            remove(item.product.id)
                          }
                          aria-label={`ลบ ${item.product.name}`}
                        >
                          ×
                        </button>
                      </div>

                      <div>
                        <div className={styles.productImage}>
                          <ProductArtwork />
                        </div>
                      </div>

                      <div className={styles.productName}>
                        <strong>{item.product.name}</strong>
                        <small>{item.product.category}</small>
                      </div>

                      <div className={styles.sku}>
                        {item.product.code}
                      </div>

                      <div className={styles.price}>
                        {item.product.price.toLocaleString()}
                        .00 บาท
                      </div>

                      <div>
                        <div className={styles.quantity}>
                          <button
                            type="button"
                            onClick={() =>
                              decrease(item.product.id)
                            }
                            aria-label="ลดจำนวน"
                          >
                            −
                          </button>

                          <QuantityInput
                            quantity={item.quantity}
                            stock={item.product.stock}
                            onCommit={(quantity) =>
                              setQuantity(
                                item.product.id,
                                quantity
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              increase(item.product.id)
                            }
                            disabled={
                              item.quantity >= item.product.stock
                            }
                            aria-label="เพิ่มจำนวน"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className={styles.lineTotal}>
                        {total.toLocaleString()}.00 บาท
                      </div>
                    </div>
                  );
                })}

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
                <h2>ยอดรวม</h2>

                <div className={styles.summaryRow}>
                  <span>จำนวนสินค้า</span>
                  <strong>{itemCount} ชิ้น</strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>ยอดรวม</span>
                  <strong>
                    {subtotal.toLocaleString()}.00 บาท
                  </strong>
                </div>

                <div className={styles.shipping}>
                  <div className={styles.shippingTitle}>
                    การจัดส่ง
                  </div>

                  <label>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shipping === "later"}
                      onChange={() => setShipping("later")}
                    />

                    <span>
                      <strong>
                        คำนวณค่าจัดส่งก่อนชำระเงิน
                      </strong>
                      <small>จะเชื่อมในขั้น Checkout</small>
                    </span>
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shipping === "pickup"}
                      onChange={() => setShipping("pickup")}
                    />

                    <span>
                      <strong>รับสินค้าด้วยตนเอง</strong>
                      <small>
                        รับสินค้าที่ร้าน SRR AND SUPPLY
                      </small>
                    </span>
                  </label>
                </div>

                <div className={styles.grandTotal}>
                  <span>รวม</span>
                  <strong>
                    {subtotal.toLocaleString()}.00 บาท
                  </strong>
                </div>

                <button
                  type="button"
                  className={styles.checkout}
                  onClick={() =>
                    alert(
                      "ตะกร้าพร้อมแล้ว ขั้นถัดไปเราจะเชื่อมหน้า Checkout และ Order กับ SQL"
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

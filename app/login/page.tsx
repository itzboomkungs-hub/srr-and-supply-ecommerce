"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import styles from "./LoginPage.module.css";

import SiteHeader from "../../components/layout/SiteHeader";
import CartDrawer from "../../components/cart/CartDrawer";

import type {
  CartItem,
} from "../../components/cart/types";

const CART_KEY =
  "srr-demo-cart";

const CART_OWNER_KEY =
  "srr-cart-owner";

/* =====================================================
   TYPES
===================================================== */

type LoginFormState = {
  identity: string;
  password: string;
  remember: boolean;
};

type RegisterFormState = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type AuthTab =
  | "login"
  | "register";


/* =====================================================
   CART AFTER AUTH

   เป้าหมาย:
   - Guest มีของในตะกร้า -> merge เข้า Cart ของสมาชิกทันที
   - ไม่มี Guest cart -> โหลด Cart เดิมของสมาชิกจาก MySQL
   - เขียนผลกลับ localStorage เพื่อ Header แสดงจำนวนถูกทันที
===================================================== */

type CartApiResponse = {
  ok: boolean;
  items?: CartItem[];
  message?: string;
};

function readLocalCartSnapshot() {
  try {
    const raw =
      window.localStorage.getItem(
        CART_KEY
      );

    if (!raw) {
      return [] as CartItem[];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as CartItem[])
      : [];
  } catch {
    return [] as CartItem[];
  }
}

function writeMemberCartSnapshot(
  items: CartItem[],
  userId: string
) {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify(items)
  );

  window.localStorage.setItem(
    CART_OWNER_KEY,
    userId
  );

  window.dispatchEvent(
    new Event(
      "srr-cart-updated"
    )
  );
}

async function syncCartAfterAuth(
  userId: string
) {
  const localItems =
    readLocalCartSnapshot();

  const localOwner =
    window.localStorage.getItem(
      CART_OWNER_KEY
    );

  let response: Response;

  if (
    localItems.length > 0 &&
    (!localOwner ||
      localOwner === "guest")
  ) {
    response = await fetch(
      "/api/cart/sync",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          mode: "merge",
          items: localItems,
        }),
      }
    );
  } else {
    response = await fetch(
      "/api/cart",
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );
  }

  const result =
    (await response.json()) as
      CartApiResponse;

  if (
    !response.ok ||
    !result.ok
  ) {
    throw new Error(
      result.message ||
        "ไม่สามารถซิงก์ตะกร้าหลังเข้าสู่ระบบได้"
    );
  }

  const nextItems =
    result.items || [];

  writeMemberCartSnapshot(
    nextItems,
    userId
  );

  return nextItems;
}

/* =====================================================
   PAGE
===================================================== */

export default function LoginPage() {
  /* =====================================================
     TAB
  ===================================================== */

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<AuthTab>(
      "login"
    );

  /* =====================================================
     OPEN TAB FROM URL

     /login?tab=login
     = เข้าสู่ระบบ

     /login?tab=register
     = สมัครสมาชิก
  ===================================================== */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const tab =
      params.get("tab");

    if (
      tab === "register"
    ) {
      setActiveTab(
        "register"
      );
    } else {
      setActiveTab(
        "login"
      );
    }
  }, []);

  /* =====================================================
     AUTH NAVIGATION
  ===================================================== */

  function goToLogin() {
    window.location.href =
      "/login?tab=login";
  }

  function goToRegister() {
    window.location.href =
      "/login?tab=register";
  }

  /* =====================================================
     FORM
  ===================================================== */

  const [
    loginForm,
    setLoginForm,
  ] =
    useState<LoginFormState>({
      identity: "",
      password: "",
      remember: true,
    });

  const [
    registerForm,
    setRegisterForm,
  ] =
    useState<RegisterFormState>({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword:
        "",
    });

  const [
    authSubmitting,
    setAuthSubmitting,
  ] = useState(false);

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
        const parsed =
          JSON.parse(
            saved
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          setCartItems(
            parsed
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
     CART ACTIONS
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
                  item.product
                    .stock
                ),
            };
          }
        )
    );
  }

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

  function handleViewCart() {
    window.location.href =
      "/cart";
  }

  function handleCheckout() {
    window.location.href =
      "/cart";
  }

  function handleContinueShopping() {
    setIsCartOpen(
      false
    );

    window.location.href =
      "/products";
  }

  /* =====================================================
     LOGIN SUBMIT - MYSQL
  ===================================================== */

  async function handleLoginSubmit(
    event: FormEvent<
      HTMLFormElement
    >
  ) {
    event.preventDefault();

    if (
      !loginForm.identity.trim()
    ) {
      alert(
        "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์"
      );
      return;
    }

    if (
      !loginForm.password.trim()
    ) {
      alert(
        "กรุณากรอกรหัสผ่าน"
      );
      return;
    }

    try {
      setAuthSubmitting(true);

      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              identity:
                loginForm.identity,
              password:
                loginForm.password,
              remember:
                loginForm.remember,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        alert(
          result.message ||
            "เข้าสู่ระบบไม่สำเร็จ"
        );
        return;
      }

      try {
        const syncedItems =
          await syncCartAfterAuth(
            result.user.id
          );

        setCartItems(
          syncedItems
        );
      } catch (cartError) {
        console.error(
          "Cart sync after login error:",
          cartError
        );
      }

      window.dispatchEvent(
        new Event(
          "srr-auth-updated"
        )
      );

      alert(
        `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${result.user.fullName}`
      );

      window.location.href =
        "/";
    } catch (error) {
      console.error(
        "Login request error:",
        error
      );

      alert(
        "เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบว่า Laragon / MySQL และ Next.js เปิดอยู่"
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  /* =====================================================
     REGISTER SUBMIT - MYSQL
  ===================================================== */

  async function handleRegisterSubmit(
    event: FormEvent<
      HTMLFormElement
    >
  ) {
    event.preventDefault();

    if (
      !registerForm.fullName.trim()
    ) {
      alert(
        "กรุณากรอกชื่อ-นามสกุล"
      );
      return;
    }

    if (
      !registerForm.email.trim()
    ) {
      alert(
        "กรุณากรอกอีเมล"
      );
      return;
    }

    if (
      !registerForm.phone.trim()
    ) {
      alert(
        "กรุณากรอกเบอร์โทรศัพท์"
      );
      return;
    }

    if (
      registerForm.password.length <
      8
    ) {
      alert(
        "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
      );
      return;
    }

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      alert(
        "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน"
      );
      return;
    }

    try {
      setAuthSubmitting(true);

      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              registerForm
            ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        alert(
          result.message ||
            "สมัครสมาชิกไม่สำเร็จ"
        );
        return;
      }

      try {
        const syncedItems =
          await syncCartAfterAuth(
            result.user.id
          );

        setCartItems(
          syncedItems
        );
      } catch (cartError) {
        console.error(
          "Cart sync after register error:",
          cartError
        );
      }

      window.dispatchEvent(
        new Event(
          "srr-auth-updated"
        )
      );

      alert(
        `สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${result.user.fullName}`
      );

      window.location.href =
        "/";
    } catch (error) {
      console.error(
        "Register request error:",
        error
      );

      alert(
        "เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบว่า Laragon / MySQL และ Next.js เปิดอยู่"
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div
      className={
        styles.loginPage
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
          MAIN
      ================================================= */}

      <main
        className={
          styles.authMain
        }
      >
        <div
          className={
            styles.container
          }
        >
          <section
            className={
              styles.authLayout
            }
          >

            {/* =========================================
                LEFT VISUAL
            ========================================= */}

            <div
              className={
                styles.authVisual
              }
            >

              {/* PRODUCT IMAGE */}

              <div
                className={
                  styles.visualProducts
                }
                aria-hidden="true"
              >
                <img
                  src="/logo/login-industrial-products.png"
                  alt=""
                />
              </div>

              {/* DARK OVERLAY */}

              <div
                className={
                  styles.visualOverlay
                }
              />

              {/* CONTENT */}

              <div
                className={
                  styles.visualContent
                }
              >
                <span
                  className={
                    styles.visualBadge
                  }
                >
                  SRR AND SUPPLY
                </span>

                <h1
                  className={
                    styles.visualTitle
                  }
                >
                  ยินดีต้อนรับสู่
                  <br />
                  SRR AND SUPPLY
                </h1>

                <p
                  className={
                    styles.visualDescription
                  }
                >
                  จำหน่าย ซีล โอริง
                  ประเก็น อะไหล่ ปั๊ม
                  วาล์ว ทุกชนิด
                  สำหรับงานอุตสาหกรรม
                  และโรงงาน
                </p>

                <div
                  className={
                    styles.visualFeatures
                  }
                >

                  <div
                    className={
                      styles.visualFeature
                    }
                  >
                    <div
                      className={
                        styles.featureIcon
                      }
                    >
                      ✓
                    </div>

                    <div>
                      <strong>
                        สินค้าคุณภาพ
                      </strong>

                      <span>
                        ได้มาตรฐาน
                      </span>
                    </div>
                  </div>

                  <div
                    className={
                      styles.visualFeature
                    }
                  >
                    <div
                      className={
                        styles.featureIcon
                      }
                    >
                      🚚
                    </div>

                    <div>
                      <strong>
                        พร้อมจัดส่ง
                      </strong>

                      <span>
                        รวดเร็วทั่วประเทศ
                      </span>
                    </div>
                  </div>

                  <div
                    className={
                      styles.visualFeature
                    }
                  >
                    <div
                      className={
                        styles.featureIcon
                      }
                    >
                      ⚙
                    </div>

                    <div>
                      <strong>
                        ครบทุกงาน
                      </strong>

                      <span>
                        อะไหล่อุตสาหกรรม
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* =========================================
                RIGHT AUTH CARD
            ========================================= */}

            <div
              className={
                styles.authPanel
              }
            >
              <div
                className={
                  styles.authCard
                }
              >

                {/* =====================================
                    TABS
                ===================================== */}

                <div
                  className={
                    styles.authTabs
                  }
                >

                  <button
                    type="button"
                    className={`${styles.authTab} ${
                      activeTab ===
                      "login"
                        ? styles.authTabActive
                        : ""
                    }`}
                    onClick={
                      goToLogin
                    }
                  >
                    เข้าสู่ระบบ
                  </button>

                  <button
                    type="button"
                    className={`${styles.authTab} ${
                      activeTab ===
                      "register"
                        ? styles.authTabActive
                        : ""
                    }`}
                    onClick={
                      goToRegister
                    }
                  >
                    สมัครสมาชิก
                  </button>

                </div>

                {/* =====================================
                    LOGIN FORM
                ===================================== */}

                {activeTab ===
                "login" ? (

                  <form
                    className={
                      styles.form
                    }
                    onSubmit={
                      handleLoginSubmit
                    }
                  >

                    <div
                      className={
                        styles.formHeader
                      }
                    >
                      <h2>
                        เข้าสู่ระบบ
                      </h2>

                      <p>
                        เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อและข้อมูลของคุณ
                      </p>
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        อีเมลหรือเบอร์โทรศัพท์
                      </label>

                      <input
                        type="text"
                        value={
                          loginForm.identity
                        }
                        onChange={(
                          event
                        ) =>
                          setLoginForm(
                            (
                              current
                            ) => ({
                              ...current,

                              identity:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="กรอกอีเมลหรือเบอร์โทรศัพท์"
                      />
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        รหัสผ่าน
                      </label>

                      <input
                        type="password"
                        value={
                          loginForm.password
                        }
                        onChange={(
                          event
                        ) =>
                          setLoginForm(
                            (
                              current
                            ) => ({
                              ...current,

                              password:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="กรอกรหัสผ่าน"
                      />
                    </div>

                    <div
                      className={
                        styles.formOptions
                      }
                    >

                      <label
                        className={
                          styles.checkbox
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            loginForm.remember
                          }
                          onChange={(
                            event
                          ) =>
                            setLoginForm(
                              (
                                current
                              ) => ({
                                ...current,

                                remember:
                                  event
                                    .target
                                    .checked,
                              })
                            )
                          }
                        />

                        <span>
                          จดจำฉัน
                        </span>
                      </label>

                      <button
                        type="button"
                        className={
                          styles.textLink
                        }
                      >
                        ลืมรหัสผ่าน?
                      </button>

                    </div>

                    <button
                      type="submit"
                      className={
                        styles.primaryButton
                      }
                      disabled={
                        authSubmitting
                      }
                    >
                      {authSubmitting
                        ? "กำลังเข้าสู่ระบบ..."
                        : "เข้าสู่ระบบ"}
                    </button>

                    <div
                      className={
                        styles.divider
                      }
                    >
                      <span>
                        หรือ
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={
                        goToRegister
                      }
                    >
                      สมัครสมาชิกใหม่
                    </button>

                  </form>

                ) : (

                  /* =====================================
                     REGISTER FORM
                  ===================================== */

                  <form
                    className={
                      styles.form
                    }
                    onSubmit={
                      handleRegisterSubmit
                    }
                  >

                    <div
                      className={
                        styles.formHeader
                      }
                    >
                      <h2>
                        สมัครสมาชิก
                      </h2>

                      <p>
                        สร้างบัญชีเพื่อใช้งานและสั่งซื้อสินค้า
                      </p>
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        ชื่อ-นามสกุล
                      </label>

                      <input
                        type="text"
                        value={
                          registerForm.fullName
                        }
                        onChange={(
                          event
                        ) =>
                          setRegisterForm(
                            (
                              current
                            ) => ({
                              ...current,

                              fullName:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="กรอกชื่อ-นามสกุล"
                      />
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        อีเมล
                      </label>

                      <input
                        type="email"
                        value={
                          registerForm.email
                        }
                        onChange={(
                          event
                        ) =>
                          setRegisterForm(
                            (
                              current
                            ) => ({
                              ...current,

                              email:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="example@email.com"
                      />
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        เบอร์โทรศัพท์
                      </label>

                      <input
                        type="tel"
                        value={
                          registerForm.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setRegisterForm(
                            (
                              current
                            ) => ({
                              ...current,

                              phone:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="081-234-5678"
                      />
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        รหัสผ่าน
                      </label>

                      <input
                        type="password"
                        value={
                          registerForm.password
                        }
                        onChange={(
                          event
                        ) =>
                          setRegisterForm(
                            (
                              current
                            ) => ({
                              ...current,

                              password:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="ตั้งรหัสผ่าน"
                      />
                    </div>

                    <div
                      className={
                        styles.formGroup
                      }
                    >
                      <label>
                        ยืนยันรหัสผ่าน
                      </label>

                      <input
                        type="password"
                        value={
                          registerForm.confirmPassword
                        }
                        onChange={(
                          event
                        ) =>
                          setRegisterForm(
                            (
                              current
                            ) => ({
                              ...current,

                              confirmPassword:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="ยืนยันรหัสผ่าน"
                      />
                    </div>

                    <button
                      type="submit"
                      className={
                        styles.primaryButton
                      }
                      disabled={
                        authSubmitting
                      }
                    >
                      {authSubmitting
                        ? "กำลังสมัครสมาชิก..."
                        : "สมัครสมาชิก"}
                    </button>

                    <div
                      className={
                        styles.registerFooter
                      }
                    >
                      <span>
                        มีบัญชีอยู่แล้ว?
                      </span>

                      <button
                        type="button"
                        className={
                          styles.textLink
                        }
                        onClick={
                          goToLogin
                        }
                      >
                        เข้าสู่ระบบ
                      </button>
                    </div>

                  </form>

                )}

              </div>
            </div>

          </section>
        </div>
      </main>

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

        onContinueShopping={
          handleContinueShopping
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
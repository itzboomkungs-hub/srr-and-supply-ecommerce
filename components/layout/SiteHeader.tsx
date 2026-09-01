"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./SiteHeader.module.css";

const CART_KEY =
  "srr-demo-cart";

type SiteHeaderProps = {
  cartCount?: number;
  onCartClick?: () => void;
};

/* =====================================================
   ICONS
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

function UserIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4.5 20C5.2 15.9 8 14 12 14C16 14 18.8 15.9 19.5 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3 20C3.7 16 6.4 14 9.5 14C11.7 14 13.5 14.8 14.8 16.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M19 13V19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M16 16H22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="25"
      height="25"
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
   COMPONENT
===================================================== */

export default function SiteHeader({
  cartCount,
  onCartClick,
}: SiteHeaderProps) {
  const router =
    useRouter();

  const [
    storedCount,
    setStoredCount,
  ] =
    useState(0);

  const [
    search,
    setSearch,
  ] =
    useState("");

  /* =====================================================
     CART COUNT FROM LOCAL STORAGE
  ===================================================== */

  useEffect(() => {
    function loadCartCount() {
      try {
        const saved =
          window.localStorage.getItem(
            CART_KEY
          );

        if (!saved) {
          setStoredCount(0);
          return;
        }

        const items =
          JSON.parse(saved);

        if (
          !Array.isArray(
            items
          )
        ) {
          setStoredCount(0);
          return;
        }

        const total =
          items.reduce(
            (
              sum: number,
              item: {
                quantity?: number;
              }
            ) =>
              sum +
              Number(
                item.quantity ||
                  0
              ),
            0
          );

        setStoredCount(
          total
        );
      } catch {
        setStoredCount(0);
      }
    }

    loadCartCount();

    window.addEventListener(
      "storage",
      loadCartCount
    );

    window.addEventListener(
      "srr-cart-updated",
      loadCartCount
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadCartCount
      );

      window.removeEventListener(
        "srr-cart-updated",
        loadCartCount
      );
    };
  }, []);

  const displayCartCount =
    cartCount !== undefined
      ? cartCount
      : storedCount;

  /* =====================================================
     SEARCH
  ===================================================== */

  function handleSearch(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    const keyword =
      search.trim();

    if (!keyword) {
      router.push(
        "/products"
      );

      return;
    }

    router.push(
      `/products?search=${encodeURIComponent(
        keyword
      )}`
    );
  }

  /* =====================================================
     CART
  ===================================================== */

  function handleCartClick() {
    if (
      onCartClick
    ) {
      onCartClick();

      return;
    }

    router.push(
      "/cart"
    );
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <>
      {/* =================================================
          TOP BAR
      ================================================= */}

      <div
        className={
          styles.topbar
        }
      >
        <div
          className={
            styles.container
          }
        >

          <div
            className={
              styles.companyMessage
            }
          >
            จำหน่าย ซีล โอริง ประเก็น อะไหล่ ปั๊ม วาล์ว ทุกชนิด
          </div>


          <div
            className={
              styles.contactList
            }
          >

            <span
              className={
                styles.contactItem
              }
            >
              ☎

              <span>
                02-XXX-XXXX
              </span>
            </span>


            <span
              className={
                styles.contactItem
              }
            >
              ●

              <span>
                @srrandsupply
              </span>
            </span>


            <span
              className={
                styles.contactItem
              }
            >
              ✉

              <span>
                info@srrandsupply.com
              </span>
            </span>


            <span>
              จันทร์ - เสาร์ 8.00 - 17.00 น.
            </span>

          </div>

        </div>
      </div>


      {/* =================================================
          MAIN HEADER
      ================================================= */}

      <header
        className={
          styles.header
        }
      >

        <div
          className={
            styles.container
          }
        >

          <div
            className={
              styles.headerInner
            }
          >

            {/* =========================================
                LOGO
            ========================================= */}

            <Link
              href="/"
              className={
                styles.logo
              }
            >

              <div
                className={
                  styles.logoMark
                }
              >
                <img
                  src="/logo.jpg"
                  alt="SRR AND SUPPLY"
                />
              </div>


              <div
                className={
                  styles.logoText
                }
              >

                <strong>
                  SRR AND SUPPLY
                </strong>

                <span>
                  HIGH QUALITY SEAL PRODUCTS
                </span>

              </div>

            </Link>


            {/* =========================================
                SEARCH
            ========================================= */}

            <form
              className={
                styles.headerSearch
              }
              onSubmit={
                handleSearch
              }
            >

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
                placeholder="ค้นหาสินค้า, ขนาด, รุ่น, วัสดุ, รหัสสินค้า..."
                aria-label="ค้นหาสินค้า"
              />


              <button
                type="submit"
                aria-label="ค้นหา"
              >
                <SearchIcon />
              </button>

            </form>


            {/* =========================================
                ACTIONS
            ========================================= */}

            <div
              className={
                styles.headerActions
              }
            >

              {/* =====================================
                  LOGIN

                  ใช้ <a> เพื่อให้โหลดหน้าใหม่
                  ทำให้ ?tab=login ถูกอ่านใหม่ทุกครั้ง
              ===================================== */}

              <a
                href="/login?tab=login"
                className={
                  styles.account
                }
              >

                <span
                  className={
                    styles.actionIcon
                  }
                >
                  <UserIcon />
                </span>


                <span>
                  <strong>
                    เข้าสู่ระบบ
                  </strong>

                  <small>
                    สมาชิก
                  </small>
                </span>

              </a>


              {/* =====================================
                  REGISTER

                  ใช้ <a> เพื่อให้โหลดหน้าใหม่
                  ทำให้ ?tab=register ถูกอ่านใหม่ทุกครั้ง
              ===================================== */}

              <a
                href="/login?tab=register"
                className={
                  styles.account
                }
              >

                <span
                  className={
                    styles.actionIcon
                  }
                >
                  <RegisterIcon />
                </span>


                <span>
                  <strong>
                    สมัครสมาชิก
                  </strong>

                  <small>
                    สร้างบัญชี
                  </small>
                </span>

              </a>


              {/* =====================================
                  CART
              ===================================== */}

              <button
                type="button"
                className={
                  styles.cart
                }
                onClick={
                  handleCartClick
                }
              >

                <span
                  className={
                    styles.cartIcon
                  }
                >
                  <CartIcon />
                </span>


                <span>
                  <strong>
                    (
                    {
                      displayCartCount
                    }
                    )
                  </strong>

                  <small>
                    ตะกร้าสินค้า
                  </small>
                </span>

              </button>

            </div>

          </div>

        </div>

      </header>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav
        className={
          styles.navigation
        }
      >

        <div
          className={
            styles.container
          }
        >

          <div
            className={
              styles.navigationInner
            }
          >

            <Link
              href="/products"
              className={
                styles.navCategory
              }
            >
              ☰

              <span>
                หมวดหมู่สินค้า
              </span>
            </Link>


            <Link href="/products">
              O-Ring
            </Link>

            <Link href="/products">
              Oil Seal
            </Link>

            <Link href="/products">
              Hydraulic Seal
            </Link>

            <Link href="/products">
              Pneumatic Seal
            </Link>

            <Link href="/products">
              Rotary Seal
            </Link>

            <Link href="/products">
              ประเก็น
            </Link>

            <Link href="/products">
              อะไหล่ปั๊ม
            </Link>

            <Link href="/products">
              วาล์ว
            </Link>


            <Link
              href="/products"
              className={
                styles.navAll
              }
            >
              ทั้งหมด⌄
            </Link>


            <Link
              href="/contact"
              className={
                styles.navContact
              }
            >
              ติดต่อเรา
            </Link>

          </div>

        </div>

      </nav>
    </>
  );
}
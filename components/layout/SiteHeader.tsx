"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import styles from "./SiteHeader.module.css";

const CART_KEY = "srr-demo-cart";

type SiteHeaderProps = {
  cartCount?: number;
  onCartClick?: () => void;
};

type MegaMenuItem = {
  name: string;
  description: string;
  href: string;
};

type MegaMenuCategory = {
  id: string;
  title: string;
  icon: string;
  description: string;
  href: string;
  items: MegaMenuItem[];
};

/* =====================================================
   MEGA MENU DATA
   ตอนเชื่อม FlowAccount ภายหลัง
   สามารถเปลี่ยนข้อมูลชุดนี้เป็น API ได้
===================================================== */

const megaMenuCategories: MegaMenuCategory[] = [
  {
    id: "o-ring",
    title: "ซีลและโอริง",
    icon: "◎",
    description:
      "โอริงและซีลสำหรับงานอุตสาหกรรม เครื่องจักร ปั๊ม และระบบต่าง ๆ",
    href: "/products?category=O-Ring",
    items: [
      {
        name: "O-Ring",
        description: "โอริงมาตรฐานสำหรับงานทั่วไป",
        href: "/products?category=O-Ring",
      },
      {
        name: "O-Ring NBR",
        description: "เหมาะกับน้ำมันและงานอุตสาหกรรม",
        href: "/products?category=O-Ring&material=NBR",
      },
      {
        name: "O-Ring EPDM",
        description: "เหมาะกับน้ำและสภาพอากาศ",
        href: "/products?category=O-Ring&material=EPDM",
      },
      {
        name: "O-Ring Viton",
        description: "ทนความร้อนและสารเคมี",
        href: "/products?category=O-Ring&material=Viton",
      },
      {
        name: "O-Ring Silicone",
        description: "ทนอุณหภูมิและมีความยืดหยุ่นสูง",
        href: "/products?category=O-Ring&material=Silicone",
      },
      {
        name: "O-Ring Kit",
        description: "ชุดโอริงรวมขนาดสำหรับงานซ่อม",
        href: "/products?category=O-Ring",
      },
    ],
  },

  {
    id: "oil-seal",
    title: "ซีลน้ำมันและซีลเพลา",
    icon: "◉",
    description:
      "ซีลสำหรับป้องกันน้ำมัน จาระบี ฝุ่น และสิ่งสกปรกรอบเพลาหมุน",
    href: "/products?category=Oil%20Seal",
    items: [
      {
        name: "Oil Seal",
        description: "ซีลน้ำมันสำหรับเพลาหมุน",
        href: "/products?category=Oil%20Seal",
      },
      {
        name: "Shaft Seal",
        description: "ซีลสำหรับงานเพลาและเครื่องจักร",
        href: "/products?category=Oil%20Seal",
      },
      {
        name: "Rotary Seal",
        description: "ซีลสำหรับงานหมุนต่อเนื่อง",
        href: "/products?category=Rotary%20Seal",
      },
      {
        name: "V-Ring",
        description: "ซีลป้องกันฝุ่นและสิ่งสกปรก",
        href: "/products?category=Rotary%20Seal",
      },
      {
        name: "Dust Seal",
        description: "ซีลกันฝุ่นสำหรับเครื่องจักร",
        href: "/products?category=Oil%20Seal",
      },
      {
        name: "Oil Retainer",
        description: "อุปกรณ์ช่วยซีลและกักน้ำมัน",
        href: "/products?category=Oil%20Seal",
      },
    ],
  },

  {
    id: "hydraulic",
    title: "ไฮดรอลิกซีล",
    icon: "◌",
    description:
      "ซีลสำหรับกระบอกไฮดรอลิก ระบบแรงดันสูง และเครื่องจักรอุตสาหกรรม",
    href: "/products?category=Hydraulic%20Seal",
    items: [
      {
        name: "Piston Seal",
        description: "ซีลลูกสูบระบบไฮดรอลิก",
        href: "/products?category=Hydraulic%20Seal",
      },
      {
        name: "Rod Seal",
        description: "ซีลก้านสูบป้องกันการรั่ว",
        href: "/products?category=Hydraulic%20Seal",
      },
      {
        name: "Wiper Seal",
        description: "ซีลกันฝุ่นบริเวณก้านสูบ",
        href: "/products?category=Hydraulic%20Seal",
      },
      {
        name: "Backup Ring",
        description: "แหวนรองซีลสำหรับแรงดันสูง",
        href: "/products?category=Hydraulic%20Seal",
      },
      {
        name: "Hydraulic O-Ring",
        description: "โอริงสำหรับระบบไฮดรอลิก",
        href: "/products?category=Hydraulic%20Seal",
      },
      {
        name: "Hydraulic Seal Kit",
        description: "ชุดซีลสำหรับซ่อมกระบอกไฮดรอลิก",
        href: "/products?category=Hydraulic%20Seal",
      },
    ],
  },

  {
    id: "pneumatic",
    title: "ซีลกระบอกลม",
    icon: "●",
    description:
      "ซีลสำหรับระบบนิวเมติก กระบอกลม และระบบลมอัดในโรงงาน",
    href: "/products?category=Pneumatic%20Seal",
    items: [
      {
        name: "Pneumatic Seal",
        description: "ซีลสำหรับระบบลมอัด",
        href: "/products?category=Pneumatic%20Seal",
      },
      {
        name: "Piston Seal",
        description: "ซีลลูกสูบกระบอกลม",
        href: "/products?category=Pneumatic%20Seal",
      },
      {
        name: "Rod Seal",
        description: "ซีลก้านสูบระบบนิวเมติก",
        href: "/products?category=Pneumatic%20Seal",
      },
      {
        name: "Dust Seal",
        description: "ซีลป้องกันฝุ่นและสิ่งสกปรก",
        href: "/products?category=Pneumatic%20Seal",
      },
      {
        name: "U-Cup Seal",
        description: "ซีลรูปตัว U สำหรับกระบอกลม",
        href: "/products?category=Pneumatic%20Seal",
      },
      {
        name: "Pneumatic Seal Kit",
        description: "ชุดซีลซ่อมกระบอกลม",
        href: "/products?category=Pneumatic%20Seal",
      },
    ],
  },

  {
    id: "gasket",
    title: "ประเก็นและแผ่นประเก็น",
    icon: "◇",
    description:
      "ประเก็น แผ่นประเก็น และวัสดุซีลสำหรับหน้าแปลน ท่อ และเครื่องจักร",
    href: "/products?category=Gasket",
    items: [
      {
        name: "Gasket",
        description: "ประเก็นสำหรับงานทั่วไป",
        href: "/products?category=Gasket",
      },
      {
        name: "Gasket Sheet",
        description: "แผ่นประเก็นสำหรับตัดตามแบบ",
        href: "/products?category=Gasket",
      },
      {
        name: "Flange Gasket",
        description: "ประเก็นสำหรับหน้าแปลน",
        href: "/products?category=Gasket",
      },
      {
        name: "Washer",
        description: "แหวนรองสำหรับงานอุตสาหกรรม",
        href: "/products?category=Gasket",
      },
      {
        name: "Packing",
        description: "เชือกอัดประเก็นสำหรับวาล์วและปั๊ม",
        href: "/products?category=Gasket",
      },
      {
        name: "PTFE Tape",
        description: "เทปพันเกลียวสำหรับระบบท่อ",
        href: "/products?category=Gasket",
      },
    ],
  },

  {
    id: "pump",
    title: "อะไหล่ปั๊ม",
    icon: "⚙",
    description:
      "อะไหล่และอุปกรณ์สำหรับปั๊มน้ำ ปั๊มลม ปั๊มไฮดรอลิก และปั๊มอุตสาหกรรม",
    href: "/products?category=Pump%20Parts",
    items: [
      {
        name: "Water Pump Parts",
        description: "อะไหล่สำหรับปั๊มน้ำ",
        href: "/products?category=Pump%20Parts",
      },
      {
        name: "Air Pump Parts",
        description: "อะไหล่สำหรับปั๊มลม",
        href: "/products?category=Pump%20Parts",
      },
      {
        name: "Hydraulic Pump Parts",
        description: "อะไหล่ปั๊มระบบไฮดรอลิก",
        href: "/products?category=Pump%20Parts",
      },
      {
        name: "Mechanical Seal",
        description: "แมคคานิคอลซีลสำหรับปั๊ม",
        href: "/products?category=Pump%20Parts",
      },
      {
        name: "Impeller",
        description: "ใบพัดปั๊มสำหรับงานอุตสาหกรรม",
        href: "/products?category=Pump%20Parts",
      },
      {
        name: "Pump Shaft & Bush",
        description: "เพลาและบูชสำหรับปั๊ม",
        href: "/products?category=Pump%20Parts",
      },
    ],
  },

  {
    id: "valve",
    title: "วาล์วและอุปกรณ์วาล์ว",
    icon: "▣",
    description:
      "วาล์วควบคุมการไหลสำหรับน้ำ ลม น้ำมัน และระบบอุตสาหกรรม",
    href: "/products?category=Valve",
    items: [
      {
        name: "Ball Valve",
        description: "บอลวาล์วสำหรับเปิดและปิดการไหล",
        href: "/products?category=Valve",
      },
      {
        name: "Gate Valve",
        description: "เกทวาล์วสำหรับระบบท่อ",
        href: "/products?category=Valve",
      },
      {
        name: "Globe Valve",
        description: "โกลบวาล์วสำหรับควบคุมอัตราการไหล",
        href: "/products?category=Valve",
      },
      {
        name: "Check Valve",
        description: "เช็ควาล์วป้องกันการไหลย้อนกลับ",
        href: "/products?category=Valve",
      },
      {
        name: "Solenoid Valve",
        description: "โซลินอยด์วาล์วควบคุมด้วยไฟฟ้า",
        href: "/products?category=Valve",
      },
      {
        name: "Valve Accessories",
        description: "อุปกรณ์และอะไหล่วาล์ว",
        href: "/products?category=Valve",
      },
    ],
  },

  {
    id: "repair-kit",
    title: "ชุดซ่อมและคิท",
    icon: "⌘",
    description:
      "ชุดอะไหล่และชุดซีลสำหรับงานบำรุงรักษาและซ่อมเครื่องจักร",
    href: "/products?category=Repair%20Kit",
    items: [
      {
        name: "Repair Kit",
        description: "ชุดอะไหล่สำหรับงานซ่อม",
        href: "/products?category=Repair%20Kit",
      },
      {
        name: "Seal Kit",
        description: "ชุดซีลสำหรับเครื่องจักร",
        href: "/products?category=Repair%20Kit",
      },
      {
        name: "O-Ring Kit",
        description: "ชุดโอริงรวมหลายขนาด",
        href: "/products?category=Repair%20Kit",
      },
      {
        name: "Hydraulic Repair Kit",
        description: "ชุดซ่อมระบบไฮดรอลิก",
        href: "/products?category=Repair%20Kit",
      },
      {
        name: "Pump Repair Kit",
        description: "ชุดซ่อมและอะไหล่ปั๊ม",
        href: "/products?category=Repair%20Kit",
      },
      {
        name: "Valve Repair Kit",
        description: "ชุดซ่อมวาล์วและอุปกรณ์",
        href: "/products?category=Repair%20Kit",
      },
    ],
  },

  {
    id: "industrial",
    title: "อุปกรณ์อุตสาหกรรม",
    icon: "⊙",
    description:
      "อุปกรณ์เสริม ข้อต่อ ฟิตติ้ง และอะไหล่สำหรับระบบอุตสาหกรรม",
    href: "/products?category=Industrial%20Parts",
    items: [
      {
        name: "Industrial Parts",
        description: "อะไหล่อุตสาหกรรมทั่วไป",
        href: "/products?category=Industrial%20Parts",
      },
      {
        name: "Fittings",
        description: "ข้อต่อและฟิตติ้งสำหรับระบบท่อ",
        href: "/products?category=Industrial%20Parts",
      },
      {
        name: "Industrial Hose",
        description: "สายยางสำหรับงานอุตสาหกรรม",
        href: "/products?category=Industrial%20Parts",
      },
      {
        name: "Clamp",
        description: "แคลมป์และอุปกรณ์รัดยึด",
        href: "/products?category=Industrial%20Parts",
      },
      {
        name: "Bearing & Bush",
        description: "ลูกปืน บูช และอะไหล่เครื่องจักร",
        href: "/products?category=Industrial%20Parts",
      },
      {
        name: "Other Accessories",
        description: "อุปกรณ์และอะไหล่อื่น ๆ",
        href: "/products?category=Industrial%20Parts",
      },
    ],
  },
];

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
  const router = useRouter();

  const navigationShellRef =
    useRef<HTMLDivElement | null>(null);

  const [
    storedCount,
    setStoredCount,
  ] = useState(0);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    isMegaMenuOpen,
    setIsMegaMenuOpen,
  ] = useState(false);

  const [
    activeMegaTab,
    setActiveMegaTab,
  ] = useState(
    megaMenuCategories[0].id
  );

  const activeMegaCategory =
    megaMenuCategories.find(
      (category) =>
        category.id ===
        activeMegaTab
    ) ??
    megaMenuCategories[0];

  /* =====================================================
     CART COUNT
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

        if (!Array.isArray(items)) {
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
                item.quantity || 0
              ),
            0
          );

        setStoredCount(total);
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
     CLOSE MEGA MENU
  ===================================================== */

  useEffect(() => {
    if (!isMegaMenuOpen) {
      return;
    }

    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        navigationShellRef.current &&
        !navigationShellRef.current.contains(
          target
        )
      ) {
        setIsMegaMenuOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setIsMegaMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isMegaMenuOpen]);

  /* =====================================================
     SEARCH
  ===================================================== */

  function handleSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setIsMegaMenuOpen(false);

    const keyword = search.trim();

    if (!keyword) {
      router.push("/products");
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
    setIsMegaMenuOpen(false);

    if (onCartClick) {
      onCartClick();
      return;
    }

    router.push("/cart");
  }

  /* =====================================================
     MEGA MENU
  ===================================================== */

  function toggleMegaMenu() {
    if (!isMegaMenuOpen) {
      setActiveMegaTab(
        megaMenuCategories[0].id
      );
    }

    setIsMegaMenuOpen(
      (current) => !current
    );
  }

  function closeMegaMenu() {
    setIsMegaMenuOpen(false);
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <>
      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className={styles.topbar}>
        <div className={styles.container}>

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
        className={styles.header}
      >
        <div className={styles.container}>
          <div
            className={
              styles.headerInner
            }
          >

            <Link
              href="/"
              className={styles.logo}
              onClick={closeMegaMenu}
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

            {/* SEARCH */}

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
                value={search}
                onChange={(event) =>
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

            {/* ACTIONS */}

            <div
              className={
                styles.headerActions
              }
            >
              <a
                href="/login?tab=login"
                className={
                  styles.account
                }
                onClick={closeMegaMenu}
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

              <a
                href="/login?tab=register"
                className={
                  styles.account
                }
                onClick={closeMegaMenu}
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

              <button
                type="button"
                className={styles.cart}
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
                    ({displayCartCount})
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

      <div
        ref={navigationShellRef}
        className={
          styles.navigationShell
        }
      >
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
                onClick={closeMegaMenu}
              >
                ☰
                <span>
                  หมวดหมู่สินค้า
                </span>
              </Link>

              <Link
                href="/products?category=O-Ring"
                onClick={closeMegaMenu}
              >
                O-Ring
              </Link>

              <Link
                href="/products?category=Oil%20Seal"
                onClick={closeMegaMenu}
              >
                Oil Seal
              </Link>

              <Link
                href="/products?category=Hydraulic%20Seal"
                onClick={closeMegaMenu}
              >
                Hydraulic Seal
              </Link>

              <Link
                href="/products?category=Pneumatic%20Seal"
                onClick={closeMegaMenu}
              >
                Pneumatic Seal
              </Link>

              <Link
                href="/products?category=Rotary%20Seal"
                onClick={closeMegaMenu}
              >
                Rotary Seal
              </Link>

              <Link
                href="/products?category=Gasket"
                onClick={closeMegaMenu}
              >
                ประเก็น
              </Link>

              <Link
                href="/products?category=Pump%20Parts"
                onClick={closeMegaMenu}
              >
                อะไหล่ปั๊ม
              </Link>

              <Link
                href="/products?category=Valve"
                onClick={closeMegaMenu}
              >
                วาล์ว
              </Link>

              {/* =================================================
    ALL PRODUCTS
================================================= */}

<button
  type="button"
  className={`${styles.navAll} ${
    isMegaMenuOpen
      ? styles.navAllOpen
      : ""
  }`}
  aria-expanded={
    isMegaMenuOpen
  }
  aria-controls="srr-mega-menu"
  aria-label={
    isMegaMenuOpen
      ? "ปิดเมนูสินค้าทั้งหมด"
      : "เปิดเมนูสินค้าทั้งหมด"
  }
  onClick={
    toggleMegaMenu
  }
>
  <span>
    ทั้งหมด
  </span>

  <span
    className={`${styles.navAllArrow} ${
      isMegaMenuOpen
        ? styles.navAllArrowOpen
        : ""
    }`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* พื้นหลังไอคอน */}

      <path
        opacity="0.4"
        d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2Z"
        fill="currentColor"
      />

      {/* ลูกศร */}

      <path
        d="M12 14.9103C11.81 14.9103 11.62 14.8403 11.47 14.6903L7.94 11.1603C7.65 10.8703 7.65 10.3903 7.94 10.1003C8.23 9.81031 8.71 9.81031 9 10.1003L12 13.1003L15 10.1003C15.29 9.81031 15.77 9.81031 16.06 10.1003C16.35 10.3903 16.35 10.8703 16.06 11.1603L12.53 14.6903C12.38 14.8403 12.19 14.9103 12 14.9103Z"
        fill="currentColor"
      />
    </svg>
  </span>
</button>

              <Link
                href="/contact"
                className={
                  styles.navContact
                }
                onClick={closeMegaMenu}
              >
                ติดต่อเรา
              </Link>

            </div>
          </div>
        </nav>

        {/* =================================================
            MEGA MENU
        ================================================= */}

        {isMegaMenuOpen && (
          <div
            className={
              styles.megaMenu
            }
          >
            <div
              className={`${styles.container} ${styles.megaMenuCard}`}
            >

              {/* =======================================
                  LEFT TABS
              ======================================= */}

              <aside
                className={
                  styles.megaSidebar
                }
              >
                <div
                  className={
                    styles.megaSidebarTitle
                  }
                >
                  <span>
                    ☰
                  </span>

                  <div>
                    <strong>
                      หมวดหมู่สินค้า
                    </strong>

                    <small>
                      เลือกประเภทที่ต้องการ
                    </small>
                  </div>
                </div>

                <div
                  className={
                    styles.megaTabs
                  }
                  role="tablist"
                  aria-label="หมวดหมู่สินค้า"
                >
                  {megaMenuCategories.map(
                    (category) => {
                      const isActive =
                        category.id ===
                        activeMegaTab;

                      return (
                        <button
                          key={category.id}
                          id={`mega-tab-${category.id}`}
                          type="button"
                          role="tab"
                          aria-selected={
                            isActive
                          }
                          aria-controls={`mega-panel-${category.id}`}
                          className={`${styles.megaTab} ${
                            isActive
                              ? styles.megaTabActive
                              : ""
                          }`}
                          onClick={() =>
                            setActiveMegaTab(
                              category.id
                            )
                          }
                        >
                          <span
                            className={
                              styles.megaTabIcon
                            }
                          >
                            {
                              category.icon
                            }
                          </span>

                          <span
                            className={
                              styles.megaTabLabel
                            }
                          >
                            {
                              category.title
                            }
                          </span>

                          <span
                            className={
                              styles.megaTabArrow
                            }
                          >
                            ›
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <Link
                  href="/products"
                  className={
                    styles.megaSidebarAll
                  }
                  onClick={closeMegaMenu}
                >
                  <span>
                    ▦
                  </span>

                  <strong>
                    สินค้าอื่น ๆ ทั้งหมด
                  </strong>

                  <span>
                    →
                  </span>
                </Link>
              </aside>

              {/* =======================================
                  RIGHT ACTIVE TAB PANEL
              ======================================= */}

              <div
                id={`mega-panel-${activeMegaCategory.id}`}
                role="tabpanel"
                aria-labelledby={`mega-tab-${activeMegaCategory.id}`}
                className={
                  styles.megaPanel
                }
              >

                {/* PANEL HEADER */}

                <div
                  className={
                    styles.megaPanelHeader
                  }
                >
                  <div
                    className={
                      styles.megaPanelHeading
                    }
                  >
                    <span
                      className={
                        styles.megaPanelIcon
                      }
                    >
                      {
                        activeMegaCategory.icon
                      }
                    </span>

                    <div>
                      <h3>
                        {
                          activeMegaCategory.title
                        }
                      </h3>

                      <p>
                        {
                          activeMegaCategory.description
                        }
                      </p>
                    </div>
                  </div>

                  <Link
                    href={
                      activeMegaCategory.href
                    }
                    className={
                      styles.megaPanelAllButton
                    }
                    onClick={closeMegaMenu}
                  >
                    ดูทั้งหมด

                    <span>
                      →
                    </span>
                  </Link>
                </div>

                {/* SUB CATEGORY GRID */}

                <div
                  className={
                    styles.megaItemGrid
                  }
                >
                  {activeMegaCategory.items.map(
                    (item, index) => (
                      <Link
                        key={`${activeMegaCategory.id}-${item.name}`}
                        href={item.href}
                        className={
                          styles.megaItemCard
                        }
                        onClick={
                          closeMegaMenu
                        }
                      >
                        <div
                          className={
                            styles.megaItemNumber
                          }
                        >
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div
                          className={
                            styles.megaItemText
                          }
                        >
                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {
                              item.description
                            }
                          </span>
                        </div>

                        <span
                          className={
                            styles.megaItemArrow
                          }
                        >
                          →
                        </span>
                      </Link>
                    )
                  )}
                </div>

                {/* BOTTOM AREA */}

                <div
                  className={
                    styles.megaPanelBottom
                  }
                >
                  <div
                    className={
                      styles.megaPanelBenefits
                    }
                  >
                    <div>
                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          สินค้าคุณภาพ
                        </strong>

                        <small>
                          สำหรับงานอุตสาหกรรม
                        </small>
                      </div>
                    </div>

                    <div>
                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          พร้อมจัดส่ง
                        </strong>

                        <small>
                          ตรวจสอบสต็อกสินค้าได้
                        </small>
                      </div>
                    </div>

                    <div>
                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          ให้คำปรึกษา
                        </strong>

                        <small>
                          ช่วยเลือกสินค้าให้เหมาะกับงาน
                        </small>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/products"
                    className={
                      styles.megaBottomButton
                    }
                    onClick={
                      closeMegaMenu
                    }
                  >
                    ดูสินค้าทั้งหมด

                    <span>
                      →
                    </span>
                  </Link>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}
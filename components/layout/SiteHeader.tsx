"use client";


import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";


import styles from "./SiteHeader.module.css";
import AccountMenu from "./AccountMenu";


const CART_KEY = "srr-demo-cart";
const CART_OWNER_KEY = "srr-cart-owner";


const CATEGORY_ICONS = ["◎", "◉", "◌", "●", "◇", "⚙", "▣", "⌘", "⊙"];


type SiteHeaderProps = {
  cartCount?: number;
  onCartClick?: () => void;
};


type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  customerId?: string | null;
};


type SqlCategory = {
  id: number;
  name: string;
  code: string;
  description?: string;
  productCount?: number;
};


function categoryHref(name: string) {
  return `/products?category=${encodeURIComponent(name)}`;
}


function SearchIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 20C3.7 16 6.4 14 9.5 14C11.7 14 13.5 14.8 14.8 16.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M19 13V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 16H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


function LogoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 5H6.5C5.12 5 4 6.12 4 7.5V16.5C4 17.88 5.12 19 6.5 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8L18 12L14 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}


function CartIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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


export default function SiteHeader({ cartCount, onCartClick }: SiteHeaderProps) {
  const router = useRouter();
  const navigationShellRef = useRef<HTMLDivElement | null>(null);


  const [storedCount, setStoredCount] = useState(0);
  const [cartClearedAfterLogout, setCartClearedAfterLogout] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);


  const [menuCategories, setMenuCategories] = useState<SqlCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [activeMegaCategoryId, setActiveMegaCategoryId] = useState<number | null>(null);


  const activeMegaCategory = useMemo(() => {
    if (menuCategories.length === 0) return null;


    return (
      menuCategories.find((category) => category.id === activeMegaCategoryId) ??
      menuCategories[0]
    );
  }, [menuCategories, activeMegaCategoryId]);


  const topNavigationCategories = useMemo(
    () => menuCategories.slice(0, 7),
    [menuCategories]
  );


  const megaGridCategories = useMemo(() => {
    if (!activeMegaCategory) return menuCategories.slice(0, 9);


    return [
      activeMegaCategory,
      ...menuCategories.filter((category) => category.id !== activeMegaCategory.id),
    ].slice(0, 9);
  }, [menuCategories, activeMegaCategory]);


  useEffect(() => {
    function loadCartCount() {
      try {
        const saved = window.localStorage.getItem(CART_KEY);


        if (!saved) {
          setStoredCount(0);
          return;
        }


        const items = JSON.parse(saved);


        if (!Array.isArray(items)) {
          setStoredCount(0);
          return;
        }


        const total = items.reduce(
          (sum: number, item: { quantity?: number }) => sum + Number(item.quantity || 0),
          0
        );


        setStoredCount(total);


        if (total > 0) {
          setCartClearedAfterLogout(false);
        }
      } catch {
        setStoredCount(0);
      }
    }


    loadCartCount();
    window.addEventListener("storage", loadCartCount);
    window.addEventListener("srr-cart-updated", loadCartCount);


    return () => {
      window.removeEventListener("storage", loadCartCount);
      window.removeEventListener("srr-cart-updated", loadCartCount);
    };
  }, []);


  const displayCartCount = cartClearedAfterLogout
    ? 0
    : cartCount !== undefined
      ? cartCount
      : storedCount;


  useEffect(() => {
    let cancelled = false;


    async function loadAuthUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });


        if (!response.ok) {
          if (!cancelled) setAuthUser(null);
          return;
        }


        const result = await response.json();


        if (!cancelled) {
          setAuthUser(result.ok && result.user ? result.user : null);
        }
      } catch (error) {
        console.error("Load auth user error:", error);
        if (!cancelled) setAuthUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }


    function handleAuthUpdated() {
      setAuthLoading(true);
      void loadAuthUser();
    }


    void loadAuthUser();
    window.addEventListener("srr-auth-updated", handleAuthUpdated);
    window.addEventListener("focus", handleAuthUpdated);


    return () => {
      cancelled = true;
      window.removeEventListener("srr-auth-updated", handleAuthUpdated);
      window.removeEventListener("focus", handleAuthUpdated);
    };
  }, []);


  const authRoleLabel =
    authUser?.role === "ADMIN"
      ? "ผู้ดูแลระบบ"
      : authUser?.role === "STAFF"
        ? "พนักงาน"
        : "สมาชิก";


  useEffect(() => {
    let cancelled = false;


    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError("");


      try {
        const response = await fetch("/api/product-categories", {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json();


        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {
          throw new Error(data?.message || "โหลดหมวดหมู่สินค้าไม่สำเร็จ");
        }


        const categories = (data.categories as SqlCategory[]).filter(
          (category) => category && Number(category.id) > 0 && String(category.name || "").trim()
        );


        if (!cancelled) {
          setMenuCategories(categories);
          setActiveMegaCategoryId((current) => {
            if (current && categories.some((category) => category.id === current)) {
              return current;
            }
            return categories[0]?.id ?? null;
          });
        }
      } catch (error) {
        console.error("Load header categories error:", error);


        if (!cancelled) {
          setMenuCategories([]);
          setActiveMegaCategoryId(null);
          setCategoriesError(
            error instanceof Error ? error.message : "โหลดหมวดหมู่สินค้าไม่สำเร็จ"
          );
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }


    function handleCategoryUpdated() {
      void loadCategories();
    }


    void loadCategories();
    window.addEventListener("srr-product-categories-updated", handleCategoryUpdated);


    return () => {
      cancelled = true;
      window.removeEventListener("srr-product-categories-updated", handleCategoryUpdated);
    };
  }, []);


  useEffect(() => {
    if (!isMegaMenuOpen) return;


    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;


      if (
        navigationShellRef.current &&
        !navigationShellRef.current.contains(target)
      ) {
        setIsMegaMenuOpen(false);
      }
    }


    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMegaMenuOpen(false);
    }


    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);


    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMegaMenuOpen]);


  async function handleLogout() {
    if (isLoggingOut) return;


    setIsMegaMenuOpen(false);
    setIsLoggingOut(true);


    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();


      if (!response.ok || !result.ok) {
        alert(result.message || "ไม่สามารถออกจากระบบได้");
        return;
      }


      setAuthUser(null);
      window.localStorage.removeItem(CART_KEY);
      window.localStorage.removeItem(CART_OWNER_KEY);
      setStoredCount(0);
      setCartClearedAfterLogout(true);
      window.dispatchEvent(new Event("srr-cart-updated"));
      window.dispatchEvent(new Event("srr-cart-session-reset"));
      window.dispatchEvent(new Event("srr-auth-updated"));
      window.location.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่");
    } finally {
      setIsLoggingOut(false);
    }
  }


  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setIsMegaMenuOpen(false);


    const keyword = search.trim();


    if (!keyword) {
      router.push("/products");
      return;
    }


    router.push(`/products?search=${encodeURIComponent(keyword)}`);
  }


  function handleCartClick() {
    setIsMegaMenuOpen(false);


    if (onCartClick) {
      onCartClick();
      return;
    }


    router.push("/cart");
  }


  function toggleMegaMenu() {
    if (!isMegaMenuOpen && !activeMegaCategoryId && menuCategories[0]) {
      setActiveMegaCategoryId(menuCategories[0].id);
    }


    setIsMegaMenuOpen((current) => !current);
  }


  function closeMegaMenu() {
    setIsMegaMenuOpen(false);
  }


  return (
    <>
      <div className={styles.topbar}>
        <div className={styles.container}>
          <div className={styles.companyMessage}>
            จำหน่าย ซีล โอริง ประเก็น อะไหล่ ปั๊ม วาล์ว ทุกชนิด
          </div>


          <div className={styles.contactList}>
            <span className={styles.contactItem}>☎ <span>02-XXX-XXXX</span></span>
            <span className={styles.contactItem}>● <span>@srrandsupply</span></span>
            <span className={styles.contactItem}>✉ <span>info@srrandsupply.com</span></span>
            <span>จันทร์ - เสาร์ 8.00 - 17.00 น.</span>
          </div>
        </div>
      </div>


      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.logo} onClick={closeMegaMenu}>
              <div className={styles.logoMark}>
                <img src="/logo.jpg" alt="SRR AND SUPPLY" />
              </div>
              <div className={styles.logoText}>
                <strong>SRR AND SUPPLY</strong>
                <span>HIGH QUALITY SEAL PRODUCTS</span>
              </div>
            </Link>


            <form className={styles.headerSearch} onSubmit={handleSearch}>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาสินค้า, ขนาด, รุ่น, วัสดุ, รหัสสินค้า..."
                aria-label="ค้นหาสินค้า"
              />
              <button type="submit" aria-label="ค้นหา">
                <SearchIcon />
              </button>
            </form>


            <div className={styles.headerActions}>
              {authLoading ? (
                <div
                  className={`${styles.account} ${styles.accountStatus} ${styles.authChecking}`}
                  aria-live="polite"
                >
                  <span className={styles.actionIcon}><UserIcon /></span>
                  <span><strong>กำลังตรวจสอบ...</strong><small>สถานะสมาชิก</small></span>
                </div>
              ) : authUser ? (
                <>
                  <AccountMenu user={authUser} roleLabel={authRoleLabel} />
                  <button
                    type="button"
                    className={`${styles.account} ${styles.logoutButton}`}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    aria-label="ออกจากระบบ"
                  >
                    <span className={styles.actionIcon}><LogoutIcon /></span>
                    <span>
                      <strong>{isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}</strong>
                      <small>บัญชีของฉัน</small>
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <a href="/login?tab=login" className={styles.account} onClick={closeMegaMenu}>
                    <span className={styles.actionIcon}><UserIcon /></span>
                    <span><strong>เข้าสู่ระบบ</strong><small>สมาชิก</small></span>
                  </a>
                  <a href="/login?tab=register" className={styles.account} onClick={closeMegaMenu}>
                    <span className={styles.actionIcon}><RegisterIcon /></span>
                    <span><strong>สมัครสมาชิก</strong><small>สร้างบัญชี</small></span>
                  </a>
                </>
              )}


              <button type="button" className={styles.cart} onClick={handleCartClick}>
                <span className={styles.cartIcon}><CartIcon /></span>
                <span><strong>({displayCartCount})</strong><small>ตะกร้าสินค้า</small></span>
              </button>
            </div>
          </div>
        </div>
      </header>


      <div ref={navigationShellRef} className={styles.navigationShell}>
        <nav className={styles.navigation}>
          <div className={styles.container}>
            <div className={styles.navigationInner}>
              <Link href="/products" className={styles.navCategory} onClick={closeMegaMenu}>
                ☰ <span>หมวดหมู่สินค้า</span>
              </Link>


              {topNavigationCategories.map((category) => (
                <Link
                  key={category.id}
                  href={categoryHref(category.name)}
                  onClick={closeMegaMenu}
                >
                  {category.name}
                </Link>
              ))}


              <button
                type="button"
                className={`${styles.navAll} ${isMegaMenuOpen ? styles.navAllOpen : ""}`}
                aria-expanded={isMegaMenuOpen}
                aria-controls="srr-mega-menu"
                aria-label={isMegaMenuOpen ? "ปิดเมนูสินค้าทั้งหมด" : "เปิดเมนูสินค้าทั้งหมด"}
                onClick={toggleMegaMenu}
              >
                <span>ทั้งหมด</span>
                <span
                  className={`${styles.navAllArrow} ${isMegaMenuOpen ? styles.navAllArrowOpen : ""}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      opacity="0.4"
                      d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 14.9103C11.81 14.9103 11.62 14.8403 11.47 14.6903L7.94 11.1603C7.65 10.8703 7.65 10.3903 7.94 10.1003C8.23 9.81031 8.71 9.81031 9 10.1003L12 13.1003L15 10.1003C15.29 9.81031 15.77 9.81031 16.06 10.1003C16.35 10.3903 16.35 10.8703 16.06 11.1603L12.53 14.6903C12.38 14.8403 12.19 14.9103 12 14.9103Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </button>


              <Link href="/contact" className={styles.navContact} onClick={closeMegaMenu}>
                ติดต่อเรา
              </Link>
            </div>
          </div>
        </nav>


        {isMegaMenuOpen && (
          <div id="srr-mega-menu" className={styles.megaMenu}>
            <div className={`${styles.container} ${styles.megaMenuCard}`}>
              <aside className={styles.megaSidebar}>
                <div className={styles.megaSidebarTitle}>
                  <span>☰</span>
                  <div>
                    <strong>หมวดหมู่สินค้า</strong>
                    <small></small>
                  </div>
                </div>


                <div className={styles.megaTabs} role="tablist" aria-label="หมวดหมู่สินค้า">
                  {menuCategories.map((category, index) => {
                    const isActive = activeMegaCategory?.id === category.id;


                    return (
                      <button
                        key={category.id}
                        id={`mega-tab-${category.id}`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`mega-panel-${category.id}`}
                        className={`${styles.megaTab} ${isActive ? styles.megaTabActive : ""}`}
                        onClick={() => setActiveMegaCategoryId(category.id)}
                      >
                        <span className={styles.megaTabIcon}>
                          {CATEGORY_ICONS[index % CATEGORY_ICONS.length]}
                        </span>
                        <span className={styles.megaTabLabel}>{category.name}</span>
                        <span className={styles.megaTabArrow}>›</span>
                      </button>
                    );
                  })}
                </div>


                <Link href="/products" className={styles.megaSidebarAll} onClick={closeMegaMenu}>
                  <span>▦</span>
                  <strong>สินค้าอื่น ๆ ทั้งหมด</strong>
                  <span>→</span>
                </Link>
              </aside>


              <div
                id={`mega-panel-${activeMegaCategory?.id ?? "empty"}`}
                role="tabpanel"
                aria-labelledby={activeMegaCategory ? `mega-tab-${activeMegaCategory.id}` : undefined}
                className={styles.megaPanel}
              >
                {categoriesLoading ? (
                  <div style={{ padding: "40px 10px", color: "#788b9f" }}>
                    กำลังโหลดหมวดหมู่จาก MySQL...
                  </div>
                ) : categoriesError ? (
                  <div style={{ padding: "40px 10px", color: "#b42318" }}>
                    {categoriesError}
                  </div>
                ) : !activeMegaCategory ? (
                  <div style={{ padding: "40px 10px", color: "#788b9f" }}>
                    ยังไม่มีหมวดหมู่สินค้าที่เปิดใช้งาน
                  </div>
                ) : (
                  <>
                    <div className={styles.megaPanelHeader}>
                      <div className={styles.megaPanelHeading}>
                        <span className={styles.megaPanelIcon}>
                          {CATEGORY_ICONS[
                            Math.max(
                              0,
                              menuCategories.findIndex(
                                (category) => category.id === activeMegaCategory.id
                              )
                            ) % CATEGORY_ICONS.length
                          ]}
                        </span>


                        <div>
                          <h3>{activeMegaCategory.name}</h3>
                          <p>
                            {activeMegaCategory.description?.trim() ||
                              `ดูสินค้าทั้งหมดในหมวด ${activeMegaCategory.name}`}
                          </p>
                        </div>
                      </div>


                      <Link
                        href={categoryHref(activeMegaCategory.name)}
                        className={styles.megaPanelAllButton}
                        onClick={closeMegaMenu}
                      >
                        ดูทั้งหมด <span>→</span>
                      </Link>
                    </div>


                    <div className={styles.megaItemGrid}>
                      {megaGridCategories.map((category, index) => (
                        <Link
                          key={category.id}
                          href={categoryHref(category.name)}
                          className={styles.megaItemCard}
                          onClick={closeMegaMenu}
                        >
                          <div className={styles.megaItemNumber}>
                            {String(index + 1).padStart(2, "0")}
                          </div>


                          <div className={styles.megaItemText}>
                            <strong>{category.name}</strong>
                            <span>
                              {category.description?.trim() ||
                                (typeof category.productCount === "number"
                                  ? `${category.productCount.toLocaleString("th-TH")} รายการสินค้า`
                                  : `ดูสินค้าในหมวด ${category.name}`)}
                            </span>
                          </div>


                          <span className={styles.megaItemArrow}>→</span>
                        </Link>
                      ))}
                    </div>


                    <div className={styles.megaPanelBottom}>
                      <div className={styles.megaPanelBenefits}>
                        <div>
                          <span>✓</span>
                          <div><strong>สินค้าคุณภาพ</strong><small>สำหรับงานอุตสาหกรรม</small></div>
                        </div>
                        <div>
                          <span>✓</span>
                          <div><strong>พร้อมจัดส่ง</strong><small>ตรวจสอบสต็อกสินค้าได้</small></div>
                        </div>
                        <div>
                          <span>✓</span>
                          <div><strong>ให้คำปรึกษา</strong><small>ช่วยเลือกสินค้าให้เหมาะกับงาน</small></div>
                        </div>
                      </div>


                      <Link href="/products" className={styles.megaBottomButton} onClick={closeMegaMenu}>
                        ดูสินค้าทั้งหมด <span>→</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
"use client";

import Link from "next/link";
import "./HomePage.css";

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

const sideCategories = [
  "O-Ring",
  "Oil Seal",
  "Hydraulic Seal",
  "Pneumatic Seal",
  "Rotary Seal",
  "ประเก็น (Gasket)",
  "อะไหล่ปั๊มทุกชนิด",
  "วาล์ว (Valve)",
  "อะไหล่อุตสาหกรรม",
  "ชุดซ่อม (Repair Kit)",
  "น้ำมันและจาระบี",
  "อุปกรณ์อื่นๆ",
];

const products = [
  {
    name: "O-Ring NBR M70",
    sku: "OR-NBR-M70",
    category: "O-Ring",
    price: "฿35",
    stock: "820",
    icon: "○",
  },
  {
    name: "Oil Seal TC 35x52x7",
    sku: "OS-TC-35527",
    category: "Oil Seal",
    price: "฿120",
    stock: "350",
    icon: "◉",
  },
  {
    name: "O-Ring Viton 2.4x1.9",
    sku: "OR-VITON-2419",
    category: "O-Ring",
    price: "฿15",
    stock: "1,250",
    icon: "◎",
  },
  {
    name: "Rod Seal UN 20x30x5",
    sku: "RS-UN-20305",
    category: "Hydraulic Seal",
    price: "฿85",
    stock: "420",
    icon: "◍",
  },
  {
    name: "Piston Seal SPG 50",
    sku: "PS-SPG-50",
    category: "Hydraulic Seal",
    price: "฿250",
    stock: "210",
    icon: "◉",
  },
  {
    name: "Gasket Industrial",
    sku: "GSK-IND-01",
    category: "Gasket",
    price: "฿95",
    stock: "180",
    icon: "◇",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">

      {/* =========================
          TOP CONTACT BAR
      ========================= */}

      <div className="home-topbar">
        <div className="home-container home-topbar-inner">

          <div className="home-company-message">
            จำหน่าย ซีล โอริง ประเก็น อะไหล่ ปั๊ม วาล์ว ทุกชนิด
          </div>

          <div className="home-contact-list">
            <span>☎ 02-XXX-XXXX</span>
            <span>● @srrandsupply</span>
            <span>✉ info@srrandsupply.com</span>
            <span>จันทร์ - เสาร์ 8.00 - 17.00 น.</span>
          </div>

        </div>
      </div>

      {/* =========================
          MAIN HEADER
      ========================= */}

      <header className="home-header">
        <div className="home-container home-header-inner">

          <Link href="/" className="home-logo">

            <div className="home-logo-mark">
              SRR
            </div>

            <div className="home-logo-text">
              <strong>SRR AND SUPPLY</strong>
              <span>HIGH QUALITY SEAL PRODUCTS</span>
            </div>

          </Link>

          <div className="home-search">

            <input
              type="text"
              placeholder="ค้นหาสินค้า, ขนาด, รุ่น, วัสดุ, รหัสสินค้า..."
              aria-label="ค้นหาสินค้า"
            />

            <button type="button" aria-label="ค้นหา">
              ⌕
            </button>

          </div>

          <div className="home-header-actions">

            <button type="button" className="home-account">
              <span className="home-action-icon">♙</span>
              <span>
                <strong>เข้าสู่ระบบ</strong>
                <small>สมาชิก</small>
              </span>
            </button>

            <button type="button" className="home-account">
              <span className="home-action-icon">♙</span>
              <span>
                <strong>สมัครสมาชิก</strong>
                <small>สร้างบัญชี</small>
              </span>
            </button>

            <button type="button" className="home-cart">
              <span className="home-cart-icon">🛒</span>
              <span>
                <strong>(0)</strong>
                <small>ตะกร้าสินค้า</small>
              </span>
            </button>

          </div>

        </div>
      </header>

      {/* =========================
          NAVIGATION
      ========================= */}

      <nav className="home-navigation">
        <div className="home-container home-navigation-inner">

          <Link href="/" className="home-nav-category">
            ☰
            <span>หมวดหมู่สินค้า</span>
          </Link>

          <Link href="/products">O-Ring</Link>
          <Link href="/products">Oil Seal</Link>
          <Link href="/products">Hydraulic Seal</Link>
          <Link href="/products">Pneumatic Seal</Link>
          <Link href="/products">Rotary Seal</Link>
          <Link href="/products">ประเก็น</Link>
          <Link href="/products">อะไหล่ปั๊ม</Link>
          <Link href="/products">วาล์ว</Link>

          <Link href="/products" className="home-nav-all">
            ทั้งหมด⌄
          </Link>

          <Link href="/contact" className="home-nav-contact">
            ติดต่อเรา
          </Link>

        </div>
      </nav>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main>

        <div className="home-container home-main-layout">

          {/* SIDEBAR */}

          <aside className="home-category-sidebar">

            <div className="home-sidebar-title">
              <span>☰</span>
              หมวดหมู่สินค้า
            </div>

            <div className="home-sidebar-list">

              {sideCategories.map((category) => (
                <Link
                  href="/products"
                  className="home-sidebar-item"
                  key={category}
                >
                  <span className="home-sidebar-icon">○</span>
                  <span>{category}</span>
                  <span className="home-sidebar-arrow">›</span>
                </Link>
              ))}

            </div>

            <Link
              href="/products"
              className="home-sidebar-button"
            >
              ดูสินค้าทั้งหมด
            </Link>

          </aside>

          {/* MAIN AREA */}

          <div className="home-main-area">

            {/* HERO */}

            <section className="home-hero">

              <div className="home-hero-content">

                <div className="home-hero-label">
                  SRR AND SUPPLY
                </div>

                <h1>
                  ซีลและอะไหล่อุตสาหกรรม
                  <br />
                  ครบทุกประเภท
                </h1>

                <p>
                  คุณภาพสูง • ทนทาน • พร้อมส่งทั่วประเทศ
                </p>

                <div className="home-hero-benefits">

                  <div>
                    <span>✓</span>
                    <strong>สินค้าคุณภาพ</strong>
                    <small>ได้มาตรฐาน</small>
                  </div>

                  <div>
                    <span>□</span>
                    <strong>สต็อกพร้อมส่ง</strong>
                    <small>จัดส่งรวดเร็ว</small>
                  </div>

                  <div>
                    <span>฿</span>
                    <strong>ราคายุติธรรม</strong>
                    <small>คุ้มค่า</small>
                  </div>

                  <div>
                    <span>♧</span>
                    <strong>บริการให้คำปรึกษา</strong>
                    <small>โดยทีมงานมืออาชีพ</small>
                  </div>

                </div>

                <Link
                  href="/products"
                  className="home-hero-button"
                >
                  เลือกซื้อสินค้าเลย
                </Link>

              </div>

              <div className="home-hero-products">

                <div className="hero-product hero-product-black">◉</div>
                <div className="hero-product hero-product-brown">◉</div>
                <div className="hero-product hero-product-blue">◎</div>
                <div className="hero-product hero-product-red">◎</div>
                <div className="hero-product hero-product-gray">◉</div>

                <div className="hero-machine">
                  ⚙
                </div>

                <div className="hero-valve">
                  ▣
                </div>

              </div>

            </section>

            {/* CATEGORY GRID */}

            <section className="home-section">

              <div className="home-section-heading">
                <div>
                  <h2>หมวดหมู่สินค้า</h2>
                  <p>เลือกดูสินค้าตามประเภทที่ต้องการ</p>
                </div>

                <Link href="/products">
                  ดูทั้งหมด →
                </Link>
              </div>

              <div className="home-category-grid">

                {categories.map((category) => (
                  <Link
                    href="/products"
                    className="home-category-card"
                    key={category.name}
                  >

                    <div className="home-category-image">
                      {category.icon}
                    </div>

                    <strong>{category.name}</strong>
                    <span>{category.thai}</span>

                  </Link>
                ))}

              </div>

            </section>

          </div>

        </div>

        {/* =========================
            BENEFITS
        ========================= */}

        <section className="home-benefits">

          <div className="home-container home-benefits-grid">

            <div className="home-benefit">
              <span>✓</span>
              <div>
                <strong>สินค้าคุณภาพสูง</strong>
                <small>คัดสรรสินค้าคุณภาพได้มาตรฐาน</small>
              </div>
            </div>

            <div className="home-benefit">
              <span>□</span>
              <div>
                <strong>สต็อกแน่น พร้อมส่ง</strong>
                <small>มีสินค้าครบ พร้อมจัดส่งรวดเร็ว</small>
              </div>
            </div>

            <div className="home-benefit">
              <span>฿</span>
              <div>
                <strong>ราคายุติธรรม</strong>
                <small>ราคาคุ้มค่า เหมาะกับทุกธุรกิจ</small>
              </div>
            </div>

            <div className="home-benefit">
              <span>♧</span>
              <div>
                <strong>บริการให้คำปรึกษา</strong>
                <small>ทีมงานพร้อมช่วยเลือกสินค้า</small>
              </div>
            </div>

            <div className="home-benefit">
              <span>✓</span>
              <div>
                <strong>รับประกันสินค้า</strong>
                <small>มั่นใจในคุณภาพและบริการหลังการขาย</small>
              </div>
            </div>

          </div>

        </section>

        {/* =========================
            BEST SELLERS
        ========================= */}

        <section className="home-products-section">

          <div className="home-container">

            <div className="home-section-heading">
              <div>
                <h2>สินค้าขายดี</h2>
                <p>สินค้าที่ลูกค้าเลือกซื้อบ่อย</p>
              </div>

              <Link href="/products">
                ดูสินค้าทั้งหมด →
              </Link>
            </div>

            <div className="home-product-grid">

              {products.map((product) => (
                <article
                  className="home-product-card"
                  key={product.sku}
                >

                  <Link
                    href="/products"
                    className="home-product-image"
                  >
                    <span>{product.icon}</span>
                  </Link>

                  <div className="home-product-info">

                    <span className="home-product-category">
                      {product.category}
                    </span>

                    <Link
                      href="/products"
                      className="home-product-name"
                    >
                      {product.name}
                    </Link>

                    <span className="home-product-sku">
                      SKU: {product.sku}
                    </span>

                    <div className="home-product-bottom">

                      <div>
                        <strong>{product.price}</strong>
                        <small>มีสินค้า {product.stock} ชิ้น</small>
                      </div>

                      <button
                        type="button"
                        aria-label={`เพิ่ม ${product.name} ลงตะกร้า`}
                      >
                        +
                      </button>

                    </div>

                  </div>

                </article>
              ))}

            </div>

          </div>

        </section>

        {/* =========================
            SIMPLE CTA
        ========================= */}

        <section className="home-contact-banner">

          <div className="home-container home-contact-banner-inner">

            <div>
              <strong>
                หาสินค้าที่ต้องการไม่เจอ?
              </strong>

              <p>
                แจ้งขนาด รุ่น หรือรายละเอียดที่ต้องการ
                ทีมงาน SRR AND SUPPLY พร้อมช่วยค้นหาให้
              </p>
            </div>

            <div className="home-contact-buttons">

              <button type="button">
                ติดต่อเรา
              </button>

              <button type="button">
                สอบถามสินค้า
              </button>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
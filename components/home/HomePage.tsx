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
            <span>
           <svg xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-telephone-fill"
            viewBox="0 0 16 16">
           <path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
          </svg>
         02-XXX-XXXX
        </span>
            <span class="contact-item">
    <svg class="contact-icon"
         xmlns="http://www.w3.org/2000/svg"
         width="16"
         height="16"
         fill="currentColor"
         viewBox="0 0 16 16">
        <path d="M8 0c4.411 0 8 2.912 8 6.492 0 1.433-.555 2.723-1.715 3.994-1.678 1.932-5.431 4.285-6.285 4.645-.83.35-.734-.197-.696-.413l.003-.018.114-.685c.027-.204.055-.521-.026-.723-.09-.223-.444-.339-.704-.395C2.846 12.39 0 9.701 0 6.492 0 2.912 3.59 0 8 0M5.022 7.686H3.497V4.918a.156.156 0 0 0-.155-.156H2.78a.156.156 0 0 0-.156.156v3.486c0 .041.017.08.044.107v.001l.002.002.002.002a.15.15 0 0 0 .108.043h2.242c.086 0 .155-.07.155-.156v-.56a.156.156 0 0 0-.155-.157m.791-2.924a.156.156 0 0 0-.156.156v3.486c0 .086.07.155.156.155h.562c.086 0 .155-.07.155-.155V4.918a.156.156 0 0 0-.155-.156zm3.863 0a.156.156 0 0 0-.156.156v2.07L7.923 4.832l-.013-.015v-.001l-.01-.01-.003-.003-.011-.009h-.001L7.88 4.79l-.003-.002-.005-.003-.008-.005h-.002l-.003-.002-.01-.004-.004-.002-.01-.003h-.002l-.003-.001-.009-.002h-.006l-.003-.001h-.004l-.002-.001h-.574a.156.156 0 0 0-.156.155v3.486c0 .086.07.155.156.155h.56c.087 0 .157-.07.157-.155v-2.07l1.6 2.16a.2.2 0 0 0 .039.038l.001.001.01.006.004.002.008.004.007.003.005.002.01.003h.003a.2.2 0 0 0 .04.006h.56c.087 0 .157-.07.157-.155V4.918a.156.156 0 0 0-.156-.156zm3.815.717v-.56a.156.156 0 0 0-.155-.157h-2.242a.16.16 0 0 0-.108.044h-.001l-.001.002-.002.003a.16.16 0 0 0-.044.107v3.486c0 .041.017.08.044.107l.002.003.002.002a.16.16 0 0 0 .108.043h2.242c.086 0 .155-.07.155-.156v-.56a.156.156 0 0 0-.155-.157H11.81v-.589h1.525c.086 0 .155-.07.155-.156v-.56a.156.156 0 0 0-.155-.157H11.81v-.589h1.525c.086 0 .155-.07.155-.156Z"/>
    </svg>
    @srrandsupply
</span>
            <span>
            <svg xmlns="http://www.w3.org/2000/svg"
             width="16"
             height="16"
             fill="currentColor"
             class="bi bi-envelope-at-fill"
             viewBox="0 0 16 16">
          <path d="M2 2A2 2 0 0 0 .05 3.555L8 8.414l7.95-4.859A2 2 0 0 0 14 2zm-2 9.8V4.698l5.803 3.546zm6.761-2.97-6.57 4.026A2 2 0 0 0 2 14h6.256A4.5 4.5 0 0 1 8 12.5a4.49 4.49 0 0 1 1.606-3.446l-.367-.225L8 9.586zM16 9.671V4.697l-5.803 3.546.338.208A4.5 4.5 0 0 1 12.5 8c1.414 0 2.675.652 3.5 1.671"/>
        <path d="M15.834 12.244c0 1.168-.577 2.025-1.587 2.025-.503 0-1.002-.228-1.12-.648h-.043c-.118.416-.543.643-1.015.643-.77 0-1.259-.542-1.259-1.434v-.529c0-.844.481-1.4 1.26-1.4.585 0 .87.333.953.63h.03v-.568h.905v2.19c0 .272.18.42.411.42.315 0 .639-.415.639-1.39v-.118c0-1.277-.95-2.326-2.484-2.326h-.04c-1.582 0-2.64 1.067-2.64 2.724v.157c0 1.867 1.237 2.654 2.57 2.654h.045c.507 0 .935-.07 1.18-.18v.731c-.219.1-.643.175-1.237.175h-.044C10.438 16 9 14.82 9 12.646v-.214C9 10.36 10.421 9 12.485 9h.035c2.12 0 3.314 1.43 3.314 3.034zm-4.04.21v.227c0 .586.227.8.581.8.31 0 .564-.17.564-.743v-.367c0-.516-.275-.708-.572-.708-.346 0-.573.245-.573.791"/>
    </svg>
    info@srrandsupply.com
</span>
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
           <img
           src="logo.jpg"
             alt="SRR AND SUPPLY"
                />
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
    <span>
        <svg xmlns="http://www.w3.org/2000/svg"
             width="16"
             height="16"
             fill="currentColor"
             class="bi bi-truck"
             viewBox="0 0 16 16">
            <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
        </svg>
    </span>
    <strong>สต็อกพร้อมส่ง</strong>
    <small>จัดส่งรวดเร็ว</small>
</div>

                  <div>
                    <span>฿</span>
                    <strong>ราคายุติธรรม</strong>
                    <small>คุ้มค่า</small>
                  </div>

                 <div>
    <span>
        <svg xmlns="http://www.w3.org/2000/svg"
             width="16"
             height="16"
             fill="currentColor"
             class="bi bi-headset"
             viewBox="0 0 16 16">
            <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5"/>
        </svg>
    </span>

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

            <img
               src="/logo/hero-products.png"
               alt="ซีลและอะไหล่อุตสาหกรรม SRR AND SUPPLY"
               className="home-hero-image"
              />

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
   <span>
     <svg
       xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
       fill="currentColor"
       className="bi bi-box2-fill"
       viewBox="0 0 16 16"
     >
      <path d="M3.75 0a1 1 0 0 0-.8.4L.1 4.2a.5.5 0 0 0-.1.3V15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4.5a.5.5 0 0 0-.1-.3L13.05.4a1 1 0 0 0-.8-.4zM15 4.667V5H1v-.333L1.5 4h6V1h1v3h6z"/>
    </svg>
  </span>

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
    <span>
       <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-headset"
        viewBox="0 0 16 16"
       >
        <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5"/>
     </svg>
   </span>

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
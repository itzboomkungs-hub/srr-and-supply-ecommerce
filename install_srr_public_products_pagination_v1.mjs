import fs from "node:fs";
import path from "node:path";


const PAGE_SIZE = 16;


function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}


function insertBefore(text, marker, addition, label) {
  const i = text.indexOf(marker);
  if (i < 0) throw new Error(`ไม่พบตำแหน่ง ${label}`);
  return text.slice(0, i) + addition + "\n" + text.slice(i);
}


function patchPage(source) {
  let text = String(source).replace(/\r\n/g, "\n");
  if (text.includes("PUBLIC_PRODUCTS_PAGE_SIZE")) return text;


  if (!text.includes("displayedProducts") || !text.includes("styles.shopGrid")) {
    throw new Error("หน้า Products ไม่ตรงโครงที่รองรับ");
  }


  const helper = `


type PublicProductPageToken = number | "ellipsis-left" | "ellipsis-right";
const PUBLIC_PRODUCTS_PAGE_SIZE = ${PAGE_SIZE};


function buildPublicProductPageTokens(
  currentPage: number,
  totalPages: number
): PublicProductPageToken[] {
  if (totalPages <= 8) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }


  if (currentPage <= 5) {
    return [1, 2, 3, 4, 5, 6, "ellipsis-right", totalPages];
  }


  if (currentPage >= totalPages - 4) {
    return [
      1,
      "ellipsis-left",
      totalPages - 5,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }


  return [
    1,
    "ellipsis-left",
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    "ellipsis-right",
    totalPages,
  ];
}
`;


  text = insertBefore(
    text,
    `/* =====================================================\n   PAGE\n===================================================== */`,
    helper,
    "PAGE helper"
  );


  const state = `


  /* =====================================================
     PUBLIC PRODUCTS PAGINATION
  ===================================================== */


  const [page, setPage] = useState(1);
`;


  text = insertBefore(
    text,
    `  /* =====================================================\n     PRODUCTS FROM MYSQL\n  ===================================================== */`,
    state,
    "pagination state"
  );


  const logic = `


  /* =====================================================
     PUBLIC PRODUCTS PAGINATION
  ===================================================== */


  useEffect(() => {
    setPage(1);
  }, [search, category, status, showInactive, sort]);


  const publicTotalPages = Math.max(
    1,
    Math.ceil(displayedProducts.length / PUBLIC_PRODUCTS_PAGE_SIZE)
  );


  const publicSafePage = Math.min(
    Math.max(1, page),
    publicTotalPages
  );


  const publicPageStart =
    (publicSafePage - 1) * PUBLIC_PRODUCTS_PAGE_SIZE;


  const publicPageProducts = displayedProducts.slice(
    publicPageStart,
    publicPageStart + PUBLIC_PRODUCTS_PAGE_SIZE
  );


  const publicPageFrom =
    displayedProducts.length === 0 ? 0 : publicPageStart + 1;


  const publicPageTo = Math.min(
    publicPageStart + PUBLIC_PRODUCTS_PAGE_SIZE,
    displayedProducts.length
  );


  const publicPageTokens = buildPublicProductPageTokens(
    publicSafePage,
    publicTotalPages
  );


  function goToPublicProductPage(nextPage: number) {
    setPage(
      Math.min(
        Math.max(1, nextPage),
        publicTotalPages
      )
    );


    window.setTimeout(() => {
      document.getElementById("srr-products-list")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }
`;


  text = insertBefore(
    text,
    `  /* =====================================================\n     SUMMARY\n  ===================================================== */`,
    logic,
    "pagination logic"
  );


  const count = text.split("displayedProducts.map(").length - 1;
  if (count !== 1) {
    throw new Error(`พบ displayedProducts.map จำนวน ${count} จุด แทนที่จะเป็น 1 จุด`);
  }
  text = text.replace("displayedProducts.map(", "publicPageProducts.map(");


  const sectionClass = `className={\n              styles.shopSection\n            }`;
  if (text.includes(sectionClass)) {
    text = text.replace(
      sectionClass,
      `id="srr-products-list"\n            ${sectionClass}`
    );
  }


  const gridIndex = text.indexOf("styles.shopGrid");
  const sectionEnd = text.indexOf("\n          </section>", gridIndex);
  if (gridIndex < 0 || sectionEnd < 0) {
    throw new Error("หา shopSection ไม่สำเร็จ");
  }


  const gridClose = text.lastIndexOf("\n            </div>", sectionEnd);
  if (gridClose < 0) throw new Error("หา tag ปิด shopGrid ไม่สำเร็จ");
  const insertAt = gridClose + "\n            </div>".length;


  const pagination = `


            {!productsLoading &&
              !productsError &&
              displayedProducts.length > 0 && (
              <div className={styles.paginationBar}>
                <div className={styles.paginationInfo}>
                  แสดง {publicPageFrom.toLocaleString("th-TH")}–{publicPageTo.toLocaleString("th-TH")} จาก{" "}
                  {displayedProducts.length.toLocaleString("th-TH")} รายการ
                  <span>{PUBLIC_PRODUCTS_PAGE_SIZE} รายการ / หน้า</span>
                </div>


                <div
                  className={styles.paginationControls}
                  aria-label="แบ่งหน้ารายการสินค้า"
                >
                  <button
                    type="button"
                    className={styles.paginationButton}
                    disabled={publicSafePage <= 1}
                    onClick={() => goToPublicProductPage(publicSafePage - 1)}
                  >
                    ‹
                  </button>


                  {publicPageTokens.map((token) => {
                    if (token === "ellipsis-left" || token === "ellipsis-right") {
                      return (
                        <span key={token} className={styles.paginationEllipsis}>
                          …
                        </span>
                      );
                    }


                    return (
                      <button
                        type="button"
                        key={token}
                        className={`${styles.paginationButton} ${
                          token === publicSafePage
                            ? styles.paginationButtonActive
                            : ""
                        }`}
                        aria-current={token === publicSafePage ? "page" : undefined}
                        onClick={() => goToPublicProductPage(token)}
                      >
                        {token}
                      </button>
                    );
                  })}


                  <button
                    type="button"
                    className={styles.paginationButton}
                    disabled={publicSafePage >= publicTotalPages}
                    onClick={() => goToPublicProductPage(publicSafePage + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
`;


  text = text.slice(0, insertAt) + pagination + text.slice(insertAt);


  for (const mustHave of [
    "PUBLIC_PRODUCTS_PAGE_SIZE = 16",
    "publicPageProducts.map(",
    "styles.paginationBar",
    "styles.paginationButtonActive",
  ]) {
    if (!text.includes(mustHave)) {
      throw new Error(`Patch ไม่ครบ: ${mustHave}`);
    }
  }


  return text;
}


function patchCss(source) {
  let text = String(source).replace(/\r\n/g, "\n");
  if (text.includes(".paginationBar {")) return text;


  return text.trimEnd() + `


/* =========================================================
   PUBLIC PRODUCTS PAGINATION
========================================================= */
.paginationBar {
  min-height: 70px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-top: 1px solid #dfe5ec;
  background: #ffffff;
}


.paginationInfo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #6f8195;
  font-size: 11px;
}


.paginationInfo span {
  padding: 4px 7px;
  border-radius: 5px;
  background: #f2f6fa;
  color: #7d8ea0;
  font-size: 9px;
}


.paginationControls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  flex-wrap: wrap;
}


.paginationButton {
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d8e1ea;
  border-radius: 5px;
  background: #ffffff;
  color: #44617e;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}


.paginationButton:hover:not(:disabled) {
  border-color: #8eb9df;
  background: #f4f9ff;
  color: #075bb7;
}


.paginationButtonActive,
.paginationButtonActive:hover:not(:disabled) {
  border-color: #075bb7;
  background: #075bb7;
  color: #ffffff;
}


.paginationButton:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}


.paginationEllipsis {
  min-width: 22px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8b9aaa;
  font-size: 13px;
}


@media (max-width: 700px) {
  .paginationBar {
    align-items: flex-start;
    flex-direction: column;
  }


  .paginationControls {
    width: 100%;
    justify-content: flex-start;
  }
}
`;
}


const root = process.cwd();
if (!fs.existsSync(path.join(root, "package.json"))) {
  throw new Error("วางไฟล์นี้ที่ ROOT ของ srr-and-supply-ecommerce แล้วรันใหม่");
}


const pageCandidates = [
  "app/products/page.tsx",
  "app/products/ProductsPage.tsx",
];


const relativePage = pageCandidates.find((file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return false;
  const source = fs.readFileSync(full, "utf8");
  return source.includes("displayedProducts") && source.includes("styles.shopGrid");
});


if (!relativePage) {
  throw new Error("ไม่พบหน้า /products ที่มี displayedProducts + shopGrid");
}


const pagePath = path.join(root, relativePage);
const cssPath = path.join(path.dirname(pagePath), "ProductsPage.module.css");
if (!fs.existsSync(cssPath)) {
  throw new Error(`ไม่พบ ${path.relative(root, cssPath)}`);
}


const oldPage = fs.readFileSync(pagePath, "utf8");
const oldCss = fs.readFileSync(cssPath, "utf8");
const newPage = patchPage(oldPage);
const newCss = patchCss(oldCss);


const backup = path.join(
  path.dirname(root),
  `_backup_public_products_pagination_${stamp()}`
);


for (const [relative, content] of [
  [relativePage, oldPage],
  [path.relative(root, cssPath), oldCss],
]) {
  const destination = path.join(backup, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");
}


fs.writeFileSync(pagePath, newPage, "utf8");
fs.writeFileSync(cssPath, newCss, "utf8");


console.log("SRR PUBLIC PRODUCTS PAGINATION: PATCHED");
console.log(`PAGE   : ${relativePage}`);
console.log(`CSS    : ${path.relative(root, cssPath)}`);
console.log(`BACKUP : ${backup}`);
console.log("RESULT : 16 สินค้าต่อหน้า + 1 2 3 4 5 6 … + ก่อนหน้า/ถัดไป");
console.log("NEXT   : npm run build");
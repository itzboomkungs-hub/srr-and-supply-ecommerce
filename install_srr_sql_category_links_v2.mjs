import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";


function normalize(value) {
  return String(value ?? "").replace(/\r\n/g, "\n");
}


function insertBefore(text, marker, addition, label) {
  if (!text.includes(marker)) {
    throw new Error(`ไม่พบตำแหน่งสำหรับ ${label}`);
  }
  return text.replace(marker, addition + marker);
}


function count(text, needle) {
  return text.split(needle).length - 1;
}


function ensureHomeType(text) {
  if (text.includes("type SrrHomeCategory =")) return text;


  const typeBlock = `type SrrHomeCategory = {\n  id: number;\n  name: string;\n  code: string;\n  description: string;\n  productCount?: number;\n};\n\n`;


  if (text.includes("const categories = [")) {
    return insertBefore(text, "const categories = [", typeBlock, "Home category type");
  }


  if (text.includes("const sideCategories = [")) {
    return insertBefore(text, "const sideCategories = [", typeBlock, "Home category type");
  }


  throw new Error("ไม่พบชุด categories ใน HomePage.tsx");
}


export function transformHome(source) {
  let text = normalize(source);
  text = ensureHomeType(text);


  if (!text.includes("const [srrHomeCategoryRows, setSrrHomeCategoryRows]")) {
    const marker = "export default function HomePage() {";
    if (!text.includes(marker)) {
      throw new Error("ไม่พบ HomePage component");
    }


    const setup = `\n  const [srrHomeCategoryRows, setSrrHomeCategoryRows] =\n    useState<SrrHomeCategory[]>([]);\n\n  useEffect(() => {\n    let cancelled = false;\n\n    async function loadSrrHomeCategories() {\n      try {\n        const response = await fetch(\"/api/product-categories\", {\n          cache: \"no-store\",\n        });\n        const data = await response.json();\n\n        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {\n          throw new Error(data?.message || \"โหลดหมวดหมู่ไม่สำเร็จ\");\n        }\n\n        if (!cancelled) {\n          setSrrHomeCategoryRows(data.categories);\n        }\n      } catch (error) {\n        console.error(\"Load home SQL categories error:\", error);\n        if (!cancelled) setSrrHomeCategoryRows([]);\n      }\n    }\n\n    void loadSrrHomeCategories();\n\n    function handleSrrProductsUpdated() {\n      void loadSrrHomeCategories();\n    }\n\n    window.addEventListener(\"srr-products-updated\", handleSrrProductsUpdated);\n\n    return () => {\n      cancelled = true;\n      window.removeEventListener(\"srr-products-updated\", handleSrrProductsUpdated);\n    };\n  }, []);\n\n  const srrHomeCategoryCards = srrHomeCategoryRows.map((item) => ({\n    id: item.id,\n    name: item.name,\n    thai: item.description || \"หมวดหมู่สินค้า\",\n    icon: \"▦\",\n  }));\n\n  const srrHomeSideCategories = srrHomeCategoryRows.map((item) => item.name);\n`;


    text = text.replace(marker, marker + setup);
  }


  text = text
    .replaceAll("displaySideCategories.map(", "srrHomeSideCategories.map(")
    .replaceAll("sideCategories.map(", "srrHomeSideCategories.map(")
    .replaceAll("displayCategories.map(", "srrHomeCategoryCards.map(")
    .replaceAll("categories.map(", "srrHomeCategoryCards.map(");


  text = text.replace(
    /<Link\s+key=\{item\}\s+href="\/products"\s+className=\{styles\.sidebarItem\}/g,
    `<Link\n                  key={item}\n                  href={\`/products?category=\${encodeURIComponent(item)}\`}\n                  className={styles.sidebarItem}`
  );


  text = text.replace(
    /<Link\s+href="\/products"\s+key=\{item\.name\}\s+className=\{styles\.homeCategoryCard\}/g,
    `<Link\n                    href={\`/products?category=\${encodeURIComponent(item.name)}\`}\n                    key={item.id}\n                    className={styles.homeCategoryCard}`
  );


  // รองรับกรณี props เรียงคนละลำดับเล็กน้อย
  text = text.replace(
    /key=\{item\.name\}\s+href="\/products"/g,
    `key={item.id}\n                  href={\`/products?category=\${encodeURIComponent(item.name)}\`}`
  );


  if (!text.includes('fetch("/api/product-categories"')) {
    throw new Error("HomePage ยังไม่ได้เชื่อม /api/product-categories");
  }


  if (!text.includes("srrHomeSideCategories.map(")) {
    throw new Error("Home sidebar ยังไม่ได้ใช้หมวดหมู่จาก SQL");
  }


  if (!text.includes("srrHomeCategoryCards.map(")) {
    throw new Error("Home category cards ยังไม่ได้ใช้หมวดหมู่จาก SQL");
  }


  if (!text.includes("encodeURIComponent(item)")) {
    throw new Error("Home sidebar ยังไม่ได้ลิงก์ไป category query");
  }


  if (!text.includes("encodeURIComponent(item.name)")) {
    throw new Error("Home category cards ยังไม่ได้ลิงก์ไป category query");
  }


  return text;
}


function ensureSearchParamsImport(text) {
  if (/import\s*\{[^}]*\buseSearchParams\b[^}]*\}\s*from\s*["']next\/navigation["']/.test(text)) {
    return text;
  }


  const reactImport = text.match(/import\s*\{[\s\S]*?\}\s*from\s*["']react["'];?/);
  if (!reactImport) {
    throw new Error("ไม่พบ React import ในหน้า Products");
  }


  return text.replace(
    reactImport[0],
    `${reactImport[0]}\n\nimport { useSearchParams } from \"next/navigation\";`
  );
}


function ensureProductsType(text) {
  if (text.includes("type SrrSqlProductCategory =")) return text;


  const typeBlock = `type SrrSqlProductCategory = {\n  id: number;\n  name: string;\n  code: string;\n  description: string;\n  productCount?: number;\n};\n\n`;


  // แทรกก่อน const categories เพื่อไม่แตะ Product type ที่เป็นหลายบรรทัด
  if (text.includes("const categories = [")) {
    return insertBefore(
      text,
      "const categories = [",
      typeBlock,
      "Products SQL category type"
    );
  }


  if (text.includes("const sideCategories = [")) {
    return insertBefore(
      text,
      "const sideCategories = [",
      typeBlock,
      "Products SQL category type"
    );
  }


  throw new Error("ไม่พบ categories/sideCategories ในหน้า Products");
}


function replaceCategoryState(text) {
  const stateRegex = /const\s*\[\s*category\s*,\s*setCategory\s*,?\s*\]\s*=\s*useState(?:<[^>]+>)?\(\s*[^)]*\s*\);/m;
  const match = text.match(stateRegex);


  if (!match) {
    throw new Error("ไม่พบ category state ในหน้า Products");
  }


  const replacement = "const [category, setCategory] = useState(srrCategoryFromUrl);";
  return text.replace(match[0], replacement);
}


export function transformProducts(source) {
  let text = normalize(source);
  text = ensureSearchParamsImport(text);
  text = ensureProductsType(text);


  if (!text.includes("const [srrSqlCategoryRows, setSrrSqlCategoryRows]")) {
    const marker = "export default function ProductsPage() {";
    if (!text.includes(marker)) {
      throw new Error("ไม่พบ ProductsPage component");
    }


    const setup = `\n  const srrCategorySearchParams = useSearchParams();\n  const srrCategoryFromUrl =\n    srrCategorySearchParams.get(\"category\")?.trim() || \"ทั้งหมด\";\n\n  const [srrSqlCategoryRows, setSrrSqlCategoryRows] =\n    useState<SrrSqlProductCategory[]>([]);\n\n  useEffect(() => {\n    let cancelled = false;\n\n    async function loadSrrProductCategories() {\n      try {\n        const response = await fetch(\"/api/product-categories\", {\n          cache: \"no-store\",\n        });\n        const data = await response.json();\n\n        if (!response.ok || !data?.ok || !Array.isArray(data?.categories)) {\n          throw new Error(data?.message || \"โหลดหมวดหมู่ไม่สำเร็จ\");\n        }\n\n        if (!cancelled) {\n          setSrrSqlCategoryRows(data.categories);\n        }\n      } catch (error) {\n        console.error(\"Load product SQL categories error:\", error);\n        if (!cancelled) setSrrSqlCategoryRows([]);\n      }\n    }\n\n    void loadSrrProductCategories();\n\n    return () => {\n      cancelled = true;\n    };\n  }, []);\n\n  const srrSqlCategories = srrSqlCategoryRows.map((item) => ({\n    name: item.name,\n    thai: item.description || \"หมวดหมู่สินค้า\",\n    icon: \"▦\",\n  }));\n\n  const srrSqlSideCategories = srrSqlCategoryRows.map((item) => ({\n    label: item.name,\n    category: item.name,\n  }));\n`;


    text = text.replace(marker, marker + setup);
  }


  // ถ้ารัน V2 ซ้ำ state จะถูก normalize เป็นค่าเดิม ไม่สร้างซ้ำ
  text = replaceCategoryState(text);


  if (!text.includes("/* SRR_CATEGORY_URL_SYNC */")) {
    const stateMarker = "const [category, setCategory] = useState(srrCategoryFromUrl);";
    const syncBlock = `\n\n  /* SRR_CATEGORY_URL_SYNC */\n  useEffect(() => {\n    setCategory(srrCategoryFromUrl);\n  }, [srrCategoryFromUrl]);`;


    if (!text.includes(stateMarker)) {
      throw new Error("ไม่พบ category state หลังแปลง URL");
    }


    text = text.replace(stateMarker, stateMarker + syncBlock);
  }


  text = text
    .replaceAll("displaySideCategories.map(", "srrSqlSideCategories.map(")
    .replaceAll("sideCategories.map(", "srrSqlSideCategories.map(")
    .replaceAll("displayCategories.map(", "srrSqlCategories.map(")
    .replaceAll("categories.map(", "srrSqlCategories.map(");


  if (!text.includes("useSearchParams")) {
    throw new Error("Products page ยังไม่มี useSearchParams");
  }


  if (!text.includes('srrCategorySearchParams.get("category")')) {
    throw new Error("Products page ยังไม่ได้อ่าน category จาก URL");
  }


  if (!text.includes('fetch("/api/product-categories"')) {
    throw new Error("Products page ยังไม่ได้อ่านหมวดหมู่จาก SQL API");
  }


  if (!text.includes("srrSqlCategories.map(")) {
    throw new Error("Products category cards/select ยังไม่ได้ใช้ SQL categories");
  }


  if (!text.includes("srrSqlSideCategories.map(")) {
    throw new Error("Products sidebar ยังไม่ได้ใช้ SQL categories");
  }


  return text;
}


function selfTest() {
  const homeFixture = `"use client";\n\nimport Link from "next/link";\nimport { useEffect, useState } from "react";\n\ntype Product = ProductQuickViewData;\n\nconst categories = [{ name: "O-Ring", thai: "โอริง", icon: "◎" }];\nconst sideCategories = ["O-Ring"];\n\nexport default function HomePage() {\n  const [products, setProducts] = useState([]);\n  return <>\n    <div>{sideCategories.map((item) => (\n      <Link key={item} href="/products" className={styles.sidebarItem}>\n        <span className={styles.sidebarLabel}>{item}</span>\n      </Link>\n    ))}</div>\n    <div>{categories.map((item) => (\n      <Link href="/products" key={item.name} className={styles.homeCategoryCard}>\n        <div>{item.icon}</div><strong>{item.name}</strong><span>{item.thai}</span>\n      </Link>\n    ))}</div>\n  </>;\n}`;


  const homeOnce = transformHome(homeFixture);
  assert.match(homeOnce, /fetch\("\/api\/product-categories"/);
  assert.match(homeOnce, /srrHomeSideCategories\.map/);
  assert.match(homeOnce, /srrHomeCategoryCards\.map/);
  assert.match(homeOnce, /encodeURIComponent\(item\)/);
  assert.match(homeOnce, /encodeURIComponent\(item\.name\)/);
  assert.equal(transformHome(homeOnce), homeOnce, "Home transform ต้องรันซ้ำได้โดยไม่ซ้ำ");


  const productsFixture = `"use client";\n\nimport {\n  useEffect,\n  useMemo,\n  useState,\n} from "react";\n\ntype Product =\n  ProductQuickViewData & {\n    reserved: number;\n    active: boolean;\n  };\n\nconst categories = [{ name: "O-Ring", thai: "โอริง", icon: "◎" }];\nconst sideCategories = [{ label: "O-Ring", category: "O-Ring" }];\n\nexport default function ProductsPage() {\n  const [search, setSearch] = useState("");\n  const [\n    category,\n    setCategory,\n  ] =\n    useState("ทั้งหมด");\n  return <>\n    {sideCategories.map((item) => <button key={item.label}>{item.label}</button>)}\n    {categories.map((item) => <button key={item.name}>{item.name}</button>)}\n  </>;\n}`;


  const productsOnce = transformProducts(productsFixture);
  assert.match(productsOnce, /reserved: number;\n    active: boolean;\n  };/);
  assert.ok(
    productsOnce.indexOf("type SrrSqlProductCategory =") >
      productsOnce.indexOf("active: boolean;"),
    "SQL category type ต้องอยู่หลัง Product type"
  );
  assert.match(productsOnce, /useSearchParams/);
  assert.match(productsOnce, /srrCategorySearchParams\.get\("category"\)/);
  assert.match(productsOnce, /useState\(srrCategoryFromUrl\)/);
  assert.match(productsOnce, /srrSqlSideCategories\.map/);
  assert.match(productsOnce, /srrSqlCategories\.map/);
  assert.equal(
    transformProducts(productsOnce),
    productsOnce,
    "Products transform ต้องรันซ้ำได้โดยไม่ซ้ำ"
  );


  const oldPatchedFixture = `"use client";\nimport { useEffect, useState } from "react";\ntype Product = ProductQuickViewData & { reserved: number; active: boolean; };\ntype LiveCategory = { id: number; name: string; code: string; description: string; productCount: number; };\nconst categories = [];\nconst sideCategories = [];\nexport default function ProductsPage() {\n  const [liveCategories, setLiveCategories] = useState<LiveCategory[]>([]);\n  const [category, setCategory] = useState("ทั้งหมด");\n  const displayCategories = liveCategories.map((item) => ({ name:item.name, thai:item.description, icon:"▦" }));\n  const displaySideCategories = liveCategories.map((item) => item.name);\n  return <>{displayCategories.map((item)=><div key={item.name}/>) }{displaySideCategories.map((item)=><div key={item}/>)}</>;\n}`;


  const oldPatchedResult = transformProducts(oldPatchedFixture);
  assert.equal(count(oldPatchedResult, "const [srrSqlCategoryRows"), 1);
  assert.match(oldPatchedResult, /srrSqlCategories\.map/);
  assert.match(oldPatchedResult, /srrSqlSideCategories\.map/);


  console.log("SELF TEST: PASS");
}


function timestamp() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}


function chooseProductsFile(root) {
  const candidates = [
    path.join(root, "app", "products", "page.tsx"),
    path.join(root, "app", "products", "ProductsPage.tsx"),
  ];


  const scored = candidates
    .filter((file) => fs.existsSync(file))
    .map((file) => {
      const content = fs.readFileSync(file, "utf8");
      let score = 0;
      if (content.includes("/api/products")) score += 5;
      if (content.includes("normalizeApiProduct")) score += 4;
      if (content.includes("setCategory")) score += 3;
      if (content.includes("export default function ProductsPage")) score += 2;
      return { file, score };
    })
    .sort((a, b) => b.score - a.score);


  if (!scored.length || scored[0].score < 5) return null;
  return scored[0].file;
}


function main() {
  selfTest();


  const root = process.cwd();
  if (!fs.existsSync(path.join(root, "package.json"))) {
    throw new Error("กรุณาวางไฟล์นี้ที่ ROOT ของ srr-and-supply-ecommerce แล้วรันใหม่");
  }


  const homePath = path.join(root, "components", "home", "HomePage.tsx");
  const productsPath = chooseProductsFile(root);


  if (!fs.existsSync(homePath)) {
    throw new Error("ไม่พบ components/home/HomePage.tsx");
  }


  if (!productsPath) {
    throw new Error("ไม่พบหน้า Products ที่อ่าน /api/products และมี category filter");
  }


  const currentHome = fs.readFileSync(homePath, "utf8");
  const currentProducts = fs.readFileSync(productsPath, "utf8");


  // สำคัญ: แปลงให้สำเร็จใน memory ทั้งสองไฟล์ก่อนเขียนของจริง
  const nextHome = transformHome(currentHome);
  const nextProducts = transformProducts(currentProducts);


  const backupRoot = path.join(
    path.dirname(root),
    `_backup_srr_category_links_${timestamp()}`
  );


  const homeRelative = path.relative(root, homePath);
  const productsRelative = path.relative(root, productsPath);
  const backupHome = path.join(backupRoot, homeRelative);
  const backupProducts = path.join(backupRoot, productsRelative);


  fs.mkdirSync(path.dirname(backupHome), { recursive: true });
  fs.mkdirSync(path.dirname(backupProducts), { recursive: true });
  fs.copyFileSync(homePath, backupHome);
  fs.copyFileSync(productsPath, backupProducts);


  try {
    fs.writeFileSync(homePath, nextHome, "utf8");
    fs.writeFileSync(productsPath, nextProducts, "utf8");


    const verifyHome = fs.readFileSync(homePath, "utf8");
    const verifyProducts = fs.readFileSync(productsPath, "utf8");


    assert.match(verifyHome, /fetch\("\/api\/product-categories"/);
    assert.match(verifyHome, /products\?category=/);
    assert.match(verifyHome, /srrHomeSideCategories\.map/);


    assert.match(verifyProducts, /useSearchParams/);
    assert.match(verifyProducts, /srrCategorySearchParams\.get\("category"\)/);
    assert.match(verifyProducts, /useState\(srrCategoryFromUrl\)/);
    assert.match(verifyProducts, /srrSqlSideCategories\.map/);


    console.log("");
    console.log("SRR CATEGORY LINKS V2: PATCHED");
    console.log(`Home:     ${homeRelative}`);
    console.log(`Products: ${productsRelative}`);
    console.log(`Backup:   ${backupRoot}`);
    console.log("");
    console.log("ตรวจต่อด้วย:");
    console.log("  npm run build");
    console.log("");
  } catch (error) {
    fs.copyFileSync(backupHome, homePath);
    fs.copyFileSync(backupProducts, productsPath);
    throw error;
  }
}


try {
  main();
} catch (error) {
  console.error("");
  console.error(
    "PATCH FAILED:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
}
import test from "node:test";
import assert from "node:assert/strict";
import {
  extractMaterial,
  normalizeImportRow,
  normalizeImportRows,
  parsePrice,
} from "../lib/products/category-import.mjs";


test("maps customer G02580V row", () => {
  const row = normalizeImportRow({
    "NO.": 3,
    ITEM: "",
    TG_NO: "G02580V",
    TYPE: "O-Ring",
    "SIZE & MAT.": "3.68*1.78 VK9",
    "ราคา": 1,
  }, 1);
  assert.equal(row.code, "G02580V");
  assert.equal(row.category, "O-Ring");
  assert.equal(row.sizeMaterial, "3.68*1.78 VK9");
  assert.equal(row.material, "VK9");
  assert.equal(row.websiteName, "O-Ring 3.68*1.78 VK9");
  assert.equal(row.price, 1);
  assert.equal(row.valid, true);
});


test("blank TG_NO is invalid", () => {
  const row = normalizeImportRow({ TYPE: "O-Ring", "SIZE & MAT.": "9.5*1.5 VK9d" }, 0);
  assert.equal(row.valid, false);
  assert.equal(row.error, "ไม่มี TG_NO");
});


test("parses decimal and comma price", () => {
  assert.equal(parsePrice("1.90"), 1.9);
  assert.equal(parsePrice("1,250.50 บาท"), 1250.5);
});


test("extracts final material token", () => {
  assert.equal(extractMaterial("7.65*1.78 VK9d"), "VK9d");
});


test("missing TYPE falls back to other category", () => {
  const [row] = normalizeImportRows([{ TG_NO: "ABC001", "SIZE & MAT.": "10*2 NBR" }]);
  assert.equal(row.category, "อื่น ๆ");
  assert.equal(row.material, "NBR");
});
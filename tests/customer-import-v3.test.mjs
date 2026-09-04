import test from "node:test";
import assert from "node:assert/strict";
import { parseWorkbookSheet, parseNumber } from "../lib/products/customer-import-v3.mjs";


test("TC NBR ใช้ SOG เป็นรหัสและอ่าน STOCK", () => {
  const result = parseWorkbookSheet("TC NBR", [
    ["NO", "TYPE", "SIZE", "SOG", "MAT", " STOCK", "ราคา"],
    ["1", "TC", "4*16*6", "111294N", "NBR", "202", "15.07"],
  ]);
  assert.equal(result.rows[0].code, "111294N");
  assert.equal(result.rows[0].codeSource, "SOG");
  assert.equal(result.rows[0].stock, 202);
  assert.equal(result.rows[0].price, 15.07);
  assert.equal(result.rows[0].sizeMaterial, "4*16*6 NBR");
});


test("หา header row หลังชื่อรายงานได้", () => {
  const result = parseWorkbookSheet("TC FPM", [
    ["PRICE LIST TC-FPM"],
    ["ITEM", "SOG", "TYPE", "SIZE", "MAT", "ราคา"],
    ["1", "113615V", "TC", "10*16*4", "FPM", "6.78"],
  ]);
  assert.equal(result.headerRow, 2);
  assert.equal(result.rows[0].code, "113615V");
});


test("VK9 ใช้ TG_NO เป็นรหัส", () => {
  const result = parseWorkbookSheet("VK9", [
    ["NO.", "ITEM", "TG_NO", "TYPE", "SIZE & MAT.", "ราคา"],
    ["3", "", "G02580V", "O-Ring", "3.68*1.78 VK9", "1"],
  ]);
  assert.equal(result.rows[0].code, "G02580V");
  assert.equal(result.rows[0].codeSource, "TG_NO");
  assert.equal(result.rows[0].material, "VK9");
});


test("หัวราคากลายเป็นตัวเลขยังอ่านคอลัมน์ราคาได้", () => {
  const result = parseWorkbookSheet("O-RING FPM", [
    ["NO.", "ITEM", "TG_NO", "TYPE", "SIZE & MAT.", "0.28"],
    ["1", "", "G03112V", "O-Ring", "3*1 VK75", "1.62"],
    ["2", "", "G03110V", "O-Ring", "6*1 VK75", "2.25"],
  ]);
  assert.equal(result.rows[0].price, 1.62);
  assert.equal(result.rows[0].hasPrice, true);
});


test("SOG_NP มาก่อน SOG เมื่อไม่มี TG_NO", () => {
  const result = parseWorkbookSheet("TEST", [
    ["TYPE", "SIZE", "SOG", "SOG_NP", "MAT", "STOCK", "ราคา"],
    ["TC", "10*20*5", "OLD001", "NEW001", "NBR", "4", "9.5"],
  ]);
  assert.equal(result.rows[0].code, "NEW001");
  assert.equal(result.rows[0].codeSource, "SOG_NP");
});


test("ไม่มีรหัสจริงจะ invalid และไม่สร้างรหัสมั่ว", () => {
  const result = parseWorkbookSheet("VK9", [
    ["NO.", "TG_NO", "TYPE", "SIZE & MAT.", "ราคา"],
    ["1", "", "O-Ring", "9.5*1.5 VK9d", ""],
  ]);
  assert.equal(result.rows[0].valid, false);
  assert.equal(result.rows[0].error, "ไม่มีรหัสสินค้า");
});


test("parseNumber รองรับ comma และช่องว่าง", () => {
  assert.equal(parseNumber(" 1,250.50 "), 1250.5);
});
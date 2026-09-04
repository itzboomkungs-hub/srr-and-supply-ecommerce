function text(value) {
  return String(value ?? "").trim();
}


function normalizeHeader(value) {
  return text(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[._-]/g, "")
    .replace(/&/g, "AND");
}


function normalizedRowMap(row) {
  const result = new Map();
  if (!row || typeof row !== "object") return result;
  for (const [key, value] of Object.entries(row)) {
    result.set(normalizeHeader(key), value);
  }
  return result;
}


function pick(map, aliases) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (map.has(key)) return map.get(key);
  }
  return "";
}


export function parsePrice(value) {
  const raw = text(value);
  if (!raw) return 0;
  const normalized = raw
    .replace(/,/g, "")
    .replace(/[^0-9.+-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}


export function extractMaterial(sizeMaterial) {
  const value = text(sizeMaterial);
  if (!value) return "";
  const parts = value.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}


export function normalizeImportRow(row, index = 0) {
  const map = normalizedRowMap(row);
  const no = text(pick(map, ["NO", "NO."]));
  const sourceItem = text(pick(map, ["ITEM"]));
  const code = text(pick(map, ["TG_NO", "TG NO", "TGNO"])).toUpperCase();
  const category = text(pick(map, ["TYPE", "CATEGORY"])) || "อื่น ๆ";
  const sizeMaterial = text(
    pick(map, ["SIZE & MAT.", "SIZE & MAT", "SIZE&MAT", "SIZE MAT", "SIZEMAT"])
  );
  const price = parsePrice(pick(map, ["ราคา", "PRICE", "SELL PRICE"]));
  const material = extractMaterial(sizeMaterial);
  const websiteName = [category, sizeMaterial].filter(Boolean).join(" ").trim() || code;
  const allBlank = !no && !sourceItem && !code && !sizeMaterial && category === "อื่น ๆ" && price === 0;


  return {
    sourceRow: index + 2,
    no,
    sourceItem,
    code,
    category,
    sizeMaterial,
    material,
    price,
    websiteName,
    valid: !allBlank && Boolean(code),
    error: allBlank ? "แถวว่าง" : code ? "" : "ไม่มี TG_NO",
  };
}


export function normalizeImportRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => normalizeImportRow(row, index))
    .filter((row) => row.error !== "แถวว่าง");
}
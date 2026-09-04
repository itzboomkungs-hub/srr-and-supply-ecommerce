function text(value) {
  return String(value ?? "").trim();
}


function normalizeHeader(value) {
  return text(value)
    .toUpperCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[._\-/]/g, "")
    .replace(/&/g, "AND");
}


const aliases = {
  no: new Set(["NO", "NUMBER", "ลำดับ"]),
  item: new Set(["ITEM", "ITEMNO", "ITEMNUMBER"]),
  tgNo: new Set(["TGNO", "TGNUMBER"]),
  sogNp: new Set(["SOGNP", "SOGNEW", "SOGNEWPRICE"]),
  sog: new Set(["SOG", "SOGNO", "SOGNUMBER"]),
  type: new Set(["TYPE", "CATEGORY", "หมวด", "หมวดหมู่"]),
  sizeMat: new Set(["SIZEANDMAT", "SIZEANDMATERIAL", "SIZEMAT", "SIZEMATERIAL"]),
  size: new Set(["SIZE", "ขนาด"]),
  mat: new Set(["MAT", "MATERIAL", "วัสดุ"]),
  price: new Set(["ราคา", "PRICE", "SELLPRICE", "UNITPRICE"]),
  stock: new Set(["STOCK", "QTY", "QUANTITY", "คงเหลือ", "สต๊อก", "สต็อก"]),
};


function kindOfHeader(value) {
  const key = normalizeHeader(value);
  for (const [kind, set] of Object.entries(aliases)) {
    if (set.has(key)) return kind;
  }
  return "";
}


export function parseNumber(value) {
  const raw = text(value);
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, "").replace(/[^0-9.+-]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}


function looksNumeric(value) {
  const raw = text(value).replace(/\s+/g, "");
  return /^[-+]?\d[\d,]*(?:\.\d+)?$/.test(raw);
}


function headerScore(row) {
  const kinds = row.map(kindOfHeader).filter(Boolean);
  const unique = new Set(kinds);
  let score = unique.size;
  if (unique.has("tgNo") || unique.has("sog") || unique.has("sogNp")) score += 3;
  if (unique.has("type")) score += 2;
  if (unique.has("size") || unique.has("sizeMat")) score += 2;
  return score;
}


function detectHeaderRow(matrix) {
  let bestIndex = -1;
  let bestScore = -1;
  const limit = Math.min(matrix.length, 20);
  for (let index = 0; index < limit; index += 1) {
    const row = Array.isArray(matrix[index]) ? matrix[index] : [];
    const score = headerScore(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestScore >= 4 ? bestIndex : -1;
}


function buildColumnMap(header) {
  const map = {};
  header.forEach((cell, index) => {
    const kind = kindOfHeader(cell);
    if (kind && map[kind] == null) map[kind] = index;
  });
  return map;
}


function detectNumericFallback(matrix, headerIndex, candidateIndex) {
  if (candidateIndex == null || candidateIndex < 0) return -1;
  const sample = matrix.slice(headerIndex + 1, headerIndex + 12);
  let nonEmpty = 0;
  let numeric = 0;
  for (const row of sample) {
    const value = Array.isArray(row) ? row[candidateIndex] : "";
    if (text(value)) nonEmpty += 1;
    if (looksNumeric(value)) numeric += 1;
  }
  return nonEmpty > 0 && numeric / nonEmpty >= 0.6 ? candidateIndex : -1;
}


function extractMaterial(sizeMaterial) {
  const value = text(sizeMaterial);
  if (!value) return "";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "";
  const candidate = parts[parts.length - 1];
  return /[A-Za-zก-๙]/.test(candidate) ? candidate : "";
}


function cell(row, index) {
  return index == null || index < 0 ? "" : text(row[index]);
}


function chooseCode(fields, map) {
  const priority = map.tgNo != null
    ? [["TG_NO", fields.tgNo], ["SOG_NP", fields.sogNp], ["SOG", fields.sog]]
    : map.sogNp != null
      ? [["SOG_NP", fields.sogNp], ["SOG", fields.sog], ["TG_NO", fields.tgNo]]
      : [["SOG", fields.sog], ["TG_NO", fields.tgNo], ["SOG_NP", fields.sogNp]];


  for (const [source, value] of priority) {
    if (text(value)) return { code: text(value).toUpperCase(), codeSource: source };
  }
  return { code: "", codeSource: "" };
}


export function parseWorkbookSheet(sheetName, matrixInput) {
  const matrix = Array.isArray(matrixInput)
    ? matrixInput.map((row) => Array.isArray(row) ? row : [])
    : [];


  const headerIndex = detectHeaderRow(matrix);
  if (headerIndex < 0) {
    return { sheetName, headerRow: 0, mapping: {}, rows: [], warning: "หา header ไม่เจอ" };
  }


  const header = matrix[headerIndex];
  const map = buildColumnMap(header);


  let priceIndex = map.price ?? -1;
  if (priceIndex < 0) {
    const base = map.sizeMat ?? map.mat ?? map.size ?? -1;
    priceIndex = detectNumericFallback(matrix, headerIndex, base >= 0 ? base + 1 : -1);
  }
  const stockIndex = map.stock ?? -1;


  const rows = [];
  for (let rowIndex = headerIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
    const source = matrix[rowIndex];
    const tgNo = cell(source, map.tgNo);
    const sog = cell(source, map.sog);
    const sogNp = cell(source, map.sogNp);
    const sourceItem = cell(source, map.item);
    const category = cell(source, map.type) || sheetName;
    const size = cell(source, map.size);
    const explicitMat = cell(source, map.mat);
    const combined = cell(source, map.sizeMat);
    const sizeMaterial = combined || [size, explicitMat].filter(Boolean).join(" ").trim();
    const material = explicitMat || extractMaterial(sizeMaterial);
    const priceRaw = cell(source, priceIndex);
    const stockRaw = cell(source, stockIndex);
    const { code, codeSource } = chooseCode({ tgNo, sog, sogNp }, map);
    const no = cell(source, map.no);


    const rowHasAnything = [no, sourceItem, tgNo, sog, sogNp, category, sizeMaterial, priceRaw, stockRaw]
      .some((value) => Boolean(text(value)));
    if (!rowHasAnything) continue;


    rows.push({
      sourceSheet: sheetName,
      sourceRow: rowIndex + 1,
      no,
      sourceItem,
      tgNo,
      sog,
      sogNp,
      code,
      codeSource,
      category,
      size,
      sizeMaterial,
      material,
      price: parseNumber(priceRaw),
      stock: parseNumber(stockRaw),
      hasPrice: Boolean(priceRaw),
      hasStock: Boolean(stockRaw),
      websiteName: [category, sizeMaterial].filter(Boolean).join(" ").trim() || code,
      valid: Boolean(code),
      error: code ? "" : "ไม่มีรหัสสินค้า",
    });
  }


  return {
    sheetName,
    headerRow: headerIndex + 1,
    mapping: {
      code: map.tgNo != null ? "TG_NO" : map.sogNp != null ? "SOG_NP" : map.sog != null ? "SOG" : "",
      category: map.type != null ? text(header[map.type]) : "Sheet name",
      size: map.sizeMat != null
        ? text(header[map.sizeMat])
        : [map.size != null ? text(header[map.size]) : "", map.mat != null ? text(header[map.mat]) : ""].filter(Boolean).join(" + "),
      price: priceIndex >= 0 ? text(header[priceIndex]) || `Column ${priceIndex + 1}` : "",
      stock: stockIndex >= 0 ? text(header[stockIndex]) : "",
    },
    rows,
    warning: "",
  };
}
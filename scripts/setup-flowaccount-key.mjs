import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
const keyName = "SRR_SETTINGS_ENCRYPTION_KEY";

let current = "";
try {
  current = await readFile(envPath, "utf8");
} catch {
  current = "";
}

const existing = current
  .split(/\r?\n/)
  .find((line) => line.trim().startsWith(`${keyName}=`));

if (existing && existing.split("=").slice(1).join("=").trim()) {
  console.log(`${keyName} มีอยู่ใน .env.local แล้ว ไม่ได้แก้ไข`);
  process.exit(0);
}

const key = randomBytes(32).toString("base64");
const line = `${keyName}="${key}"`;

let next = current.trimEnd();
if (existing) {
  next = next
    .split(/\r?\n/)
    .map((item) =>
      item.trim().startsWith(`${keyName}=`) ? line : item
    )
    .join("\n");
} else {
  next = `${next}${next ? "\n" : ""}${line}`;
}

await writeFile(envPath, `${next}\n`, "utf8");
console.log(`สร้าง ${keyName} ใน .env.local เรียบร้อยแล้ว`);
console.log("อย่า commit หรือส่งไฟล์ .env.local ให้ผู้อื่น");

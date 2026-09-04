import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";


function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}


function decodeHash(value) {
  const text = String(value || "").trim();
  if (/^[0-9a-f]+$/i.test(text) && text.length % 2 === 0) {
    return { buffer: Buffer.from(text, "hex"), encoding: "hex" };
  }
  try {
    return { buffer: Buffer.from(text, "base64"), encoding: "base64" };
  } catch {
    return { buffer: Buffer.alloc(0), encoding: "hex" };
  }
}


function parseStoredHash(storedHash) {
  const value = String(storedHash || "").trim();
  if (!value) return { kind: "unknown" };


  if (/^\$2[aby]\$/.test(value)) {
    return { kind: "bcrypt" };
  }


  if (/^[0-9a-f]{64}$/i.test(value)) {
    return { kind: "sha256", prefix: "" };
  }


  if (/^sha256:[0-9a-f]{64}$/i.test(value)) {
    return { kind: "sha256", prefix: "sha256:" };
  }


  const colon = value.split(":");
  if (colon.length === 3 && colon[0].toLowerCase() === "scrypt") {
    const decoded = decodeHash(colon[2]);
    return { kind: "scrypt", prefix: "scrypt:", separator: ":", salt: colon[1], decoded };
  }


  if (colon.length === 2 && colon[0] && colon[1]) {
    const decoded = decodeHash(colon[1]);
    if (decoded.buffer.length >= 16) {
      return { kind: "scrypt", prefix: "", separator: ":", salt: colon[0], decoded };
    }
  }


  const dollar = value.split("$");
  if (dollar.length === 3 && dollar[0].toLowerCase() === "scrypt") {
    const decoded = decodeHash(dollar[2]);
    return { kind: "scrypt", prefix: "scrypt$", separator: "$", salt: dollar[1], decoded };
  }


  if (dollar.length === 2 && dollar[0] && dollar[1]) {
    const decoded = decodeHash(dollar[1]);
    if (decoded.buffer.length >= 16) {
      return { kind: "scrypt", prefix: "", separator: "$", salt: dollar[0], decoded };
    }
  }


  return { kind: "unknown" };
}


export function describePasswordHash(storedHash) {
  return parseStoredHash(storedHash).kind;
}


export function verifyStoredPassword(password, storedHash) {
  const parsed = parseStoredHash(storedHash);


  if (parsed.kind === "sha256") {
    const digest = createHash("sha256").update(String(password)).digest("hex");
    const expected = String(storedHash).replace(/^sha256:/i, "");
    return safeEqual(Buffer.from(digest, "hex"), Buffer.from(expected, "hex"));
  }


  if (parsed.kind === "scrypt") {
    const expected = parsed.decoded.buffer;
    if (!expected.length) return false;
    const actual = scryptSync(String(password), parsed.salt, expected.length);
    return safeEqual(actual, expected);
  }


  return false;
}


export function createCompatiblePasswordHash(password, storedHash) {
  const parsed = parseStoredHash(storedHash);


  if (parsed.kind === "sha256") {
    const digest = createHash("sha256").update(String(password)).digest("hex");
    return parsed.prefix + digest;
  }


  if (parsed.kind === "scrypt") {
    const salt = randomBytes(16).toString("hex");
    const bytes = parsed.decoded.buffer.length || 64;
    const encoded = scryptSync(String(password), salt, bytes).toString(parsed.decoded.encoding);
    if (parsed.prefix === "scrypt:") return "scrypt:" + salt + ":" + encoded;
    if (parsed.prefix === "scrypt$") return "scrypt$" + salt + "$" + encoded;
    return salt + parsed.separator + encoded;
  }


  throw new Error("UNSUPPORTED_PASSWORD_HASH");
}

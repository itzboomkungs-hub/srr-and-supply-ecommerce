import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;

export const SESSION_COOKIE_NAME = "srr_session";

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(
    String(password),
    salt,
    PASSWORD_KEY_LENGTH
  );

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password, storedValue) {
  try {
    const [algorithm, salt, storedHex] = String(storedValue).split("$");

    if (
      algorithm !== "scrypt" ||
      !salt ||
      !storedHex
    ) {
      return false;
    }

    const storedBuffer = Buffer.from(storedHex, "hex");
    const derivedKey = scryptSync(
      String(password),
      salt,
      storedBuffer.length
    );

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
  return createHash("sha256")
    .update(String(token))
    .digest("hex");
}

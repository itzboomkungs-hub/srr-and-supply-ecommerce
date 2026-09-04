import test from "node:test";
import assert from "node:assert/strict";
import { createHash, scryptSync } from "node:crypto";
import {
  createCompatiblePasswordHash,
  describePasswordHash,
  verifyStoredPassword,
} from "../lib/auth/password-compat.mjs";


test("legacy salt:hex scrypt verifies and can be replaced", () => {
  const salt = "00112233445566778899aabbccddeeff";
  const stored = salt + ":" + scryptSync("old-password", salt, 64).toString("hex");
  assert.equal(describePasswordHash(stored), "scrypt");
  assert.equal(verifyStoredPassword("old-password", stored), true);
  assert.equal(verifyStoredPassword("wrong", stored), false);
  const next = createCompatiblePasswordHash("new-password", stored);
  assert.equal(verifyStoredPassword("new-password", next), true);
});


test("prefixed scrypt format round trips", () => {
  const salt = "abc123";
  const stored = "scrypt:" + salt + ":" + scryptSync("hello-123", salt, 64).toString("hex");
  assert.equal(verifyStoredPassword("hello-123", stored), true);
  const next = createCompatiblePasswordHash("hello-456", stored);
  assert.equal(next.startsWith("scrypt:"), true);
  assert.equal(verifyStoredPassword("hello-456", next), true);
});


test("sha256 legacy format remains compatible", () => {
  const stored = createHash("sha256").update("abc12345").digest("hex");
  assert.equal(verifyStoredPassword("abc12345", stored), true);
  const next = createCompatiblePasswordHash("xyz12345", stored);
  assert.equal(verifyStoredPassword("xyz12345", next), true);
});


test("unsupported hashes are never overwritten", () => {
  assert.equal(describePasswordHash("not-a-known-format"), "unknown");
  assert.throws(() => createCompatiblePasswordHash("new-password", "not-a-known-format"));
});

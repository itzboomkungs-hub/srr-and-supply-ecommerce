import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken,
  normalizeEmail,
  normalizePhone,
} from '../lib/auth/crypto.mjs';

test('normalizes email and phone', () => {
  assert.equal(normalizeEmail('  Test@Example.COM '), 'test@example.com');
  assert.equal(normalizePhone('093-458-3742'), '0934583742');
});

test('password hash is not plaintext and verifies correctly', () => {
  const password = 'StrongPass123';
  const stored = hashPassword(password);
  assert.notEqual(stored, password);
  assert.equal(verifyPassword(password, stored), true);
  assert.equal(verifyPassword('wrong-password', stored), false);
});

test('session token stores a deterministic hash instead of raw token', () => {
  const token = createSessionToken();
  const hash1 = hashSessionToken(token);
  const hash2 = hashSessionToken(token);
  assert.notEqual(token, hash1);
  assert.equal(hash1, hash2);
  assert.match(hash1, /^[a-f0-9]{64}$/);
});

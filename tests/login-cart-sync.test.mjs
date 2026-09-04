import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/login/page.tsx', import.meta.url), 'utf8');

test('login page merges guest cart into member cart immediately after authentication', () => {
  assert.match(source, /const CART_OWNER_KEY\s*=\s*[\s\S]*?"srr-cart-owner"/);
  assert.match(source, /\/api\/cart\/sync/);
  assert.match(source, /mode:\s*"merge"/);
  assert.match(source, /syncCartAfterAuth/);
});

test('login page loads member cart when there is no guest cart', () => {
  assert.match(source, /fetch\([\s\S]*?"\/api\/cart"/);
});

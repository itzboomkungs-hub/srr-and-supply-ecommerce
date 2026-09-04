import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../components/layout/SiteHeader.tsx', import.meta.url),
  'utf8'
);

test('logout performs a full navigation after clearing browser cart state', () => {
  const logoutStart = source.indexOf('async function handleLogout()');
  assert.notEqual(logoutStart, -1, 'handleLogout must exist');

  const logoutSource = source.slice(logoutStart, source.indexOf('/* =====================================================\n     SEARCH', logoutStart));

  const removeCart = logoutSource.indexOf('window.localStorage.removeItem(\n        CART_KEY');
  const fullReload = logoutSource.indexOf('window.location.replace("/")');

  assert.notEqual(removeCart, -1, 'logout must clear the cart snapshot');
  assert.notEqual(fullReload, -1, 'logout must do a full navigation so parent cart state is remounted');
  assert.ok(fullReload > removeCart, 'full navigation must happen after local cart cleanup');
  assert.equal(logoutSource.includes('router.push("/")'), false, 'client-side push leaves stale parent cart state alive');
});

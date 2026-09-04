import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampQuantity,
  normalizeCartItems,
} from '../lib/cart/normalize.mjs';

test('clampQuantity caps quantity at stock', () => {
  assert.equal(clampQuantity(100, 32), 32);
  assert.equal(clampQuantity(5, 32), 5);
  assert.equal(clampQuantity(0, 32), 1);
  assert.equal(clampQuantity(3, 0), 0);
});

test('normalizeCartItems removes invalid items and combines duplicate product ids', () => {
  const items = normalizeCartItems([
    {
      product: {
        id: 1,
        name: 'O-Ring NBR M50',
        code: 'OR-NBR-M50',
        category: 'O-Ring',
        material: 'NBR',
        price: 32,
        stock: 10,
      },
      quantity: 3,
    },
    {
      product: {
        id: 1,
        name: 'O-Ring NBR M50',
        code: 'OR-NBR-M50',
        category: 'O-Ring',
        material: 'NBR',
        price: 32,
        stock: 10,
      },
      quantity: 9,
    },
    { product: { id: 'bad' }, quantity: 2 },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].product.id, 1);
  assert.equal(items[0].quantity, 10);
});

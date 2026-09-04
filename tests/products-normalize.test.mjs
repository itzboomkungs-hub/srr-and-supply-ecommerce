import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiProduct } from '../lib/products/product-normalize.mjs';

test('normalizes SQL API product into existing quick-view/cart shape', () => {
  const product = normalizeApiProduct({
    id: 4,
    name: 'O-Ring Viton',
    code: 'OR-VITON-M40',
    category: 'O-Ring',
    material: 'Viton',
    price: '65.50',
    stock: '32.75',
    image: null,
    active: 1,
  });
  assert.equal(product.id, 4);
  assert.equal(product.price, 65.5);
  assert.equal(product.stock, 32);
  assert.equal(product.reserved, 0);
  assert.equal(product.image, undefined);
});

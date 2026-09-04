import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAuthoritativeProduct } from '../lib/cart/cart-authoritative.mjs';

test('member cart uses current SQL stock and price instead of incoming snapshot', () => {
  const incoming = {
    product: { id: 4, name: 'old', code: 'OLD', category: '', material: '', price: 1, stock: 100 },
    quantity: 50,
  };
  const current = {
    id: 4,
    name: 'O-Ring Viton',
    code: 'OR-VITON-M40',
    category: 'O-Ring',
    material: 'Viton',
    price: 65,
    stock: 32,
  };
  const result = applyAuthoritativeProduct(incoming, current);
  assert.equal(result.quantity, 32);
  assert.equal(result.product.price, 65);
  assert.equal(result.product.stock, 32);
  assert.equal(result.product.name, 'O-Ring Viton');
});

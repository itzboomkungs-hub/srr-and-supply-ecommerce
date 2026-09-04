import test from 'node:test';
import assert from 'node:assert/strict';
import { mapFlowProductDetail } from '../lib/integrations/flowaccount-mapping.mjs';

const detail = {
  id: 210831,
  type: 5,
  name: 'FLOW O-RING NAME',
  code: 'OR-VITON-M40',
  categoryId: 55,
  categoryName: 'Flow Category',
  inventorySettings: { remainingStock: 32.75 },
  mainProductId: 999,
  mainUnitName: 'ชิ้น',
  productLists: [
    { id: 998, isMainProduct: false, sellPrice: 999, unitName: 'แพ็ค' },
    { id: 999, isMainProduct: true, sellPrice: 65.5, unitName: 'ชิ้น' },
  ],
};

test('maps main product price and inventory remaining stock', () => {
  const mapped = mapFlowProductDetail(detail);
  assert.equal(mapped.flowProductMasterId, 210831);
  assert.equal(mapped.code, 'OR-VITON-M40');
  assert.equal(mapped.flowName, 'FLOW O-RING NAME');
  assert.equal(mapped.flowMainProductId, 999);
  assert.equal(mapped.unitName, 'ชิ้น');
  assert.equal(mapped.flowSellPrice, 65.5);
  assert.equal(mapped.flowStock, 32.75);
});

test('blank code becomes null so multiple Flow products can coexist', () => {
  const mapped = mapFlowProductDetail({ ...detail, id: 2, code: '   ' });
  assert.equal(mapped.code, null);
});

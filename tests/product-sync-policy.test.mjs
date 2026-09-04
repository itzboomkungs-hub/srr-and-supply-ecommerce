import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProductSyncPatch, chooseIdentityMatch } from '../lib/integrations/sync-policy.mjs';

test('flow id match has precedence over code match', () => {
  const chosen = chooseIdentityMatch({ id: 1 }, { id: 2 });
  assert.deepEqual(chosen, { id: 1, matchedBy: 'flowId' });
});

test('existing website name is preserved while Flow-owned fields update', () => {
  const patch = buildProductSyncPatch(
    { websiteName: 'ชื่อหน้าเว็บของเรา', category: 'O-Ring', sellPrice: 50, stock: 10 },
    { flowName: 'FLOW NAME', flowCategoryName: 'FLOW CAT', flowSellPrice: 65, flowStock: 32, unitName: 'ชิ้น', flowType: 5 },
    { syncProducts: true, syncPrices: true, syncStock: true }
  );
  assert.equal(patch.websiteName, undefined);
  assert.equal(patch.flowName, 'FLOW NAME');
  assert.equal(patch.sellPrice, 65);
  assert.equal(patch.stock, 32);
});

test('price and stock remain local when corresponding sync toggles are off', () => {
  const patch = buildProductSyncPatch(
    { websiteName: 'Web', sellPrice: 50, stock: 10 },
    { flowName: 'Flow', flowSellPrice: 65, flowStock: 32, unitName: 'ชิ้น', flowType: 5 },
    { syncProducts: true, syncPrices: false, syncStock: false }
  );
  assert.equal(patch.sellPrice, undefined);
  assert.equal(patch.stock, undefined);
  assert.equal(patch.flowSellPrice, 65);
  assert.equal(patch.flowStock, 32);
});

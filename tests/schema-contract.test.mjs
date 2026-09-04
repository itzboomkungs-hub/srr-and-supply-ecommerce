import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sqlUrl = new URL('../database/srr_flowaccount_product_stock.sql', import.meta.url);

test('schema creates integration, product and sync log without destructive drops', async () => {
  const sql = await readFile(sqlUrl, 'utf8');
  for (const table of ['IntegrationSetting', 'Product', 'ProductSyncLog']) {
    assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS \`${table}\``));
  }
  assert.match(sql, /UNIQUE KEY `IntegrationSetting_provider_key` \(`provider`\)/);
  assert.match(sql, /UNIQUE KEY `Product_flowProductMasterId_key` \(`flowProductMasterId`\)/);
  assert.match(sql, /UNIQUE KEY `Product_code_key` \(`code`\)/);
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|DATABASE)\b/i);
});

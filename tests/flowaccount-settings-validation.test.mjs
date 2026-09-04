import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFlowAccountSettingsInput } from '../lib/integrations/flowaccount-settings-validation.mjs';

test('accepts valid sandbox settings and normalizes booleans', () => {
  const result = validateFlowAccountSettingsInput({
    environment: 'sandbox',
    clientId: ' client-123 ',
    clientSecret: ' secret ',
    syncProducts: true,
    syncPrices: false,
    syncStock: true,
  });
  assert.equal(result.environment, 'SANDBOX');
  assert.equal(result.clientId, 'client-123');
  assert.equal(result.clientSecret, 'secret');
  assert.equal(result.syncPrices, false);
});

test('rejects unknown environment', () => {
  assert.throws(() => validateFlowAccountSettingsInput({ environment: 'DEV', clientId: 'x' }), /environment/i);
});

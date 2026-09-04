import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptSettingSecret, decryptSettingSecret } from '../lib/integrations/settings-crypto.mjs';

const old = process.env.SRR_SETTINGS_ENCRYPTION_KEY;
process.env.SRR_SETTINGS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

test.after(() => {
  if (old === undefined) delete process.env.SRR_SETTINGS_ENCRYPTION_KEY;
  else process.env.SRR_SETTINGS_ENCRYPTION_KEY = old;
});

test('secret encryption round-trips and does not expose plaintext', () => {
  const encrypted = encryptSettingSecret('client-secret-123');
  assert.notEqual(encrypted, 'client-secret-123');
  assert.equal(decryptSettingSecret(encrypted), 'client-secret-123');
});

test('tampered encrypted secret is rejected', () => {
  const encrypted = encryptSettingSecret('abc');
  const tampered = encrypted.slice(0, -2) + 'xx';
  assert.throws(() => decryptSettingSecret(tampered));
});

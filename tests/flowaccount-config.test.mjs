import test from 'node:test';
import assert from 'node:assert/strict';
import { getFlowAccountBaseUrl } from '../lib/integrations/flowaccount-config.mjs';

test('uses official FlowAccount sandbox and production API bases', () => {
  assert.equal(getFlowAccountBaseUrl('SANDBOX'), 'https://openapi.flowaccount.com/test');
  assert.equal(getFlowAccountBaseUrl('PRODUCTION'), 'https://openapi.flowaccount.com/v1');
});

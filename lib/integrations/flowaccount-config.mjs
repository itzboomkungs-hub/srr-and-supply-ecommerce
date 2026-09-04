export function getFlowAccountBaseUrl(environment) {
  return environment === 'PRODUCTION'
    ? 'https://openapi.flowaccount.com/v1'
    : 'https://openapi.flowaccount.com/test';
}

export function validateFlowAccountSettingsInput(input) {
  const environment = String(input?.environment ?? 'SANDBOX')
    .trim()
    .toUpperCase();

  if (!['SANDBOX', 'PRODUCTION'].includes(environment)) {
    throw new Error('environment must be SANDBOX or PRODUCTION');
  }

  const clientId = String(input?.clientId ?? '').trim();
  const clientSecret = String(input?.clientSecret ?? '').trim();

  return {
    environment,
    clientId,
    clientSecret,
    syncProducts: input?.syncProducts !== false,
    syncPrices: input?.syncPrices !== false,
    syncStock: input?.syncStock !== false,
  };
}

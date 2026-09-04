export type ValidatedFlowAccountSettings = {
  environment: 'SANDBOX' | 'PRODUCTION';
  clientId: string;
  clientSecret: string;
  syncProducts: boolean;
  syncPrices: boolean;
  syncStock: boolean;
};
export function validateFlowAccountSettingsInput(input: unknown): ValidatedFlowAccountSettings;

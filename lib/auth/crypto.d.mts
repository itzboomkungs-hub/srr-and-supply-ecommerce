export const SESSION_COOKIE_NAME: string;
export function hashSessionToken(rawToken: string): string;
export function createSessionToken(): string;
export function normalizeEmail(value: string): string;
export function normalizePhone(value: string): string;
export function verifyPassword(password: string, storedHash: string): boolean;
export function hashPassword(password: string): string;

export function describePasswordHash(storedHash: string): string;
export function verifyStoredPassword(password: string, storedHash: string): boolean;
export function createCompatiblePasswordHash(password: string, storedHash: string): string;

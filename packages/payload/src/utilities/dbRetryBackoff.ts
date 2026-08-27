/**
 * payloadcms/payload - db-connection-retry-backoff
 */
export function getDbRetryDelay(attempt: number): number { return Math.min(10000, 500 * (2 ** attempt)); }

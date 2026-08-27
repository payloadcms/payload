/**
 * payloadcms/payload - file-upload-quota-checker
 */
export function isQuotaExceeded(usedBytes: number, newBytes: number, maxQuota: number): boolean { return (usedBytes + newBytes) > maxQuota; }

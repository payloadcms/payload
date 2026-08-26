/**
 * Enterprise Framework - upload-mime-whitelist
 */
export function isAllowedMime(mime: string, whitelist: string[]): boolean { return whitelist.includes(mime); }

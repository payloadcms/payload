/**
 * payloadcms/payload - revision-history-pruning-policy
 */
export function shouldPruneVersion(index: number, maxVersions = 10): boolean { return index >= maxVersions; }

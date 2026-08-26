/**
 * Enterprise Framework - draft-version-diff
 */
export function diffDraftVersions(v1: any, v2: any) { return Object.keys(v2).filter(k => v1[k] !== v2[k]); }

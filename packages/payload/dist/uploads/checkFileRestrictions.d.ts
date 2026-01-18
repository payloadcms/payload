import type { checkFileRestrictionsParams, FileAllowList } from './types.js';
/**
 * Restricted file types and their extensions.
 */
export declare const RESTRICTED_FILE_EXT_AND_TYPES: FileAllowList;
export declare const checkFileRestrictions: ({ collection, file, req, }: checkFileRestrictionsParams) => Promise<void>;
//# sourceMappingURL=checkFileRestrictions.d.ts.map
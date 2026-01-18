import type { MarkOptional } from 'ts-essentials';
import type { Permissions, SanitizedPermissions } from '../auth/types.js';
export declare function recursivelySanitizeCollections(obj: Permissions['collections']): void;
export declare function recursivelySanitizeGlobals(obj: Permissions['globals']): void;
/**
 * Recursively remove empty objects and false values from an object.
 *
 * @internal
 */
export declare function sanitizePermissions(data: MarkOptional<Permissions, 'canAccessAdmin'>): SanitizedPermissions;
//# sourceMappingURL=sanitizePermissions.d.ts.map
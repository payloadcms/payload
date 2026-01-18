import type { DrizzleAdapter } from './types.js';
/**
 * Drop the current database and run all migrate up functions
 */
export declare function migrateFresh(this: DrizzleAdapter, { forceAcceptWarning }: {
    forceAcceptWarning?: boolean;
}): Promise<void>;
//# sourceMappingURL=migrateFresh.d.ts.map
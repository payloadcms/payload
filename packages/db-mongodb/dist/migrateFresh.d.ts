import type { MongooseAdapter } from './index.js';
/**
 * Drop the current database and run all migrate up functions
 */
export declare function migrateFresh(this: MongooseAdapter, { forceAcceptWarning }: {
    forceAcceptWarning?: boolean;
}): Promise<void>;
//# sourceMappingURL=migrateFresh.d.ts.map
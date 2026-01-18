import type { Column, SQL } from 'drizzle-orm';
import type { DrizzleAdapter } from '../types.js';
export declare function jsonAgg(adapter: DrizzleAdapter, expression: SQL): SQL<unknown>;
/**
 * @param shape Potential for SQL injections, so you shouldn't allow user-specified key names
 */
export declare function jsonBuildObject<T extends Record<string, Column | SQL>>(adapter: DrizzleAdapter, shape: T): SQL<unknown>;
export declare const jsonAggBuildObject: <T extends Record<string, Column | SQL>>(adapter: DrizzleAdapter, shape: T) => SQL<unknown>;
//# sourceMappingURL=json.d.ts.map
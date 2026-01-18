import type { CreateGlobalArgs } from 'payload';
import type { DrizzleAdapter } from './types.js';
export declare function createGlobal<T extends Record<string, unknown>>(this: DrizzleAdapter, { slug, data, req, returning }: CreateGlobalArgs): Promise<T>;
//# sourceMappingURL=createGlobal.d.ts.map
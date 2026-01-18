import type { JsonObject, TypeWithVersion, UpdateVersionArgs } from 'payload';
import type { DrizzleAdapter } from './types.js';
export declare function updateVersion<T extends JsonObject = JsonObject>(this: DrizzleAdapter, { id, collection, locale, req, returning, select, versionData, where: whereArg, }: UpdateVersionArgs<T>): Promise<TypeWithVersion<T>>;
//# sourceMappingURL=updateVersion.d.ts.map
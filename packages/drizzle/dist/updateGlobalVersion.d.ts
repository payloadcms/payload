import type { JsonObject, TypeWithVersion, UpdateGlobalVersionArgs } from 'payload';
import type { DrizzleAdapter } from './types.js';
export declare function updateGlobalVersion<T extends JsonObject = JsonObject>(this: DrizzleAdapter, { id, global, locale, req, returning, select, versionData, where: whereArg, }: UpdateGlobalVersionArgs<T>): Promise<TypeWithVersion<T>>;
//# sourceMappingURL=updateGlobalVersion.d.ts.map
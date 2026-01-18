import type { CreateGlobalVersionArgs, JsonObject, TypeWithVersion } from 'payload';
import type { DrizzleAdapter } from './types.js';
export declare function createGlobalVersion<T extends JsonObject = JsonObject>(this: DrizzleAdapter, { autosave, createdAt, globalSlug, publishedLocale, req, returning, select, snapshot, updatedAt, versionData, }: CreateGlobalVersionArgs): Promise<TypeWithVersion<T>>;
//# sourceMappingURL=createGlobalVersion.d.ts.map
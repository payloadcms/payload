import type { CreateVersionArgs, JsonObject, TypeWithVersion } from 'payload';
import type { DrizzleAdapter } from './types.js';
export declare function createVersion<T extends JsonObject = JsonObject>(this: DrizzleAdapter, { autosave, collectionSlug, createdAt, parent, publishedLocale, req, returning, select, snapshot, updatedAt, versionData, }: CreateVersionArgs<T>): Promise<TypeWithVersion<T>>;
//# sourceMappingURL=createVersion.d.ts.map
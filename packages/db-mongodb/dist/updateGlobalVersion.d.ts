import type { JsonObject, UpdateGlobalVersionArgs } from 'payload';
import type { MongooseAdapter } from './index.js';
export declare function updateGlobalVersion<T extends JsonObject = JsonObject>(this: MongooseAdapter, { id, global: globalSlug, locale, options: optionsArgs, req, returning, select, versionData, where, }: UpdateGlobalVersionArgs<T>): Promise<any>;
//# sourceMappingURL=updateGlobalVersion.d.ts.map
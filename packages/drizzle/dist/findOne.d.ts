import type { FindOneArgs, TypeWithID } from 'payload';
import type { DrizzleAdapter } from './types.js';
export declare function findOne<T extends TypeWithID>(this: DrizzleAdapter, { collection, draftsEnabled, joins, locale, req, select, where }: FindOneArgs): Promise<null | T>;
//# sourceMappingURL=findOne.d.ts.map
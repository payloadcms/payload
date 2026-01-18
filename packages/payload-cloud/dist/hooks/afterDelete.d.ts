import type { CollectionAfterDeleteHook, CollectionConfig, FileData, TypeWithID } from 'payload';
import type { TypeWithPrefix } from '../types.js';
interface Args {
    collection: CollectionConfig;
}
export declare const getAfterDeleteHook: ({ collection, }: Args) => CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix>;
export {};
//# sourceMappingURL=afterDelete.d.ts.map
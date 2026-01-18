import type { CollectionAfterDeleteHook, CollectionConfig, FileData, TypeWithID } from 'payload';
import type { GeneratedAdapter, TypeWithPrefix } from '../types.js';
interface Args {
    adapter: GeneratedAdapter;
    collection: CollectionConfig;
}
export declare const getAfterDeleteHook: ({ adapter, collection, }: Args) => CollectionAfterDeleteHook<FileData & TypeWithID & TypeWithPrefix>;
export {};
//# sourceMappingURL=afterDelete.d.ts.map
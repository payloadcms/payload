import type { CollectionAfterChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload';
import type { GeneratedAdapter } from '../types.js';
interface Args {
    adapter: GeneratedAdapter;
    collection: CollectionConfig;
}
export declare const getAfterChangeHook: ({ adapter, collection }: Args) => CollectionAfterChangeHook<FileData & TypeWithID>;
export {};
//# sourceMappingURL=afterChange.d.ts.map
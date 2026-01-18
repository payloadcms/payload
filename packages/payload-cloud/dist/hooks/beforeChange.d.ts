import type { CollectionBeforeChangeHook, CollectionConfig, FileData, TypeWithID } from 'payload';
interface Args {
    collection: CollectionConfig;
}
export declare const getBeforeChangeHook: ({ collection }: Args) => CollectionBeforeChangeHook<FileData & TypeWithID>;
export {};
//# sourceMappingURL=beforeChange.d.ts.map
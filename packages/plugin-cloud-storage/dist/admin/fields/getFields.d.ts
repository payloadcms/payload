import type { CollectionConfig, Field } from 'payload';
interface Args {
    /**
     * When true, always insert the prefix field regardless of whether a prefix is configured.
     */
    alwaysInsertFields?: boolean;
    collection: CollectionConfig;
    prefix?: string;
}
export declare const getFields: ({ alwaysInsertFields, collection, prefix }: Args) => Field[];
export {};
//# sourceMappingURL=getFields.d.ts.map
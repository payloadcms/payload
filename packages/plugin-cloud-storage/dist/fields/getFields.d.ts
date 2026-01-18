import type { CollectionConfig, Field } from 'payload';
import type { GeneratedAdapter, GenerateFileURL } from '../types.js';
interface Args {
    adapter?: GeneratedAdapter;
    /**
     * When true, always insert the prefix field regardless of whether a prefix is configured.
     */
    alwaysInsertFields?: boolean;
    collection: CollectionConfig;
    disablePayloadAccessControl?: true;
    generateFileURL?: GenerateFileURL;
    prefix?: string;
}
export declare const getFields: ({ adapter, alwaysInsertFields, collection, disablePayloadAccessControl, generateFileURL, prefix, }: Args) => Field[];
export {};
//# sourceMappingURL=getFields.d.ts.map
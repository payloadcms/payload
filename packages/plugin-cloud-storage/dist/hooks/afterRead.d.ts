import type { CollectionConfig, FieldHook, ImageSize } from 'payload';
import type { GeneratedAdapter, GenerateFileURL } from '../types.js';
interface Args {
    adapter: GeneratedAdapter;
    collection: CollectionConfig;
    disablePayloadAccessControl?: boolean;
    generateFileURL?: GenerateFileURL;
    size?: ImageSize;
}
export declare const getAfterReadHook: ({ adapter, collection, disablePayloadAccessControl, generateFileURL, size }: Args) => FieldHook;
export {};
//# sourceMappingURL=afterRead.d.ts.map
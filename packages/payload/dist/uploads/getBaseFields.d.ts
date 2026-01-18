import type { CollectionConfig } from '../collections/config/types.js';
import type { Config } from '../config/types.js';
import type { Field } from '../fields/config/types.js';
type Options = {
    collection: CollectionConfig;
    config: Config;
};
export declare const getBaseUploadFields: ({ collection, config }: Options) => Field[];
export {};
//# sourceMappingURL=getBaseFields.d.ts.map
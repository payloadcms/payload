import type { CollectionConfig } from '../collections/config/types.js';
import type { PayloadRequest } from '../types/index.js';
export declare const getFieldsToSign: (args: {
    collectionConfig: CollectionConfig;
    email: string;
    sid?: string;
    user: PayloadRequest["user"];
}) => Record<string, unknown>;
//# sourceMappingURL=getFieldsToSign.d.ts.map
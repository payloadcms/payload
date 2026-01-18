import type { PayloadRequest } from '../types/index.js';
import { type Payload } from '../index.js';
type Args = {
    id?: number | string;
    payload: Payload;
    req?: PayloadRequest;
    slug: string;
};
export declare const deleteCollectionVersions: ({ id, slug, payload, req }: Args) => Promise<void>;
export {};
//# sourceMappingURL=deleteCollectionVersions.d.ts.map
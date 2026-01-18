import type { Collection, TypeWithID } from '../collections/config/types.js';
import type { PayloadRequest } from '../types/index.js';
export declare const checkFileAccess: ({ collection, filename, req, }: {
    collection: Collection;
    filename: string;
    req: PayloadRequest;
}) => Promise<TypeWithID | undefined>;
//# sourceMappingURL=checkFileAccess.d.ts.map
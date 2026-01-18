import type { AuthOperationsFromCollectionSlug, Collection } from '../../collections/config/types.js';
import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest } from '../../types/index.js';
export type Arguments<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: AuthOperationsFromCollectionSlug<TSlug>['unlock'];
    overrideAccess?: boolean;
    req: PayloadRequest;
};
export declare const unlockOperation: <TSlug extends CollectionSlug>(args: Arguments<TSlug>) => Promise<boolean>;
//# sourceMappingURL=unlock.d.ts.map
import type { AuthOperationsFromCollectionSlug, Collection, DataFromCollectionSlug, RequiredDataFromCollectionSlug } from '../../collections/config/types.js';
import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest } from '../../types/index.js';
export type Arguments<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: AuthOperationsFromCollectionSlug<TSlug>['registerFirstUser'] & RequiredDataFromCollectionSlug<TSlug>;
    req: PayloadRequest;
};
export type Result<TData> = {
    exp?: number;
    token?: string;
    user?: TData;
};
export declare const registerFirstUserOperation: <TSlug extends CollectionSlug>(args: Arguments<TSlug>) => Promise<Result<DataFromCollectionSlug<TSlug>>>;
//# sourceMappingURL=registerFirstUser.d.ts.map
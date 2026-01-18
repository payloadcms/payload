import type { AuthOperationsFromCollectionSlug, Collection } from '../../collections/config/types.js';
import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest } from '../../types/index.js';
export type Arguments<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: {
        [key: string]: unknown;
    } & AuthOperationsFromCollectionSlug<TSlug>['forgotPassword'];
    disableEmail?: boolean;
    expiration?: number;
    req: PayloadRequest;
};
export type Result = string;
export declare const forgotPasswordOperation: <TSlug extends CollectionSlug>(incomingArgs: Arguments<TSlug>) => Promise<null | string>;
//# sourceMappingURL=forgotPassword.d.ts.map
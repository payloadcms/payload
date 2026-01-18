import type { RequiredDataFromCollectionSlug } from '../collections/config/types.js';
import type { AuthCollection, CollectionSlug, PayloadRequest } from '../index.js';
type ValidateUsernameOrEmailArgs<TSlug extends CollectionSlug> = {
    authOptions: AuthCollection['config']['auth'];
    collectionSlug: string;
    data: RequiredDataFromCollectionSlug<TSlug>;
    req: PayloadRequest;
} & ({
    operation: 'create';
    originalDoc?: never;
} | {
    operation: 'update';
    originalDoc: RequiredDataFromCollectionSlug<TSlug>;
});
export declare const ensureUsernameOrEmail: <TSlug extends CollectionSlug>({ authOptions: { disableLocalStrategy, loginWithUsername }, collectionSlug, data, operation, originalDoc, req, }: ValidateUsernameOrEmailArgs<TSlug>) => void;
export {};
//# sourceMappingURL=ensureUsernameOrEmail.d.ts.map
import type { AuthOperationsFromCollectionSlug, Collection, DataFromCollectionSlug } from '../../collections/config/types.js';
import type { CollectionSlug, TypedUser } from '../../index.js';
import type { PayloadRequest } from '../../types/index.js';
export type Result = {
    exp?: number;
    token?: string;
    user?: TypedUser;
};
export type Arguments<TSlug extends CollectionSlug> = {
    collection: Collection;
    data: AuthOperationsFromCollectionSlug<TSlug>['login'];
    depth?: number;
    overrideAccess?: boolean;
    req: PayloadRequest;
    showHiddenFields?: boolean;
};
type CheckLoginPermissionArgs = {
    loggingInWithUsername?: boolean;
    req: PayloadRequest;
    user: any;
};
/**
 * Throws an error if the user is locked or does not exist.
 * This does not check the login attempts, only the lock status. Whoever increments login attempts
 * is responsible for locking the user properly, not whoever checks the login permission.
 */
export declare const checkLoginPermission: ({ loggingInWithUsername, req, user, }: CheckLoginPermissionArgs) => void;
export declare const loginOperation: <TSlug extends CollectionSlug>(incomingArgs: Arguments<TSlug>) => Promise<{
    user: DataFromCollectionSlug<TSlug>;
} & Result>;
export {};
//# sourceMappingURL=login.d.ts.map
import type { AuthCollectionSlug, PayloadTypesShape } from 'payload';
import type { PayloadSDK } from '../index.js';
import type { DataFromAuthSlug } from '../types.js';
export type ResetPasswordOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
    collection: TSlug;
    data: {
        password: string;
        token: string;
    };
};
export type ResetPasswordResult<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
    token?: string;
    user: DataFromAuthSlug<T, TSlug>;
};
export declare function resetPassword<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(sdk: PayloadSDK<T>, options: ResetPasswordOptions<T, TSlug>, init?: RequestInit): Promise<ResetPasswordResult<T, TSlug>>;
//# sourceMappingURL=resetPassword.d.ts.map
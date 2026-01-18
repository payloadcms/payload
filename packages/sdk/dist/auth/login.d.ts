import type { AuthCollectionSlug, PayloadTypesShape } from 'payload';
import type { PayloadSDK } from '../index.js';
import type { DataFromAuthSlug } from '../types.js';
export type LoginOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
    collection: TSlug;
    data: {
        email: string;
        password: string;
    };
};
export type LoginResult<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
    exp?: number;
    message: string;
    token?: string;
    user: DataFromAuthSlug<T, TSlug>;
};
export declare function login<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(sdk: PayloadSDK<T>, options: LoginOptions<T, TSlug>, init?: RequestInit): Promise<LoginResult<T, TSlug>>;
//# sourceMappingURL=login.d.ts.map
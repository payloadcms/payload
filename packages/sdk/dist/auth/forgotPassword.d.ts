import type { AuthCollectionSlug, PayloadTypesShape } from 'payload';
import type { PayloadSDK } from '../index.js';
export type ForgotPasswordOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
    collection: TSlug;
    data: {
        disableEmail?: boolean;
        email: string;
        expiration?: number;
    };
};
export declare function forgotPassword<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(sdk: PayloadSDK<T>, options: ForgotPasswordOptions<T, TSlug>, init?: RequestInit): Promise<{
    message: string;
}>;
//# sourceMappingURL=forgotPassword.d.ts.map
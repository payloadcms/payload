import type { AuthCollectionSlug, PayloadTypesShape } from 'payload';
import type { PayloadSDK } from '../index.js';
export type VerifyEmailOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
    collection: TSlug;
    token: string;
};
export declare function verifyEmail<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(sdk: PayloadSDK<T>, options: VerifyEmailOptions<T, TSlug>, init?: RequestInit): Promise<{
    message: string;
}>;
//# sourceMappingURL=verifyEmail.d.ts.map
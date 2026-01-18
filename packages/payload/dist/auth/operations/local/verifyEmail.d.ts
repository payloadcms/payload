import type { CollectionSlug, Payload, RequestContext } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
export type Options<T extends CollectionSlug> = {
    collection: T;
    context?: RequestContext;
    req?: Partial<PayloadRequest>;
    token: string;
};
export declare function verifyEmailLocal<T extends CollectionSlug>(payload: Payload, options: Options<T>): Promise<boolean>;
//# sourceMappingURL=verifyEmail.d.ts.map
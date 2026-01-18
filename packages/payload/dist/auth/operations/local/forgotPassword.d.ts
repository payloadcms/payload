import type { CollectionSlug, Payload, RequestContext } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
import type { Result } from '../forgotPassword.js';
export type Options<T extends CollectionSlug> = {
    collection: T;
    context?: RequestContext;
    data: {
        email: string;
    };
    disableEmail?: boolean;
    expiration?: number;
    req?: Partial<PayloadRequest>;
};
export declare function forgotPasswordLocal<T extends CollectionSlug>(payload: Payload, options: Options<T>): Promise<Result>;
//# sourceMappingURL=forgotPassword.d.ts.map
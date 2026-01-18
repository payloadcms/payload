import type { AuthOperationsFromCollectionSlug, CollectionSlug, DataFromCollectionSlug, Payload, RequestContext } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
import type { Result } from '../login.js';
export type Options<TSlug extends CollectionSlug> = {
    collection: TSlug;
    context?: RequestContext;
    data: AuthOperationsFromCollectionSlug<TSlug>['login'];
    depth?: number;
    fallbackLocale?: string;
    locale?: string;
    overrideAccess?: boolean;
    req?: Partial<PayloadRequest>;
    showHiddenFields?: boolean;
    trash?: boolean;
};
export declare function loginLocal<TSlug extends CollectionSlug>(payload: Payload, options: Options<TSlug>): Promise<{
    user: DataFromCollectionSlug<TSlug>;
} & Result>;
//# sourceMappingURL=login.d.ts.map
import type { Payload, RequestContext, TypedLocale, TypedUser } from '../index.js';
import type { PayloadRequest } from '../types/index.js';
export type CreateLocalReqOptions = {
    context?: RequestContext;
    fallbackLocale?: false | TypedLocale;
    locale?: string;
    req?: Partial<PayloadRequest>;
    urlSuffix?: string;
    user?: TypedUser;
};
type CreateLocalReq = (options: CreateLocalReqOptions, payload: Payload) => Promise<PayloadRequest>;
export declare const createLocalReq: CreateLocalReq;
export {};
//# sourceMappingURL=createLocalReq.d.ts.map
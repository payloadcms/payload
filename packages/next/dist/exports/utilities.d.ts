export { getNextRequestI18n } from '../utilities/getNextRequestI18n.js';
export { getPayloadHMR } from '../utilities/getPayloadHMR.js';
import { addLocalesToRequestFromData as _addLocalesToRequestFromData } from 'payload';
/**
 * Use:
 * ```ts
 * import { mergeHeaders } from 'payload'
 * ```
 * @deprecated
 */
export declare const mergeHeaders: (sourceHeaders: Headers, destinationHeaders: Headers) => Headers;
/**
 * @deprecated
 * Use:
 * ```ts
 * import { headersWithCors } from 'payload'
 * ```
 */
export declare const headersWithCors: ({ headers, req }: {
    headers: Headers;
    req: Partial<import("payload").PayloadRequest>;
}) => Headers;
/**
 * @deprecated
 * Use:
 * ```ts
 * import { createPayloadRequest } from 'payload'
 * ```
 */
export declare const createPayloadRequest: ({ canSetHeaders, config: configPromise, params, payloadInstanceCacheKey, request, }: {
    canSetHeaders?: boolean;
    config: Promise<import("payload").SanitizedConfig> | import("payload").SanitizedConfig;
    params?: {
        collection: string;
    };
    payloadInstanceCacheKey?: string;
    request: Request;
}) => Promise<import("payload").PayloadRequest>;
/**
 * @deprecated
 * Use:
 * ```ts
 * import { addDataAndFileToRequest } from 'payload'
 * ```
 */
export declare const addDataAndFileToRequest: (req: import("payload").PayloadRequest) => Promise<void>;
/**
 * @deprecated
 * Use:
 * ```ts
 * import { sanitizeLocales } from 'payload'
 * ```
 */
export declare const sanitizeLocales: ({ fallbackLocale, locale, localization, }: {
    fallbackLocale: import("payload").TypedFallbackLocale;
    locale: string;
    localization: import("payload").SanitizedConfig["localization"];
}) => {
    fallbackLocale?: import("payload").TypedFallbackLocale;
    locale?: string;
};
/**
 * @deprecated
 * Use:
 * ```ts
 * import { addLocalesToRequestFromData } from 'payload'
 * ```
 */
export declare const addLocalesToRequestFromData: typeof _addLocalesToRequestFromData;
//# sourceMappingURL=utilities.d.ts.map
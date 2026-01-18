import type { AcceptedLanguages } from '@payloadcms/translations';
import type { ImportMap, Locale, PayloadRequest, SanitizedConfig, SanitizedPermissions } from 'payload';
import { headers as getHeaders } from 'next/headers.js';
import { createLocalReq } from 'payload';
type Result = {
    cookies: Map<string, string>;
    headers: Awaited<ReturnType<typeof getHeaders>>;
    languageCode: AcceptedLanguages;
    locale?: Locale;
    permissions: SanitizedPermissions;
    req: PayloadRequest;
};
/**
 * Initializes a full request object, including the `req` object and access control.
 * As access control and getting the request locale is dependent on the current URL and
 */
export declare const initReq: ({ canSetHeaders, configPromise, importMap, key, overrides, }: {
    canSetHeaders?: boolean;
    configPromise: Promise<SanitizedConfig> | SanitizedConfig;
    importMap: ImportMap;
    key: string;
    overrides?: Parameters<typeof createLocalReq>[0];
}) => Promise<Result>;
export {};
//# sourceMappingURL=initReq.d.ts.map
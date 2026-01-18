import type { AcceptedLanguages } from '@payloadcms/translations';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js';
import type { SanitizedConfig } from '../config/types.js';
type GetRequestLanguageArgs = {
    config: SanitizedConfig;
    cookies: Map<string, string> | ReadonlyRequestCookies;
    defaultLanguage?: AcceptedLanguages;
    headers: Request['headers'];
};
export declare const getRequestLanguage: ({ config, cookies, headers, }: GetRequestLanguageArgs) => AcceptedLanguages;
export {};
//# sourceMappingURL=getRequestLanguage.d.ts.map
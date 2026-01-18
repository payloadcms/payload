import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js';
import type { SanitizedConfig } from 'payload';
import { type Theme } from '@payloadcms/ui';
type GetRequestLanguageArgs = {
    config: SanitizedConfig;
    cookies: Map<string, string> | ReadonlyRequestCookies;
    headers: Request['headers'];
};
export declare const getRequestTheme: ({ config, cookies, headers }: GetRequestLanguageArgs) => Theme;
export {};
//# sourceMappingURL=getRequestTheme.d.ts.map
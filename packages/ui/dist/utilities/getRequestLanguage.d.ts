import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js';
type GetRequestLanguageArgs = {
    cookies: Map<string, string> | ReadonlyRequestCookies;
    defaultLanguage?: string;
    headers: Request['headers'];
};
export declare const getRequestLanguage: ({ cookies, defaultLanguage, headers, }: GetRequestLanguageArgs) => string;
export {};
//# sourceMappingURL=getRequestLanguage.d.ts.map
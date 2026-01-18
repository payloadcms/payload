import type { SanitizedCollectionConfig } from './../collections/config/types.js';
type CookieOptions = {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    name: string;
    path?: string;
    returnCookieAsObject: boolean;
    sameSite?: 'Lax' | 'None' | 'Strict';
    secure?: boolean;
    value?: string;
};
type CookieObject = {
    domain?: string;
    expires?: string;
    httpOnly?: boolean;
    maxAge?: number;
    name: string;
    path?: string;
    sameSite?: 'Lax' | 'None' | 'Strict';
    secure?: boolean;
    value: string | undefined;
};
export declare const generateCookie: <ReturnCookieAsObject = boolean>(args: CookieOptions) => ReturnCookieAsObject extends true ? CookieObject : string;
type GetCookieExpirationArgs = {
    seconds: number;
};
export declare const getCookieExpiration: ({ seconds }: GetCookieExpirationArgs) => Date;
type GeneratePayloadCookieArgs = {
    collectionAuthConfig: SanitizedCollectionConfig['auth'];
    cookiePrefix: string;
    returnCookieAsObject?: boolean;
    token: string;
};
export declare const generatePayloadCookie: <T extends GeneratePayloadCookieArgs>({ collectionAuthConfig, cookiePrefix, returnCookieAsObject, token, }: T) => T["returnCookieAsObject"] extends true ? CookieObject : string;
export declare const generateExpiredPayloadCookie: <T extends Omit<GeneratePayloadCookieArgs, "token">>({ collectionAuthConfig, cookiePrefix, returnCookieAsObject, }: T) => T["returnCookieAsObject"] extends true ? CookieObject : string;
export declare function parseCookies(headers: Request['headers']): Map<string, string>;
export {};
//# sourceMappingURL=cookies.d.ts.map
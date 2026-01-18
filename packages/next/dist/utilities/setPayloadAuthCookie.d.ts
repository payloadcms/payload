import type { Auth } from 'payload';
type SetPayloadAuthCookieArgs = {
    authConfig: Auth;
    cookiePrefix: string;
    token: string;
};
export declare function setPayloadAuthCookie({ authConfig, cookiePrefix, token, }: SetPayloadAuthCookieArgs): Promise<void>;
export {};
//# sourceMappingURL=setPayloadAuthCookie.d.ts.map
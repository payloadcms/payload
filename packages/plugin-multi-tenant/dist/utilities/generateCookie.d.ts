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
export {};
//# sourceMappingURL=generateCookie.d.ts.map
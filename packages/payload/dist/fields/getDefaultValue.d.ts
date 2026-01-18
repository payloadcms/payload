import type { DefaultValue, JsonValue, PayloadRequest } from '../types/index.js';
type Args = {
    defaultValue: DefaultValue;
    locale: string | undefined;
    req: PayloadRequest;
    user: PayloadRequest['user'];
    value?: JsonValue;
};
export declare const getDefaultValue: ({ defaultValue, locale, req, user, value, }: Args) => Promise<JsonValue>;
export {};
//# sourceMappingURL=getDefaultValue.d.ts.map
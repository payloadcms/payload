import type { Payload } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
export type AdminInitEvent = {
    domainID?: string;
    type: 'admin-init';
    userID?: string;
};
type Args = {
    headers: Request['headers'];
    payload: Payload;
    user: PayloadRequest['user'];
};
export declare const adminInit: ({ headers, payload, user }: Args) => void;
export {};
//# sourceMappingURL=adminInit.d.ts.map
import type { Collection } from '../collections/config/types.js';
import type { SanitizedConfig } from '../config/types.js';
import type { PayloadRequest } from '../types/index.js';
import { APIError } from '../errors/APIError.js';
export declare const routeError: ({ collection, config: configArg, err, req: incomingReq, }: {
    collection?: Collection;
    config: Promise<SanitizedConfig> | SanitizedConfig;
    err: APIError;
    req: PayloadRequest | Request;
}) => Promise<Response>;
//# sourceMappingURL=routeError.d.ts.map
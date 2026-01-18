import type { Collection } from '../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../globals/config/types.js';
import type { PayloadRequest } from '../types/index.js';
export declare const getRequestCollection: (req: PayloadRequest) => Collection;
export declare const getRequestCollectionWithID: <T extends boolean>(req: PayloadRequest, { disableSanitize, optionalID, }?: {
    disableSanitize?: T;
    optionalID?: boolean;
}) => {
    collection: Collection;
    id: T extends true ? string : number | string;
};
export declare const getRequestGlobal: (req: PayloadRequest) => SanitizedGlobalConfig;
//# sourceMappingURL=getRequestEntity.d.ts.map
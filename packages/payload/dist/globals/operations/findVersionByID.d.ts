import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js';
import type { TypeWithVersion } from '../../versions/types.js';
import type { SanitizedGlobalConfig } from '../config/types.js';
export type Arguments = {
    currentDepth?: number;
    depth?: number;
    disableErrors?: boolean;
    globalConfig: SanitizedGlobalConfig;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
};
export declare const findVersionByIDOperation: <T extends TypeWithVersion<T> = any>(args: Arguments) => Promise<T>;
//# sourceMappingURL=findVersionByID.d.ts.map
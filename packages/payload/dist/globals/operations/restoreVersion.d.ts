import type { PayloadRequest, PopulateType } from '../../types/index.js';
import type { TypeWithVersion } from '../../versions/types.js';
import type { SanitizedGlobalConfig } from '../config/types.js';
export type Arguments = {
    depth?: number;
    draft?: boolean;
    globalConfig: SanitizedGlobalConfig;
    id: number | string;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    showHiddenFields?: boolean;
};
export declare const restoreVersionOperation: <T extends TypeWithVersion<T> = any>(args: Arguments) => Promise<T>;
//# sourceMappingURL=restoreVersion.d.ts.map
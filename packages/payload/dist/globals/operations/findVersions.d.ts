import type { PaginatedDocs } from '../../database/types.js';
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js';
import type { TypeWithVersion } from '../../versions/types.js';
import type { SanitizedGlobalConfig } from '../config/types.js';
export type Arguments = {
    depth?: number;
    globalConfig: SanitizedGlobalConfig;
    limit?: number;
    overrideAccess?: boolean;
    page?: number;
    pagination?: boolean;
    populate?: PopulateType;
    req?: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    sort?: Sort;
    where?: Where;
};
export declare const findVersionsOperation: <T extends TypeWithVersion<T>>(args: Arguments) => Promise<PaginatedDocs<T>>;
//# sourceMappingURL=findVersions.d.ts.map
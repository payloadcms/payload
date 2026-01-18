import type { JsonObject, PayloadRequest, PopulateType, SelectType } from '../../types/index.js';
import type { SanitizedGlobalConfig } from '../config/types.js';
import { type AfterReadArgs } from '../../fields/hooks/afterRead/index.js';
export type GlobalFindOneArgs = {
    /**
     * You may pass the document data directly which will skip the `db.findOne` database query.
     * This is useful if you want to use this endpoint solely for running hooks and populating data.
     */
    data?: Record<string, unknown>;
    depth?: number;
    draft?: boolean;
    globalConfig: SanitizedGlobalConfig;
    includeLockStatus?: boolean;
    overrideAccess?: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    slug: string;
} & Pick<AfterReadArgs<JsonObject>, 'flattenLocales'>;
export declare const findOneOperation: <T extends Record<string, unknown>>(args: GlobalFindOneArgs) => Promise<T>;
//# sourceMappingURL=findOne.d.ts.map
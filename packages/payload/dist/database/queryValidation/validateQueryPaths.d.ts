import type { SanitizedCollectionConfig } from '../../collections/config/types.js';
import type { FlattenedField } from '../../fields/config/types.js';
import type { SanitizedGlobalConfig } from '../../globals/config/types.js';
import type { PayloadRequest, Where } from '../../types/index.js';
import type { EntityPolicies } from './types.js';
type Args = {
    errors?: {
        path: string;
    }[];
    overrideAccess: boolean;
    policies?: EntityPolicies;
    polymorphicJoin?: boolean;
    req: PayloadRequest;
    versionFields?: FlattenedField[];
    where: Where;
} & ({
    collectionConfig: SanitizedCollectionConfig;
    globalConfig?: never | undefined;
} | {
    collectionConfig?: never | undefined;
    globalConfig: SanitizedGlobalConfig;
});
export declare function validateQueryPaths({ collectionConfig, errors, globalConfig, overrideAccess, policies, polymorphicJoin, req, versionFields, where, }: Args): Promise<void>;
export {};
//# sourceMappingURL=validateQueryPaths.d.ts.map
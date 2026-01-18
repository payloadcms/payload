import type { SanitizedCollectionConfig } from '../../collections/config/types.js';
import type { FlattenedField } from '../../fields/config/types.js';
import type { SanitizedGlobalConfig } from '../../globals/config/types.js';
import type { PayloadRequest, WhereField } from '../../types/index.js';
import type { EntityPolicies } from './types.js';
type Args = {
    collectionConfig?: SanitizedCollectionConfig;
    constraint: WhereField;
    errors: {
        path: string;
    }[];
    fields: FlattenedField[];
    globalConfig?: SanitizedGlobalConfig;
    operator: string;
    overrideAccess: boolean;
    parentIsLocalized?: boolean;
    path: string;
    policies: EntityPolicies;
    polymorphicJoin?: boolean;
    req: PayloadRequest;
    val: unknown;
    versionFields?: FlattenedField[];
};
/**
 * Validate the Payload key / value / operator
 */
export declare function validateSearchParam({ collectionConfig, constraint, errors, fields, globalConfig, operator, overrideAccess, parentIsLocalized, path: incomingPath, policies, polymorphicJoin, req, val, versionFields, }: Args): Promise<void>;
export {};
//# sourceMappingURL=validateSearchParams.d.ts.map
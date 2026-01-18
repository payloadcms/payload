import type { CollectionPermission, FieldPermissions, FieldsPermissions, GlobalPermission } from '../../auth/types.js';
import type { DefaultDocumentIDType } from '../../index.js';
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js';
import type { BlockReferencesPermissions } from './getEntityPermissions.js';
import { type Field } from '../../fields/config/types.js';
/**
 * Build up permissions object and run access functions for each field of an entity
 * This function is synchronous and collects all async work into the promises array
 */
export declare const populateFieldPermissions: ({ id, blockReferencesPermissions, data, fields, operations, parentPermissionsObject, permissionsObject, promises, req, }: {
    blockReferencesPermissions: BlockReferencesPermissions;
    data: JsonObject | undefined;
    fields: Field[];
    id?: DefaultDocumentIDType;
    /**
     * Operations to check access for
     */
    operations: AllOperations[];
    parentPermissionsObject: CollectionPermission | FieldPermissions | GlobalPermission;
    permissionsObject: FieldsPermissions;
    promises: Promise<void>[];
    req: PayloadRequest;
}) => void;
//# sourceMappingURL=populateFieldPermissions.d.ts.map
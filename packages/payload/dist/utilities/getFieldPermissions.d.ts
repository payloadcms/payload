import type { SanitizedDocumentPermissions, SanitizedFieldPermissions, SanitizedFieldsPermissions } from '../auth/types.js';
import type { ClientField, Field } from '../fields/config/types.js';
import type { Operation } from '../types/index.js';
/**
 * Gets read and operation-level permissions for a given field based on cascading field permissions.
 * @returns An object with the following properties:
 * - `operation`: Whether the user has permission to perform the operation on the field (`create` or `update`).
 * - `permissions`: The field-level permissions.
 * - `read`: Whether the user has permission to read the field.
 */
export declare const getFieldPermissions: ({ collectionPermissions, field, operation, parentName, permissions, }: {
    readonly collectionPermissions?: SanitizedDocumentPermissions;
    readonly field: ClientField | Field;
    readonly operation: Operation;
    readonly parentName: string;
    readonly permissions: SanitizedFieldPermissions | SanitizedFieldsPermissions;
}) => {
    operation: boolean;
    /**
     * The field-level permissions. This can be equal to the permissions passed to the
     * `getFieldPermissions` function if the field has no name.
     */
    permissions: SanitizedFieldPermissions | SanitizedFieldsPermissions;
    read: boolean;
};
//# sourceMappingURL=getFieldPermissions.d.ts.map
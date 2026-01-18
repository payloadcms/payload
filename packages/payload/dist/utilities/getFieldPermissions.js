/* eslint-disable @typescript-eslint/no-explicit-any */ /**
 * Gets read and operation-level permissions for a given field based on cascading field permissions.
 * @returns An object with the following properties:
 * - `operation`: Whether the user has permission to perform the operation on the field (`create` or `update`).
 * - `permissions`: The field-level permissions.
 * - `read`: Whether the user has permission to read the field.
 */ export const getFieldPermissions = ({ collectionPermissions, field, operation, parentName, permissions })=>{
    // First, calculate permissions using the existing logic
    const fieldOperation = permissions === true || permissions?.[operation] === true || permissions?.[parentName] === true || 'name' in field && typeof permissions === 'object' && permissions?.[field.name] && (permissions[field.name] === true || operation in permissions[field.name] && permissions[field.name][operation]);
    const fieldPermissions = permissions === undefined || permissions === null || permissions === true ? true : 'name' in field ? permissions[field.name] : permissions;
    const fieldRead = permissions === true || permissions?.read === true || permissions?.[parentName] === true || 'name' in field && typeof permissions === 'object' && permissions?.[field.name] && (permissions[field.name] === true || 'read' in permissions[field.name] && permissions[field.name].read);
    // Check if field permissions are effectively empty/missing
    const hasFieldPermissions = permissions === true || typeof permissions === 'object' && permissions !== null && Object.keys(permissions).length > 0;
    // If no field permissions are defined, fallback to collection permissions
    if (!hasFieldPermissions && collectionPermissions) {
        const collectionRead = Boolean(collectionPermissions.read);
        let collectionOperation = false;
        // Check operation-specific permission on collection
        if (operation === 'create' && 'create' in collectionPermissions) {
            collectionOperation = Boolean(collectionPermissions.create);
        } else if (operation === 'update') {
            collectionOperation = Boolean(collectionPermissions.update);
        }
        return {
            operation: collectionOperation,
            permissions: {
                read: collectionRead
            },
            read: collectionRead
        };
    }
    // Return the calculated permissions
    return {
        operation: Boolean(fieldOperation),
        permissions: fieldPermissions,
        read: Boolean(fieldRead)
    };
};

//# sourceMappingURL=getFieldPermissions.js.map
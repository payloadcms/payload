import { tabHasName } from '../../fields/config/types.js';
const isThenable = (value)=>value != null && typeof value.then === 'function';
/**
 * Helper to set a permission value that might be a promise.
 * If it's a promise, creates a chained promise that resolves to update the target,
 * stores the promise temporarily, and adds it to the promises array for later resolution.
 */ const setPermission = (// eslint-disable-next-line @typescript-eslint/no-explicit-any
target, operation, value, promises)=>{
    if (isThenable(value)) {
        // Create a single permission object that will be mutated in place
        // This ensures all references (including cached blocks) see the resolved value
        const permissionObj = {
            permission: value
        };
        target[operation] = permissionObj;
        const permissionPromise = value.then((result)=>{
            // Mutate the permission property in place so all references see the update
            permissionObj.permission = result;
        });
        promises.push(permissionPromise);
    } else {
        target[operation] = {
            permission: value
        };
    }
};
/**
 * Build up permissions object and run access functions for each field of an entity
 * This function is synchronous and collects all async work into the promises array
 */ export const populateFieldPermissions = ({ id, blockReferencesPermissions, data, fields, operations, parentPermissionsObject, permissionsObject, promises, req })=>{
    for (const field of fields){
        // Set up permissions for all operations
        for (const operation of operations){
            const parentPermissionForOperation = parentPermissionsObject[operation]?.permission;
            // Fields don't have all operations of a collection
            if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
                continue;
            }
            if ('name' in field && field.name) {
                if (!permissionsObject[field.name]) {
                    permissionsObject[field.name] = {};
                }
                const fieldPermissions = permissionsObject[field.name];
                if ('access' in field && field.access && typeof field.access[operation] === 'function') {
                    const accessResult = field.access[operation]({
                        id,
                        data,
                        doc: data,
                        req
                    });
                    // Handle both sync and async access results
                    if (isThenable(accessResult)) {
                        const booleanPromise = accessResult.then((result)=>Boolean(result));
                        setPermission(fieldPermissions, operation, booleanPromise, promises);
                    } else {
                        setPermission(fieldPermissions, operation, Boolean(accessResult), promises);
                    }
                } else {
                    // Inherit from parent (which might be a promise)
                    setPermission(fieldPermissions, operation, parentPermissionForOperation, promises);
                }
            }
        }
        // Handle named fields with nested content
        if ('name' in field && field.name) {
            const fieldPermissions = permissionsObject[field.name];
            if ('fields' in field && field.fields) {
                if (!fieldPermissions.fields) {
                    fieldPermissions.fields = {};
                }
                populateFieldPermissions({
                    id,
                    blockReferencesPermissions,
                    data,
                    fields: field.fields,
                    operations,
                    parentPermissionsObject: fieldPermissions,
                    permissionsObject: fieldPermissions.fields,
                    promises,
                    req
                });
            }
            if ('blocks' in field && field.blocks?.length || 'blockReferences' in field && field.blockReferences?.length) {
                if (!fieldPermissions.blocks) {
                    fieldPermissions.blocks = {};
                }
                const blocksPermissions = fieldPermissions.blocks;
                // Set up permissions for all operations for all blocks
                for (const operation of operations){
                    // Fields don't have all operations of a collection
                    if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
                        continue;
                    }
                    const parentPermissionForOperation = parentPermissionsObject[operation]?.permission;
                    for (const _block of field.blockReferences ?? field.blocks){
                        const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block;
                        // Skip if block doesn't exist (invalid block reference)
                        if (!block) {
                            continue;
                        }
                        // Handle block references - check if we've seen this block before
                        if (typeof _block === 'string') {
                            const blockReferencePermissions = blockReferencesPermissions[_block];
                            if (blockReferencePermissions) {
                                // Reference the cached permissions (may be a promise or resolved object)
                                blocksPermissions[block.slug] = blockReferencePermissions;
                                continue;
                            }
                        }
                        // Initialize block permissions object if needed
                        if (!blocksPermissions[block.slug]) {
                            blocksPermissions[block.slug] = {};
                        }
                        const blockPermission = blocksPermissions[block.slug];
                        // Set permission for this operation
                        if (!blockPermission[operation]) {
                            const fieldPermission = fieldPermissions[operation]?.permission ?? parentPermissionForOperation;
                            // Inherit from field permission (which might be a promise)
                            setPermission(blockPermission, operation, fieldPermission, promises);
                        }
                    }
                }
                // Process nested content for each unique block (once per block, not once per operation)
                const processedBlocks = new Set();
                for (const _block of field.blockReferences ?? field.blocks){
                    const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block;
                    // Skip if block doesn't exist (invalid block reference)
                    if (!block || processedBlocks.has(block.slug)) {
                        continue;
                    }
                    processedBlocks.add(block.slug);
                    const blockPermission = blocksPermissions[block.slug];
                    if (!blockPermission) {
                        continue;
                    }
                    if (!blockPermission.fields) {
                        blockPermission.fields = {};
                    }
                    // Handle block references with caching - store as promise that will be resolved later
                    if (typeof _block === 'string' && !blockReferencesPermissions[_block]) {
                        // Mark this block as being processed by storing a reference
                        blockReferencesPermissions[_block] = blockPermission;
                    }
                    // Recursively process block fields synchronously
                    populateFieldPermissions({
                        id,
                        blockReferencesPermissions,
                        data,
                        fields: block.fields,
                        operations,
                        parentPermissionsObject: blockPermission,
                        permissionsObject: blockPermission.fields,
                        promises,
                        req
                    });
                }
            }
        }
        // Handle unnamed group fields
        if ('fields' in field && field.fields && !('name' in field && field.name)) {
            // Field does not have a name => same parentPermissionsObject
            populateFieldPermissions({
                id,
                blockReferencesPermissions,
                data,
                fields: field.fields,
                operations,
                // Field does not have a name here => use parent permissions object
                parentPermissionsObject,
                permissionsObject,
                promises,
                req
            });
        }
        // Handle tabs fields
        if (field.type === 'tabs') {
            // Process tabs for all operations
            for (const operation of operations){
                // Fields don't have all operations of a collection
                if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
                    continue;
                }
                const parentPermissionForOperation = parentPermissionsObject[operation]?.permission;
                for (const tab of field.tabs){
                    if (tabHasName(tab)) {
                        if (!permissionsObject[tab.name]) {
                            permissionsObject[tab.name] = {
                                fields: {}
                            };
                        }
                        const tabPermissions = permissionsObject[tab.name];
                        if (!tabPermissions[operation]) {
                            // Inherit from parent (which might be a promise)
                            setPermission(tabPermissions, operation, parentPermissionForOperation, promises);
                        }
                    }
                }
            }
            for (const tab of field.tabs){
                if (tabHasName(tab)) {
                    const tabPermissions = permissionsObject[tab.name];
                    if (!tabPermissions.fields) {
                        tabPermissions.fields = {};
                    }
                    populateFieldPermissions({
                        id,
                        blockReferencesPermissions,
                        data,
                        fields: tab.fields,
                        operations,
                        parentPermissionsObject: tabPermissions,
                        permissionsObject: tabPermissions.fields,
                        promises,
                        req
                    });
                } else {
                    // Tab does not have a name => same parentPermissionsObject
                    populateFieldPermissions({
                        id,
                        blockReferencesPermissions,
                        data,
                        fields: tab.fields,
                        operations,
                        // Tab does not have a name here => use parent permissions object
                        parentPermissionsObject,
                        permissionsObject,
                        promises,
                        req
                    });
                }
            }
        }
    }
};

//# sourceMappingURL=populateFieldPermissions.js.map
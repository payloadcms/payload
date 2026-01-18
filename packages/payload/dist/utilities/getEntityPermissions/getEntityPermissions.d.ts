import type { BlockPermissions, CollectionPermission, GlobalPermission } from '../../auth/types.js';
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../globals/config/types.js';
import type { BlockSlug, DefaultDocumentIDType } from '../../index.js';
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js';
export type BlockReferencesPermissions = Record<BlockSlug, BlockPermissions | Promise<BlockPermissions>>;
export type EntityDoc = JsonObject | TypeWithID;
type ReturnType<TEntityType extends 'collection' | 'global'> = TEntityType extends 'global' ? GlobalPermission : CollectionPermission;
type Args<TEntityType extends 'collection' | 'global'> = {
    blockReferencesPermissions: BlockReferencesPermissions;
    /**
     * If the document data is passed, it will be used to check access instead of fetching the document from the database.
     */
    data?: JsonObject;
    entity: TEntityType extends 'collection' ? SanitizedCollectionConfig : SanitizedGlobalConfig;
    entityType: TEntityType;
    /**
     * Operations to check access for
     */
    operations: AllOperations[];
    req: PayloadRequest;
} & ({
    fetchData: false;
    id?: never;
} | {
    fetchData: true;
    id: TEntityType extends 'collection' ? DefaultDocumentIDType : undefined;
});
/**
 * Build up permissions object for an entity (collection or global).
 * This is not run during any update and reflects the current state of the entity data => doc and data is the same.
 *
 * When `fetchData` is false:
 * - returned `Where` are not run and evaluated as "does not have permission".
 * - If req.data is passed: `data` and `doc` is passed to access functions.
 * - If req.data is not passed: `data` and `doc` is not passed to access functions.
 *
 * When `fetchData` is true:
 * - `Where` are run and evaluated as "has permission" or "does not have permission".
 * - `data` and `doc` are always passed to access functions.
 * - Error is thrown if `entityType` is 'collection' and `id` is not passed.
 *
 * In both cases:
 * We cannot include siblingData or blockData here, as we do not have siblingData available once we reach block or array
 * rows, as we're calculating schema permissions, which do not include individual rows.
 * For consistency, it's thus better to never include the siblingData and blockData
 *
 * @internal
 */
export declare function getEntityPermissions<TEntityType extends 'collection' | 'global'>(args: Args<TEntityType>): Promise<ReturnType<TEntityType>>;
export {};
//# sourceMappingURL=getEntityPermissions.d.ts.map
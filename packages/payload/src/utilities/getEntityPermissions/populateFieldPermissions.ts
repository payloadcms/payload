import type {
  BlockPermissions,
  BlocksPermissions,
  CollectionPermission,
  FieldPermissions,
  FieldsPermissions,
  GlobalPermission,
  Permission,
} from '../../auth/types.js'
import type { DefaultDocumentIDType } from '../../index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'
import type { BlockReferencesPermissions } from './getEntityPermissions.js'

import { type Field, tabHasName } from '../../fields/config/types.js'

const isThenable = (value: unknown): value is Promise<unknown> =>
  value != null && typeof (value as { then?: unknown }).then === 'function'

/**
 * Build up permissions object and run access functions for each field of an entity
 */
export const populateFieldPermissions = async ({
  id,
  blockReferencesPermissions,
  data,
  fields,
  operations,
  parentPermissionsObject,
  permissionsObject,
  promises,
  req,
}: {
  blockReferencesPermissions: BlockReferencesPermissions
  data: JsonObject | undefined
  fields: Field[]
  id?: DefaultDocumentIDType
  /**
   * Operations to check access for
   */
  operations: AllOperations[]
  parentPermissionsObject: CollectionPermission | FieldPermissions | GlobalPermission
  permissionsObject: FieldsPermissions
  promises: Promise<void>[]
  req: PayloadRequest
}): Promise<void> => {
  for (const field of fields) {
    for (const operation of operations) {
      const parentPermissionForOperation = (
        parentPermissionsObject[operation as keyof typeof parentPermissionsObject] as Permission
      )?.permission

      // const operation = _operation as keyof Omit<FieldPermissions, 'fields'>

      // Fields don't have all operations of a collection
      if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
        continue
      }

      if ('name' in field && field.name) {
        if (!permissionsObject[field.name]) {
          permissionsObject[field.name] = {} as FieldPermissions
        }
        const fieldPermissions: FieldPermissions = permissionsObject[field.name]!

        // Track if we need to await before processing nested fields
        let pendingAccessPromise: Promise<void> | undefined

        if ('access' in field && field.access && typeof field.access[operation] === 'function') {
          const accessResult = field.access[operation]({
            id,
            data,
            doc: data,
            req,
            // We cannot include siblingData or blockData here, as we do not have siblingData/blockData available once we reach block or array
            // rows, as we're calculating schema permissions, which do not include individual rows.
            // For consistency, it's thus better to never include the siblingData and blockData
          })
          if (isThenable(accessResult)) {
            const promise = accessResult.then((result) => {
              fieldPermissions[operation] = {
                permission: Boolean(result),
              }
            })

            // If this field has nested fields, we'll await this promise before recursing
            // Otherwise, add it to the promises array for parallel processing
            if ('fields' in field && field.fields) {
              pendingAccessPromise = promise
            } else {
              promises.push(promise)
            }
          } else {
            fieldPermissions[operation] = {
              permission: Boolean(accessResult),
            }
          }
        } else {
          fieldPermissions[operation] = {
            permission: parentPermissionForOperation,
          }
        }

        if ('fields' in field && field.fields) {
          if (!fieldPermissions.fields) {
            fieldPermissions.fields = {}
          }

          // For correct calculation of `parentPermissionForOperation`, the parentPermissionsObject must be completely
          // calculated and awaited before calculating field permissions of nested fields.
          if (pendingAccessPromise) {
            await pendingAccessPromise
          }

          await populateFieldPermissions({
            id,
            blockReferencesPermissions,
            data,
            fields: field.fields,
            operations,
            parentPermissionsObject: fieldPermissions,
            permissionsObject: fieldPermissions.fields,
            promises,
            req,
          })
        }

        if (
          ('blocks' in field && field.blocks?.length) ||
          ('blockReferences' in field && field.blockReferences?.length)
        ) {
          if (!fieldPermissions.blocks) {
            fieldPermissions.blocks = {}
          }
          const blocksPermissions: BlocksPermissions = fieldPermissions.blocks

          for (const _block of field.blockReferences ?? field.blocks) {
            const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block

            // Skip if block doesn't exist (invalid block reference)
            if (!block) {
              continue
            }

            if (!blocksPermissions[block.slug]) {
              blocksPermissions[block.slug] = {} as BlockPermissions
            }

            if (typeof _block === 'string') {
              const blockReferencePermissions = blockReferencesPermissions[_block]
              if (blockReferencePermissions) {
                if (isThenable(blockReferencePermissions)) {
                  // Earlier access to this block is still pending, so await it instead of re-running populateFieldPermissions
                  blocksPermissions[block.slug] = await blockReferencePermissions
                } else {
                  // It's already a resolved policy object
                  blocksPermissions[block.slug] = blockReferencePermissions
                }
                continue
              } else {
                // We have not seen this block slug yet. Immediately create a promise
                // so that any parallel calls will just await this same promise
                // instead of re-running populateFieldPermissions.
                const blockPromise = (async (): Promise<BlockPermissions> => {
                  // If the block doesn't exist yet in our permissionsObject, initialize it
                  // Use field-level permission instead of parentPermissionForOperation for blocks
                  // This ensures that if the field has access control, it applies to all blocks in the field
                  const fieldPermission =
                    fieldPermissions[operation]?.permission ?? parentPermissionForOperation

                  if (!blocksPermissions[block.slug]) {
                    blocksPermissions[block.slug] = {
                      fields: {},
                      [operation]: { permission: fieldPermission },
                    } as BlockPermissions
                  } else if (!blocksPermissions[block.slug]?.[operation]) {
                    blocksPermissions[block.slug]![operation] = {
                      permission: fieldPermission,
                    }
                  }

                  const blockPermission = blocksPermissions[block.slug]!
                  if (!blockPermission.fields) {
                    blockPermission.fields = {}
                  }

                  await populateFieldPermissions({
                    id,
                    blockReferencesPermissions,
                    data,
                    fields: block.fields,
                    operations,
                    parentPermissionsObject: blockPermission,
                    permissionsObject: blockPermission.fields,
                    promises,
                    req,
                  })

                  return blockPermission
                })()

                blockReferencesPermissions[_block] = blockPromise
                blocksPermissions[block.slug] = await blockPromise
                continue
              }
            }

            // Use field-level permission instead of parentPermissionForOperation for blocks
            const fieldPermission =
              fieldPermissions[operation]?.permission ?? parentPermissionForOperation

            if (!blocksPermissions[block.slug]) {
              blocksPermissions[block.slug] = {
                fields: {},
                [operation]: { permission: fieldPermission },
              } as BlockPermissions
            }

            const blockPermission = blocksPermissions[block.slug]
            if (!blockPermission) {
              // Should never happen since we just set it above, but TypeScript needs the check
              continue
            }

            if (!blockPermission[operation]) {
              blockPermission[operation] = {
                permission: fieldPermission,
              }
            }

            if (!blockPermission.fields) {
              blockPermission.fields = {}
            }

            // For correct calculation of `parentPermissionForOperation`, the parentPermissionsObject must be completely
            // calculated and awaited before calculating field permissions of nested fields.
            await populateFieldPermissions({
              id,
              blockReferencesPermissions,
              data,
              fields: block.fields,
              operations,
              parentPermissionsObject: blockPermission,
              permissionsObject: blockPermission.fields,
              promises,
              req,
            })
          }
        }
      } else if ('fields' in field && field.fields) {
        // Field does not have a name => same parentPermissionsObject => no need to await current level
        await populateFieldPermissions({
          id,
          blockReferencesPermissions,
          data,
          fields: field.fields,
          operations,
          // Field does not have a name here => use parent permissions object
          parentPermissionsObject,
          permissionsObject,
          promises,
          req,
        })
      } else if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if (tabHasName(tab)) {
            if (!permissionsObject[tab.name]) {
              permissionsObject[tab.name] = {
                fields: {},
                [operation]: { permission: parentPermissionForOperation },
              } as FieldPermissions
            } else if (!permissionsObject[tab.name]![operation]) {
              permissionsObject[tab.name]![operation] = { permission: parentPermissionForOperation }
            }

            const tabPermissions: FieldPermissions = permissionsObject[tab.name]!

            if (!tabPermissions.fields) {
              tabPermissions.fields = {}
            }

            // For tabs with names, we don't have async access functions on the tab itself,
            // so no need to await before recursing. The permission is set synchronously above.
            await populateFieldPermissions({
              id,
              blockReferencesPermissions,
              data,
              fields: tab.fields,
              operations,
              parentPermissionsObject: tabPermissions,
              permissionsObject: tabPermissions.fields,
              promises,
              req,
            })
          } else {
            // Tab does not have a name => same parentPermissionsObject => no need to await current level
            await populateFieldPermissions({
              id,
              blockReferencesPermissions,
              data,
              fields: tab.fields,
              operations,
              // Tab does not have a name here => use parent permissions object
              parentPermissionsObject,
              permissionsObject,
              promises,
              req,
            })
          }
        }
      }
    }
  }
}

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
export const populateFieldPermissions = ({
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
}): void => {
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
            promises.push(
              accessResult.then((result) => {
                fieldPermissions[operation] = {
                  permission: Boolean(result),
                }
              }),
            )
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

          fieldPermissions.fields = {} as FieldsPermissions

          // For correct calculation of `parentPermissionForOperation`, the parentPermissionsObject must be completely
          // calculated and awaited before calculating field permissions of nested fields.
          // TODO
          populateFieldPermissions({
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
          if (!permissionsObject[field.name]?.blocks) {
            fieldPermissions.blocks = {}
          }
          const blocksPermissions: BlocksPermissions = fieldPermissions.blocks!

          for (const _block of field.blockReferences ?? field.blocks) {
            const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block

            // Skip if block doesn't exist (invalid block reference)
            if (!block) {
              return
            }

            if (!blocksPermissions[block.slug]) {
              blocksPermissions[block.slug] = {} as BlockPermissions
            }

            if (typeof _block === 'string') {
              const blockReferencePermissions = blockReferencesPermissions[_block]
              if (blockReferencePermissions) {
                if (isThenable(blockReferencePermissions)) {
                  // Earlier access to this block is still pending, so await it instead of re-running executeFieldPolicies
                  blocksPermissions[block.slug] = await blockReferencePermissions
                } else {
                  // It's already a resolved policy object
                  blocksPermissions[block.slug] = blockReferencePermissions
                }
                return
              } else {
                // We have not seen this block slug yet. Immediately create a promise
                // so that any parallel calls will just await this same promise
                // instead of re-running executeFieldPolicies.
                blocksPermissions[block.slug] = (async () => {
                  // If the block doesn't exist yet in our permissionsObject, initialize it
                  if (!fieldPermissions.blocks?.[block.slug]) {
                    // Use field-level permission instead of parentPermissionForOperation for blocks
                    // This ensures that if the field has access control, it applies to all blocks in the field
                    const fieldPermission =
                      fieldPermissions[operation]?.permission ?? parentPermissionForOperation

                    fieldPermissions.blocks[block.slug] = {
                      fields: {},
                      [operation]: { permission: fieldPermission },
                    }
                  } else if (!fieldPermissions.blocks[block.slug][operation]) {
                    // Use field-level permission for consistency
                    const fieldPermission =
                      fieldPermissions[operation]?.permission ?? parentPermissionForOperation

                    fieldPermissions.blocks[block.slug][operation] = {
                      permission: fieldPermission,
                    }
                  }

                  await executeFieldPolicies({
                    blockPermissions,
                    createAccessPromise,
                    fields: block.fields,
                    operation,
                    parentPermissionForOperation:
                      fieldPermissions[operation]?.permission ?? parentPermissionForOperation,
                    payload,
                    permissionsObject: fieldPermissions.blocks[block.slug],
                  })

                  return fieldPermissions.blocks[block.slug]
                })()

                fieldPermissions.blocks[block.slug] = await blockPermissions[_block]
                blockPermissions[_block] = fieldPermissions.blocks[block.slug]
                return
              }
            }

            if (!fieldPermissions.blocks?.[block.slug]) {
              // Use field-level permission instead of parentPermissionForOperation for blocks
              const fieldPermission =
                fieldPermissions[operation]?.permission ?? parentPermissionForOperation

              fieldPermissions.blocks[block.slug] = {
                fields: {},
                [operation]: { permission: fieldPermission },
              }
            } else if (!fieldPermissions.blocks[block.slug][operation]) {
              // Use field-level permission for consistency
              const fieldPermission =
                fieldPermissions[operation]?.permission ?? parentPermissionForOperation

              fieldPermissions.blocks[block.slug][operation] = {
                permission: fieldPermission,
              }
            }

            // For correct calculation of `parentPermissionForOperation`, the parentPermissionsObject must be completely
            // calculated and awaited before calculating field permissions of nested fields.
            // TODO
            await executeFieldPolicies({
              blockPermissions,
              createAccessPromise,
              fields: block.fields,
              operation,
              parentPermissionForOperation:
                fieldPermissions[operation]?.permission ?? parentPermissionForOperation,
              payload,
              permissionsObject: fieldPermissions.blocks[block.slug],
            })
          }
        }
      } else if ('fields' in field && field.fields) {
        // Field does not have a name => same parentPermissionsObject => no need to await current level
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
          req,
        })
      } else if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          if (tabHasName(tab)) {
            const tabPermissions: FieldPermissions | undefined = permissionsObject[tab.name]

            if (!tabPermissions) {
              permissionsObject[tab.name] = {
                fields: {},
                [operation]: { permission: parentPermissionForOperation },
              } as FieldPermissions
            } else if (!tabPermissions[operation]) {
              permissionsObject[tab.name]![operation] = { permission: parentPermissionForOperation }
            }

            // For correct calculation of `parentPermissionForOperation`, the parentPermissionsObject must be completely
            // calculated and awaited before calculating field permissions of nested fields.
            // TODO
            populateFieldPermissions({
              id,
              blockReferencesPermissions,
              data,
              fields: tab.fields,
              operations,
              parentPermissionsObject: tabPermissions!,
              permissionsObject: tabPermissions!.fields!,
              promises,
              req,
            })
          } else {
            // Tab does not have a name => same parentPermissionsObject => no need to await current level
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
              req,
            })
          }
        }
      }
    }
  }
}

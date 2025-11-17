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
    // Track pending access promises for this field across all operations
    const fieldAccessPromises: Promise<void>[] = []

    // First pass: Set up permissions for all operations
    for (const operation of operations) {
      const parentPermissionForOperation = (
        parentPermissionsObject[operation as keyof typeof parentPermissionsObject] as Permission
      )?.permission

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
            const promise = accessResult.then((result) => {
              fieldPermissions[operation] = {
                permission: Boolean(result),
              }
            })

            // If this field has nested content (fields or blocks), collect promises to await before processing nested content
            // Otherwise, add to global promises array for parallel processing
            if (
              ('fields' in field && field.fields) ||
              ('blocks' in field && field.blocks?.length) ||
              ('blockReferences' in field && field.blockReferences?.length)
            ) {
              fieldAccessPromises.push(promise)
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
      }
    }

    // Await all field-level access promises before processing nested content
    if (fieldAccessPromises.length > 0) {
      await Promise.all(fieldAccessPromises)
    }

    // Handle named fields with nested content
    if ('name' in field && field.name) {
      const fieldPermissions: FieldPermissions = permissionsObject[field.name]!

      if ('fields' in field && field.fields) {
        if (!fieldPermissions.fields) {
          fieldPermissions.fields = {}
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

        // First, set up permissions for all operations for all blocks
        for (const operation of operations) {
          // Fields don't have all operations of a collection
          if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
            continue
          }

          const parentPermissionForOperation = (
            parentPermissionsObject[operation as keyof typeof parentPermissionsObject] as Permission
          )?.permission

          for (const _block of field.blockReferences ?? field.blocks) {
            const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block

            // Skip if block doesn't exist (invalid block reference)
            if (!block) {
              continue
            }

            // Handle block references - check if we've seen this block before
            if (typeof _block === 'string') {
              const blockReferencePermissions = blockReferencesPermissions[_block]
              if (blockReferencePermissions) {
                if (isThenable(blockReferencePermissions)) {
                  // Earlier access to this block is still pending, so await it
                  blocksPermissions[block.slug] = await blockReferencePermissions
                } else {
                  // It's already a resolved policy object
                  blocksPermissions[block.slug] = blockReferencePermissions
                }
                continue
              }
            }

            // Initialize block permissions object if needed
            if (!blocksPermissions[block.slug]) {
              blocksPermissions[block.slug] = {} as BlockPermissions
            }

            const blockPermission = blocksPermissions[block.slug]!

            // Set permission for this operation
            if (!blockPermission[operation]) {
              const fieldPermission =
                fieldPermissions[operation]?.permission ?? parentPermissionForOperation
              blockPermission[operation] = {
                permission: fieldPermission,
              }
            }
          }
        }

        // Now process nested content for each unique block (once per block, not once per operation)
        const processedBlocks = new Set<string>()
        for (const _block of field.blockReferences ?? field.blocks) {
          const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block

          // Skip if block doesn't exist (invalid block reference)
          if (!block || processedBlocks.has(block.slug)) {
            continue
          }
          processedBlocks.add(block.slug)

          // Handle block references with caching
          if (typeof _block === 'string' && !blockReferencesPermissions[_block]) {
            blockReferencesPermissions[_block] = (async (): Promise<BlockPermissions> => {
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

            blocksPermissions[block.slug] = await blockReferencesPermissions[_block]
            continue
          }

          // Process inline blocks or already-resolved references
          const blockPermission = blocksPermissions[block.slug]
          if (!blockPermission) {
            continue
          }

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
        }
      }
    }

    // Handle unnamed group fields
    if ('fields' in field && field.fields && !('name' in field && field.name)) {
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
    }

    // Handle tabs fields
    if (field.type === 'tabs') {
      // Process tabs for all operations
      for (const operation of operations) {
        // Fields don't have all operations of a collection
        if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
          continue
        }

        const parentPermissionForOperation = (
          parentPermissionsObject[operation as keyof typeof parentPermissionsObject] as Permission
        )?.permission

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
          }
        }
      }

      for (const tab of field.tabs) {
        if (tabHasName(tab)) {
          const tabPermissions: FieldPermissions = permissionsObject[tab.name]!

          if (!tabPermissions.fields) {
            tabPermissions.fields = {}
          }

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

import type {
  BlockPermissions,
  CollectionPermission,
  FieldsPermissions,
  GlobalPermission,
} from '../../auth/types.js'
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type { Access } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { BlockSlug, DefaultDocumentIDType } from '../../index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'

import { entityDocExists } from './entityDocExists.js'
import { populateFieldPermissions } from './populateFieldPermissions.js'

export type BlockReferencesPermissions = Record<
  BlockSlug,
  BlockPermissions | Promise<BlockPermissions>
>

export type EntityDoc = JsonObject | TypeWithID

type ReturnType<TEntityType extends 'collection' | 'global'> = TEntityType extends 'global'
  ? GlobalPermission
  : CollectionPermission

type Args<TEntityType extends 'collection' | 'global'> = {
  blockReferencesPermissions: BlockReferencesPermissions
  /**
   * If the document data is passed, it will be used to check access instead of fetching the document from the database.
   */
  data?: JsonObject
  entity: TEntityType extends 'collection' ? SanitizedCollectionConfig : SanitizedGlobalConfig
  entityType: TEntityType
  /**
   * Operations to check access for
   */
  operations: AllOperations[]
  req: PayloadRequest
} & (
  | {
      fetchData: false
      id?: never
    }
  | {
      fetchData: true
      id: TEntityType extends 'collection' ? DefaultDocumentIDType : undefined
    }
)

const topLevelCollectionPermissions = [
  'create',
  'delete',
  'read',
  'readVersions',
  'update',
  'unlock',
]
const topLevelGlobalPermissions = ['read', 'readVersions', 'update']

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
 */
export async function getEntityPermissions<TEntityType extends 'collection' | 'global'>(
  args: Args<TEntityType>,
): Promise<ReturnType<TEntityType>> {
  const {
    id,
    blockReferencesPermissions,
    data: _data,
    entity,
    entityType,
    fetchData,
    operations,
    req,
  } = args
  const { locale: _locale, user } = req

  const locale = _locale ? _locale : undefined

  const hasData = _data && Object.keys(_data).length > 0
  const data: JsonObject | Promise<JsonObject> | undefined = (
    hasData
      ? _data
      : fetchData
        ? (async () => {
            if (entityType === 'global') {
              return req.payload.findGlobal({
                slug: entity.slug,
                depth: 0,
                fallbackLocale: null,
                locale,
                overrideAccess: true,
                req,
              })
            }

            if (entityType === 'collection') {
              if (!id) {
                throw new Error('ID is required when fetching data for a collection')
              }

              return req.payload.findByID({
                id,
                collection: entity.slug,
                depth: 0,
                fallbackLocale: null,
                locale,
                overrideAccess: true,
                req,
                trash: true,
              })
            }
          })()
        : undefined
  ) as JsonObject | Promise<JsonObject>

  const isLoggedIn = !!user

  const fieldsPermissions: FieldsPermissions = {}

  const entityPermissions: ReturnType<TEntityType> = {
    fields: fieldsPermissions,
  } as ReturnType<TEntityType>

  const entityAccessPromises: Promise<void>[] = []
  const promises: Promise<void>[] = []

  for (const _operation of operations) {
    const operation = _operation as keyof typeof entity.access
    const accessFunction = entity.access[operation]

    if (
      (entityType === 'collection' && topLevelCollectionPermissions.includes(operation)) ||
      (entityType === 'global' && topLevelGlobalPermissions.includes(operation))
    ) {
      if (typeof accessFunction === 'function') {
        entityAccessPromises.push(
          createEntityAccessPromise({
            id,
            slug: entity.slug,
            access: accessFunction,
            data,
            entityType,
            fetchData,
            locale,
            operation,
            permissionsObject: entityPermissions,
            req,
          }),
        )
      } else {
        entityPermissions[operation] = {
          permission: isLoggedIn,
        }
      }
    }
  }

  // Await entity-level access promises before processing fields
  // This ensures parentPermissionForOperation is always defined
  await Promise.all(entityAccessPromises)

  const resolvedData = await data

  await populateFieldPermissions({
    blockReferencesPermissions,
    data: resolvedData,
    fields: entity.fields,
    operations,
    parentPermissionsObject: entityPermissions,
    permissionsObject: fieldsPermissions,
    promises,
    req,
  })

  /**
   * Await all promises in parallel.
   * A promise can add more promises to the promises array (group of fields calls populateFieldPermissions again in their own promise), which will not be
   * awaited in the first run.
   * This is why we need to loop again to process the new promises, until there are no more promises left.
   */
  let iterations = 0
  while (promises.length > 0) {
    const currentPromises = promises.splice(0, promises.length)

    await Promise.all(currentPromises)

    iterations++
    if (iterations >= 100) {
      throw new Error('Infinite getEntityPermissions promise loop detected.')
    }
  }

  return entityPermissions
}

type CreateEntityAccessPromise = (args: {
  access: Access
  data: JsonObject | Promise<JsonObject> | undefined
  disableWhere?: boolean
  entityType: 'collection' | 'global'
  fetchData: boolean
  id?: DefaultDocumentIDType
  locale?: string
  operation: Extract<keyof (CollectionPermission | GlobalPermission), AllOperations>
  permissionsObject: CollectionPermission | GlobalPermission
  req: PayloadRequest
  slug: string
}) => Promise<void>

const createEntityAccessPromise: CreateEntityAccessPromise = async ({
  id,
  slug,
  access,
  data,
  disableWhere = false,
  entityType,
  fetchData,
  locale,
  operation,
  permissionsObject,
  req,
}) => {
  // Await data - if it's a Promise it resolves, if not it returns immediately
  const resolvedData = await data

  const accessResult = await access({ id, data: resolvedData, req })

  // Where query was returned from access function => check if document is returned when querying with where
  if (typeof accessResult === 'object' && !disableWhere) {
    permissionsObject[operation] = {
      permission: fetchData
        ? await entityDocExists({
            id,
            slug,
            entityType,
            locale,
            operation,
            req,
            where: accessResult,
          })
        : // TODO: 4.0: Investigate defaulting to `false` here, if where query is returned but ignored as we don't
          // have the document data available. This seems more secure.
          // Alternatively, we could set permission to a third state, like 'unknown'.
          true,
      where: accessResult,
    }
  } else if (permissionsObject[operation]?.permission !== false) {
    permissionsObject[operation] = {
      permission: !!accessResult,
    }
  }
}

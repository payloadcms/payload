import { isDeepStrictEqual } from 'util'

import type {
  BlockPermissions,
  CollectionPermission,
  FieldsPermissions,
  GlobalPermission,
  Permission,
} from '../../auth/types.js'
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { BlockSlug, DefaultDocumentIDType } from '../../index.js'
import type { AllOperations, JsonObject, PayloadRequest, Where } from '../../types/index.js'

import { entityDocExists } from './entityDocExists.js'
import { populateFieldPermissions } from './populateFieldPermissions.js'

type WhereQueryCache = { result: Promise<boolean>; where: Where }[]

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
 *
 * @internal
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

  if (fetchData && entityType === 'collection' && !id) {
    throw new Error('ID is required when fetching data for a collection')
  }

  // Always fetch full doc when fetchData is true to ensure field permissions get complete data
  // Then merge simulated fields from _data on top (e.g., _status for permission checks)
  let fetchedData: JsonObject | undefined = undefined

  if (fetchData) {
    try {
      if (entityType === 'global') {
        fetchedData = await req.payload.findGlobal({
          slug: entity.slug,
          depth: 0,
          fallbackLocale: null,
          locale,
          overrideAccess: true,
          req,
        })
      } else if (entityType === 'collection') {
        fetchedData = await req.payload.findByID({
          id: id!,
          collection: entity.slug,
          depth: 0,
          fallbackLocale: null,
          locale,
          overrideAccess: true,
          req,
          trash: true,
        })
      }
    } catch (error) {
      // Doc doesn't exist yet (e.g., custom ID), fall back to _data
      fetchedData = undefined
    }
  }

  // Merge simulated fields on top of fetched data for doc-level permission checks
  const data: JsonObject | undefined = fetchedData ? { ...fetchedData, ...(_data || {}) } : _data

  const isLoggedIn = !!user

  const fieldsPermissions: FieldsPermissions = {}

  const entityPermissions: ReturnType<TEntityType> = {
    fields: fieldsPermissions,
  } as ReturnType<TEntityType>

  const promises: Promise<void>[] = []

  // Phase 1: Resolve all access functions to get where queries
  const accessResults: {
    operation: keyof typeof entity.access
    result: Promise<boolean | Where>
  }[] = []

  for (const _operation of operations) {
    const operation = _operation as keyof typeof entity.access
    const accessFunction = entity.access[operation]

    if (
      (entityType === 'collection' && topLevelCollectionPermissions.includes(operation)) ||
      (entityType === 'global' && topLevelGlobalPermissions.includes(operation))
    ) {
      if (typeof accessFunction === 'function') {
        accessResults.push({
          operation,
          result: Promise.resolve(accessFunction({ id, data, req })) as Promise<boolean | Where>,
        })
      } else {
        entityPermissions[operation] = {
          permission: isLoggedIn,
        }
      }
    }
  }

  // Await all access functions in parallel
  const resolvedAccessResults = await Promise.all(
    accessResults.map(async (item) => ({
      operation: item.operation,
      result: await item.result,
    })),
  )

  // Phase 2: Process where queries with cache and resolve in parallel
  const whereQueryCache: WhereQueryCache = []
  const wherePromises: Promise<void>[] = []

  for (const { operation, result: accessResult } of resolvedAccessResults) {
    if (typeof accessResult === 'object') {
      processWhereQuery({
        id,
        slug: entity.slug,
        accessResult,
        entityPermissions,
        entityType,
        fetchData,
        locale,
        operation,
        req,
        wherePromises,
        whereQueryCache,
      })
    } else if (entityPermissions[operation]?.permission !== false) {
      entityPermissions[operation] = { permission: !!accessResult }
    }
  }

  // Await all where query DB calls in parallel
  await Promise.all(wherePromises)

  populateFieldPermissions({
    blockReferencesPermissions,
    data,
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

const processWhereQuery = ({
  id,
  slug,
  accessResult,
  entityPermissions,
  entityType,
  fetchData,
  locale,
  operation,
  req,
  wherePromises,
  whereQueryCache,
}: {
  accessResult: Where
  entityPermissions: CollectionPermission | GlobalPermission
  entityType: 'collection' | 'global'
  fetchData: boolean
  id?: DefaultDocumentIDType
  locale?: string
  operation: Extract<keyof (CollectionPermission | GlobalPermission), AllOperations>
  req: PayloadRequest
  slug: string
  wherePromises: Promise<void>[]
  whereQueryCache: WhereQueryCache
}): void => {
  if (fetchData) {
    // Check cache for identical where query using deep comparison
    let cached = whereQueryCache.find((entry) => isDeepStrictEqual(entry.where, accessResult))

    if (!cached) {
      // Cache miss - start DB query (don't await)
      cached = {
        result: entityDocExists({
          id,
          slug,
          entityType,
          locale,
          operation,
          req,
          where: accessResult,
        }),
        where: accessResult,
      }
      whereQueryCache.push(cached)
    }

    // Defer resolution to Promise.all (cache hits reuse same promise)
    wherePromises.push(
      cached.result.then((hasPermission) => {
        entityPermissions[operation] = {
          permission: hasPermission,
          where: accessResult,
        } as Permission
      }),
    )
  } else {
    // TODO: 4.0: Investigate defaulting to `false` here, if where query is returned but ignored as we don't
    // have the document data available. This seems more secure.
    // Alternatively, we could set permission to a third state, like 'unknown'.
    // Even after calling sanitizePermissions, the permissions will still be true if the where query is returned but ignored as we don't have the document data available.
    entityPermissions[operation] = { permission: true, where: accessResult } as Permission
  }
}

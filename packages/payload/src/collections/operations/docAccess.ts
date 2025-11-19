import type { SanitizedCollectionPermission } from '../../auth/index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import {
  getEntityPermissions,
  type PermissionStats,
} from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

type Arguments = {
  collection: Collection
  /**
   * If the document data is passed, it will be used to check access instead of fetching the document from the database.
   */
  data?: JsonObject
  /**
   * When called for creating a new document, id is not provided.
   */
  id?: number | string
  /**
   * Use legacy getEntityPolicies instead of optimized getEntityPermissions
   * @default false
   */
  legacy?: boolean
  req: PayloadRequest
  /**
   * Optional stats object to track database calls
   */
  stats?: PermissionStats
}

export type DocAccessResult = {
  permissions: SanitizedCollectionPermission
  stats?: PermissionStats
}

export async function docAccessOperation(args: Arguments): Promise<SanitizedCollectionPermission>
export async function docAccessOperation(
  args: { stats: PermissionStats } & Arguments,
): Promise<DocAccessResult>
export async function docAccessOperation(
  args: Arguments,
): Promise<DocAccessResult | SanitizedCollectionPermission> {
  const {
    id,
    collection: { config },
    data,
    legacy = false,
    req,
    stats,
  } = args

  const collectionOperations = [...allOperations]

  if (
    config.auth &&
    typeof config.auth.maxLoginAttempts !== 'undefined' &&
    config.auth.maxLoginAttempts !== 0
  ) {
    collectionOperations.push('unlock')
  }

  if (config.versions) {
    collectionOperations.push('readVersions')
  }

  const shouldFetchData = id ? true : false

  try {
    const result = legacy
      ? await getEntityPolicies({
          id: id!,
          type: 'collection',
          blockPolicies: {},
          entity: config,
          operations: collectionOperations,
          req: data ? { ...req, data } : req,
          stats,
        })
      : await getEntityPermissions({
          id: id!,
          blockReferencesPermissions: {},
          data,
          entity: config,
          entityType: 'collection',
          fetchData: id ? true : (false as true),
          operations: collectionOperations,
          req,
          stats,
        })

    const sanitizedPermissions = sanitizePermissions({
      collections: {
        [config.slug]: result,
      },
    })

    const collectionPermissions = sanitizedPermissions?.collections?.[config.slug]
    const permissions = collectionPermissions ?? { fields: {} }

    // Return stats if provided
    if (stats) {
      return { permissions, stats }
    }

    return permissions
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}

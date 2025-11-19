import type { AllOperations, PayloadRequest } from '../types/index.js'
import type { PermissionStats } from '../utilities/getEntityPermissions/getEntityPermissions.js'
import type { Permissions, SanitizedPermissions } from './types.js'

import { getEntityPermissions } from '../utilities/getEntityPermissions/getEntityPermissions.js'
import { getEntityPolicies } from '../utilities/getEntityPolicies.js'
import { sanitizePermissions } from '../utilities/sanitizePermissions.js'

type GetAccessResultsArgs = {
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
export async function getAccessResults({
  legacy = false,
  req,
  stats,
}: GetAccessResultsArgs): Promise<SanitizedPermissions> {
  const results = {
    collections: {},
    globals: {},
  } as Permissions
  const { payload, user } = req

  const isLoggedIn = !!user
  const userCollectionConfig =
    user && user.collection ? payload?.collections?.[user.collection]?.config : null

  if (userCollectionConfig && payload.config.admin.user === user?.collection) {
    results.canAccessAdmin = userCollectionConfig.access.admin
      ? await userCollectionConfig.access.admin({ req })
      : isLoggedIn
  } else {
    results.canAccessAdmin = false
  }
  const blockReferencesPermissions = {}

  await Promise.all(
    payload.config.collections.map(async (collection) => {
      const collectionOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

      if (
        collection.auth &&
        typeof collection.auth.maxLoginAttempts !== 'undefined' &&
        collection.auth.maxLoginAttempts !== 0
      ) {
        collectionOperations.push('unlock')
      }

      if (collection.versions) {
        collectionOperations.push('readVersions')
      }

      const collectionPermissions = legacy
        ? await getEntityPolicies({
            type: 'collection',
            blockPolicies: blockReferencesPermissions,
            entity: collection,
            operations: collectionOperations,
            req,
            stats,
          })
        : await getEntityPermissions({
            blockReferencesPermissions,
            entity: collection,
            entityType: 'collection',
            fetchData: false,
            operations: collectionOperations,
            req,
            stats,
          })
      results.collections![collection.slug] = collectionPermissions
    }),
  )

  await Promise.all(
    payload.config.globals.map(async (global) => {
      const globalOperations: AllOperations[] = ['read', 'update']

      if (global.versions) {
        globalOperations.push('readVersions')
      }

      const globalPermissions = legacy
        ? await getEntityPolicies({
            type: 'global',
            blockPolicies: blockReferencesPermissions,
            entity: global,
            operations: globalOperations,
            req,
            stats,
          })
        : await getEntityPermissions({
            blockReferencesPermissions,
            entity: global,
            entityType: 'global',
            fetchData: false,
            operations: globalOperations,
            req,
            stats,
          })

      results.globals![global.slug] = globalPermissions
    }),
  )

  return sanitizePermissions(results)
}

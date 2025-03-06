// @ts-strict-ignore
import type { AllOperations, PayloadRequest } from '../types/index.js'
import type { Permissions, SanitizedPermissions } from './types.js'

import { getEntityPolicies } from '../utilities/getEntityPolicies.js'
import { sanitizePermissions } from '../utilities/sanitizePermissions.js'

type GetAccessResultsArgs = {
  req: PayloadRequest
}
export async function getAccessResults({
  req,
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
  const blockPolicies = {}

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

      const collectionPolicy = await getEntityPolicies({
        type: 'collection',
        blockPolicies,
        entity: collection,
        operations: collectionOperations,
        req,
      })
      results.collections[collection.slug] = collectionPolicy
    }),
  )

  await Promise.all(
    payload.config.globals.map(async (global) => {
      const globalOperations: AllOperations[] = ['read', 'update']

      if (global.versions) {
        globalOperations.push('readVersions')
      }

      const globalPolicy = await getEntityPolicies({
        type: 'global',
        blockPolicies,
        entity: global,
        operations: globalOperations,
        req,
      })
      results.globals[global.slug] = globalPolicy
    }),
  )

  return sanitizePermissions(results)
}

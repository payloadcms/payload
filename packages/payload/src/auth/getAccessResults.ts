import type { AllOperations, PayloadRequest } from '../types/index.js'
import type { Permissions } from './types.js'

import { getEntityPolicies } from '../utilities/getEntityPolicies.js'
import isolateObjectProperty from '../utilities/isolateObjectProperty.js'
import { sanitizePermissions } from '../utilities/sanitizePermissions.js'

type GetAccessResultsArgs = {
  req: PayloadRequest
}
export async function getAccessResults({ req }: GetAccessResultsArgs): Promise<Permissions> {
  const results = {} as Permissions
  const { payload, user } = req

  const isLoggedIn = !!user
  const userCollectionConfig =
    user && user.collection
      ? payload.config.collections.find((collection) => collection.slug === user.collection)
      : null

  if (userCollectionConfig && payload.config.admin.user === user.collection) {
    results.canAccessAdmin = userCollectionConfig.access.admin
      ? await userCollectionConfig.access.admin({ req })
      : isLoggedIn
  } else {
    results.canAccessAdmin = false
  }

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
        entity: collection,
        operations: collectionOperations,
        // Do not re-use our existing req object, as we need a new req.transactionID. Cannot re-use our existing one, as this is run in parallel (Promise.all above) which is
        // not supported on the same transaction ID. Not passing a transaction ID here creates a new transaction ID.
        req: isolateObjectProperty(req, 'transactionID'),
      })
      results.collections = {
        ...results.collections,
        [collection.slug]: collectionPolicy,
      }
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
        entity: global,
        operations: globalOperations,
        // Do not re-use our existing req object, as we need a new req.transactionID. Cannot re-use our existing one, as this is run in parallel (Promise.all above) which is
        // not supported on the same transaction ID. Not passing a transaction ID here creates a new transaction ID.
        req: isolateObjectProperty(req, 'transactionID'),
      })
      results.globals = {
        ...results.globals,
        [global.slug]: globalPolicy,
      }
    }),
  )

  return sanitizePermissions(results)
}

import type { AllOperations, PayloadRequest } from '../types'
import type { Permissions } from './types'

import { getEntityPolicies } from '../utilities/getEntityPolicies'

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

  if (userCollectionConfig) {
    results.canAccessAdmin = userCollectionConfig.access.admin
      ? await userCollectionConfig.access.admin({
          payload,
          user,
        })
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
        entity: collection,
        operations: collectionOperations,
        req,
        type: 'collection',
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
        entity: global,
        operations: globalOperations,
        req,
        type: 'global',
      })
      results.globals = {
        ...results.globals,
        [global.slug]: globalPolicy,
      }
    }),
  )

  return results
}

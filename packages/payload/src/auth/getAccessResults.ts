import type { PayloadT } from '..'
import type { AllOperations } from '../types'
import type { Permissions, User } from './types'

import { getEntityPolicies2 } from '../utilities/getEntityPolicies2'

type GetAccessResultsArgs = {
  data?: Record<string, unknown>
  payload: PayloadT
  searchParams: URLSearchParams
  user: User | null
}
export async function getAccessResults({
  data,
  payload,
  searchParams,
  user,
}: GetAccessResultsArgs): Promise<Permissions> {
  const results = {} as Permissions

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

      const collectionPolicy = await getEntityPolicies2({
        id: searchParams.get('id') || undefined,
        data,
        entity: collection,
        operations: collectionOperations,
        payload,
        type: 'collection',
        user,
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

      const globalPolicy = await getEntityPolicies2({
        data,
        entity: global,
        operations: globalOperations,
        payload,
        type: 'global',
        user,
      })
      results.globals = {
        ...results.globals,
        [global.slug]: globalPolicy,
      }
    }),
  )

  return results
}

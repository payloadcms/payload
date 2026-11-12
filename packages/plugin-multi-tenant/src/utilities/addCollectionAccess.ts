import type { CollectionConfig, Config } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { combineBaseAccessWithTenantAccess } from './combineBaseAccessWithTenantAccess.js'
import { combineCollectionAccessWithTenantAccess } from './combineCollectionAccessWithTenantAccess.js'

export type TenantAccessConfig = {
  accessResultCallback?: MultiTenantPluginConfig['usersAccessResultOverride']
  adminUsersSlug: string
  collection: CollectionConfig
  fieldName: string
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  userHasAccessToAllTenants: Required<MultiTenantPluginConfig>['userHasAccessToAllTenants']
}

export const addCollectionAccess = ({
  collectionAccessConfigs,
  config,
}: {
  collectionAccessConfigs: TenantAccessConfig[]
  config: Config
}): Config => {
  const { baseAccessBySlug, collectionAccessBySlug } = collectionAccessConfigs.reduce<{
    baseAccessBySlug: Map<string, TenantAccessConfig>
    collectionAccessBySlug: Map<string, TenantAccessConfig>
  }>(
    (acc, accessConfig) => {
      if (accessConfig.accessResultCallback) {
        acc.collectionAccessBySlug.set(accessConfig.collection.slug, accessConfig)
      } else {
        acc.baseAccessBySlug.set(accessConfig.collection.slug, accessConfig)
      }

      return acc
    },
    {
      baseAccessBySlug: new Map(),
      collectionAccessBySlug: new Map(),
    },
  )

  let updatedConfig = config

  // Override callbacks need the collection's own access result.
  if (collectionAccessBySlug.size) {
    updatedConfig = {
      ...updatedConfig,
      collections: updatedConfig.collections?.map((collection) => {
        const accessConfig = collectionAccessBySlug.get(collection.slug)

        if (!accessConfig) {
          return collection
        }

        return combineCollectionAccessWithTenantAccess({ ...accessConfig, collection })
      }),
    }
  }

  if (baseAccessBySlug.size) {
    updatedConfig = {
      ...updatedConfig,
      baseAccess: combineBaseAccessWithTenantAccess({
        accessConfigBySlug: baseAccessBySlug,
        baseAccess: config.baseAccess,
      }),
    }
  }

  return updatedConfig
}

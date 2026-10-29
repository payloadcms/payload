import type { CollectionConfig, Config } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { addTenantBaseAccess } from './addTenantBaseAccess.js'
import { addTenantCollectionAccess } from './addTenantCollectionAccess.js'

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
  const { accessConfigsWithoutOverrides, accessConfigsWithOverrides } =
    collectionAccessConfigs.reduce<{
      accessConfigsWithoutOverrides: TenantAccessConfig[]
      accessConfigsWithOverrides: TenantAccessConfig[]
    }>(
      (acc, accessConfig) => {
        if (accessConfig.accessResultCallback) {
          acc.accessConfigsWithOverrides.push(accessConfig)
        } else {
          acc.accessConfigsWithoutOverrides.push(accessConfig)
        }

        return acc
      },
      { accessConfigsWithoutOverrides: [], accessConfigsWithOverrides: [] },
    )
  let updatedConfig = config

  // Override callbacks need the collection's own access result.
  if (accessConfigsWithOverrides.length) {
    updatedConfig = {
      ...updatedConfig,
      collections: addCollectionAccessOverrides({
        accessConfigs: accessConfigsWithOverrides,
        collections: config.collections,
      }),
    }
  }

  if (accessConfigsWithoutOverrides.length) {
    updatedConfig = {
      ...updatedConfig,
      baseAccess: addTenantBaseAccess({
        accessConfigs: accessConfigsWithoutOverrides,
        baseAccess: config.baseAccess,
      }),
    }
  }

  return updatedConfig
}

const addCollectionAccessOverrides = ({
  accessConfigs,
  collections,
}: {
  accessConfigs: TenantAccessConfig[]
  collections: Config['collections']
}): Config['collections'] => {
  const accessConfigBySlug = new Map(
    accessConfigs.map((accessConfig) => [accessConfig.collection.slug, accessConfig]),
  )

  return collections?.map((collection) => {
    const accessConfig = accessConfigBySlug.get(collection.slug)

    if (!accessConfig) {
      return collection
    }

    return addTenantCollectionAccess({ ...accessConfig, collection })
  })
}

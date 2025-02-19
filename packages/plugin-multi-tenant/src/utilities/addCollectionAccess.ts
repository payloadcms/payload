import type { CollectionConfig } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { withTenantAccess } from './withTenantAccess.js'

type AllAccessKeys<T extends readonly string[]> = T[number] extends keyof Omit<
  Required<CollectionConfig>['access'],
  'admin'
>
  ? keyof Omit<Required<CollectionConfig>['access'], 'admin'> extends T[number]
    ? T
    : never
  : never

const collectionAccessKeys: AllAccessKeys<
  ['create', 'read', 'update', 'delete', 'readVersions', 'unlock']
> = ['create', 'read', 'update', 'delete', 'readVersions', 'unlock'] as const

type Args<ConfigType> = {
  collection: CollectionConfig
  fieldName: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}

/**
 * Adds tenant access constraint to collection
 * - constrains access a users assigned tenants
 */
export const addCollectionAccess = <ConfigType>({
  collection,
  fieldName,
  userHasAccessToAllTenants,
}: Args<ConfigType>): void => {
  collectionAccessKeys.forEach((key) => {
    if (!collection.access) {
      collection.access = {}
    }
    collection.access[key] = withTenantAccess<ConfigType>({
      accessFunction: collection.access?.[key],
      fieldName: key === 'readVersions' ? `version.${fieldName}` : fieldName,
      userHasAccessToAllTenants,
    })
  })
}

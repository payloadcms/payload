import type { Access, CollectionConfig } from 'payload'

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
 */
export const addCollectionAccess = <ConfigType>({
  collection,
  fieldName,
  userHasAccessToAllTenants,
}: Args<ConfigType>): void => {
  if (!collection?.access) {
    collection.access = {}
  }
  collectionAccessKeys.reduce<{
    [key in (typeof collectionAccessKeys)[number]]?: Access
  }>((acc, key) => {
    if (!collection.access) {
      return acc
    }
    collection.access[key] = withTenantAccess<ConfigType>({
      accessFunction: collection.access?.[key],
      fieldName,
      userHasAccessToAllTenants,
    })

    return acc
  }, {})
}

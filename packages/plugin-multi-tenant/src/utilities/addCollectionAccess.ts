import type { Access, CollectionConfig } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

import { withTenantAccess } from './withTenantAccess.js'

type AllAccessKeys<T extends readonly string[]> = T[number] extends keyof Omit<
  CollectionConfig['access'],
  'admin'
>
  ? keyof Omit<CollectionConfig['access'], 'admin'> extends T[number]
    ? T
    : never
  : never

const collectionAccessKeys: AllAccessKeys<
  ['create', 'read', 'update', 'delete', 'readVersions', 'unlock']
> = ['create', 'read', 'update', 'delete', 'readVersions', 'unlock'] as const

type Args = {
  collection: CollectionConfig
  fieldName: string
  userHasAccessToAllTenants: MultiTenantPluginConfig[Required<'userHasAccessToAllTenants'>]
}

/**
 * Adds tenant access constraint to collection
 */
export const addCollectionAccess = ({
  collection,
  fieldName,
  userHasAccessToAllTenants,
}: Args): void => {
  if (!collection.access) {
    collection.access = {}
  }
  collectionAccessKeys.reduce<{
    [key in (typeof collectionAccessKeys)[number]]?: Access
  }>((acc, key) => {
    collection.access[key] = withTenantAccess({
      accessFunction: collection.access?.[key],
      fieldName,
      userHasAccessToAllTenants,
    })

    return acc
  }, {})
}

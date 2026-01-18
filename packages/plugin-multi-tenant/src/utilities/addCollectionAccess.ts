import type { CollectionConfig } from '@ruya.sa/payload'

import type { AllAccessKeys, MultiTenantPluginConfig } from '../types.js'

import { withTenantAccess } from './withTenantAccess.js'

export const collectionAccessKeys: AllAccessKeys = [
  'create',
  'read',
  'update',
  'delete',
  'readVersions',
  'unlock',
] as const

type Args<ConfigType> = {
  accessResultCallback?: MultiTenantPluginConfig<ConfigType>['usersAccessResultOverride']
  adminUsersSlug: string
  collection: CollectionConfig
  fieldName: string
  tenantsArrayFieldName?: string
  tenantsArrayTenantFieldName?: string
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}

/**
 * Adds tenant access constraint to collection
 * - constrains access a users assigned tenants
 */
export const addCollectionAccess = <ConfigType>({
  accessResultCallback,
  adminUsersSlug,
  collection,
  fieldName,
  tenantsArrayFieldName,
  tenantsArrayTenantFieldName,
  userHasAccessToAllTenants,
}: Args<ConfigType>): void => {
  collectionAccessKeys.forEach((key) => {
    if (!collection.access) {
      collection.access = {}
    }
    collection.access[key] = withTenantAccess<ConfigType>({
      accessFunction: collection.access?.[key],
      accessKey: key,
      accessResultCallback,
      adminUsersSlug,
      collection,
      fieldName: key === 'readVersions' ? `version.${fieldName}` : fieldName,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      userHasAccessToAllTenants,
    })
  })
}

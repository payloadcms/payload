import type { CollectionConfig, User } from 'payload'

import type { MultiTenantPluginConfig } from '../types.js'

export const addHideTenantCollection = <ConfigType>({
  collection,
  userHasAccessToAllTenants,
}: {
  collection: CollectionConfig
  userHasAccessToAllTenants: Required<
    MultiTenantPluginConfig<ConfigType>
  >['userHasAccessToAllTenants']
}): void => {
  if (!collection?.admin) {
    collection.admin = {}
  }
  const userDefinedHiddenFunction = collection.admin.hidden
  const hiddenFunction: Required<CollectionConfig>['admin']['hidden'] = ({ user }) => {
    let hiddenResult = false
    if (typeof userDefinedHiddenFunction === 'function') {
      hiddenResult = userDefinedHiddenFunction({ user })
    } else if (typeof userDefinedHiddenFunction === 'boolean') {
      hiddenResult = userDefinedHiddenFunction
    }
    if (hiddenResult === true) {
      return true
    }

    if (user) {
      if (
        userHasAccessToAllTenants(
          user as ConfigType extends { user: unknown } ? ConfigType['user'] : User,
        )
      ) {
        return false
      }
      if (user.tenants && user.tenants.length > 1) {
        return false
      }
    }
    return true
  }

  collection.admin.hidden = hiddenFunction
}

import type { Config } from 'payload'

import type { MultiTenantPluginConfig } from './types.js'

import { tenantField } from './fields/tenantField/index.js'
import { userTenantsField } from './fields/userTenantsArrayField/index.js'
import { withTenantAccess } from './utilities/withTenantAccess.js'
import { withTenantListFilter } from './utilities/withTenantListFilter.js'

const defaults = {
  tenantCollectionSlug: 'tenants',
  tenantFieldName: 'tenant',
  userTenantsArrayFieldName: 'tenants',
}

export const multiTenantPlugin =
  (pluginConfig: MultiTenantPluginConfig) =>
  (incomingConfig: Config): Config => {
    if (pluginConfig.enabled === false) {
      return incomingConfig
    }

    /**
     * Set defaults
     */
    pluginConfig.userHasAccessToAllTenants =
      typeof pluginConfig.userHasAccessToAllTenants === 'function'
        ? pluginConfig.userHasAccessToAllTenants
        : () => false
    const tenantsCollectionSlug = (pluginConfig.tenantsSlug =
      pluginConfig.tenantsSlug || defaults.tenantCollectionSlug)
    const tenantFieldName = pluginConfig.documentTenantField.name || defaults.tenantFieldName

    /**
     * Add tenants array field to users collection
     */
    const adminUsersCollection = incomingConfig.collections.find(({ slug, auth }) => {
      if (incomingConfig.admin?.user) {
        return slug === incomingConfig.admin.user
      } else if (auth) {
        return true
      }
    })
    adminUsersCollection.fields.push(userTenantsField(pluginConfig.userTenantsField))

    const globalCollectionSlugs = []

    /**
     * Modify collections
     */
    incomingConfig.collections.forEach((collection) => {
      if (collection.slug === tenantsCollectionSlug) {
        /**
         * Modify tenants collection
         */
        collection.access = Object.keys(collection.access || {}).reduce((acc, key) => {
          const accessFunction = collection.access[key]
          acc[key] = withTenantAccess({
            accessFunction,
            userHasAccessToAllTenants: pluginConfig.userHasAccessToAllTenants,
          })

          return acc
        }, {})
      } else if (pluginConfig.collections?.[collection.slug]) {
        if (!collection.admin) {
          collection.admin = {}
        }
        /**
         * Add tenant field to enabled collections
         */
        collection.fields.push(
          tenantField({
            ...pluginConfig.documentTenantField,
            name: tenantFieldName,
            debug: pluginConfig.debug,
            tenantsCollectionSlug,
            unique: Boolean(pluginConfig.collections[collection.slug].isGlobal),
          }),
        )

        if (pluginConfig.collections[collection.slug].useBaseListFilter !== false) {
          /**
           * Collection baseListFilter with selected tenant constraint (if selected)
           */
          collection.admin.baseListFilter = withTenantListFilter({
            baseListFilter: collection.admin?.baseListFilter,
            tenantFieldName,
          })
        }

        if (pluginConfig.collections[collection.slug].useTenantAccess !== false) {
          /**
           * Collection access functions with user assigned tenant constraints
           */
          collection.access = Object.keys(collection.access || {}).reduce((acc, key) => {
            const accessFunction = collection.access[key]
            acc[key] = withTenantAccess({
              accessFunction,
              userHasAccessToAllTenants: pluginConfig.userHasAccessToAllTenants,
            })

            return acc
          }, {})
        }

        if (pluginConfig.collections[collection.slug].isGlobal) {
          globalCollectionSlugs.push(collection.slug)
        }
      }
    })

    if (!incomingConfig.admin?.components) {
      incomingConfig.admin.components = {
        actions: [],
        beforeNavLinks: [],
      }
    }
    /**
     * Add global redirect action
     */
    if (globalCollectionSlugs.length) {
      incomingConfig.admin.components.actions.push({
        path: '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect',
        serverProps: {
          globalSlugs: globalCollectionSlugs,
        },
      })
    }

    if (!incomingConfig.admin.components.beforeNavLinks) {
      incomingConfig.admin.components.beforeNavLinks = []
    }
    /**
     * Add tenant selector to admin UI
     */
    incomingConfig.admin.components.beforeNavLinks.push({
      clientProps: {
        tenantsCollectionSlug,
      },
      path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelector',
    })

    return incomingConfig
  }

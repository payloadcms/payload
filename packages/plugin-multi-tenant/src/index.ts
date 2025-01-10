import type { CollectionConfig, Config } from 'payload'

import type { MultiTenantPluginConfig } from './types.js'

import { tenantField } from './fields/tenantField/index.js'
import { tenantsArrayField } from './fields/tenantsArrayField/index.js'
import { withTenantAccess } from './utilities/withTenantAccess.js'
import { withTenantListFilter } from './utilities/withTenantListFilter.js'

const defaults = {
  tenantCollectionSlug: 'tenants',
  tenantFieldName: 'tenant',
  userTenantsArrayFieldName: 'tenants',
}

type AllAccessKeys<T extends readonly string[]> = T[number] extends keyof CollectionConfig['access']
  ? keyof CollectionConfig['access'] extends T[number]
    ? T
    : never
  : never

const collectionAccessKeys: AllAccessKeys<
  ['create', 'read', 'update', 'delete', 'admin', 'readVersions', 'unlock']
> = ['create', 'read', 'update', 'delete', 'admin', 'readVersions', 'unlock']

export const multiTenantPlugin =
  <ConfigType>(pluginConfig: MultiTenantPluginConfig<ConfigType>) =>
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
    const tenantFieldName = pluginConfig?.tenantField?.name || defaults.tenantFieldName

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

    /**
     * Add defaults for admin properties
     */
    if (!incomingConfig.admin?.components) {
      incomingConfig.admin.components = {
        actions: [],
        beforeNavLinks: [],
        providers: [],
      }
    }
    if (!incomingConfig.admin.components?.providers) {
      incomingConfig.admin.components.providers = []
    }
    if (!incomingConfig.admin.components?.actions) {
      incomingConfig.admin.components.actions = []
    }
    if (!incomingConfig.admin.components?.beforeNavLinks) {
      incomingConfig.admin.components.beforeNavLinks = []
    }

    /**
     * Add TenantSelectionProvider to admin providers
     */
    incomingConfig.admin.components.providers.push({
      path: '@payloadcms/plugin-multi-tenant/client#TenantSelectionProvider',
    })

    /**
     * Add tenants array field to users collection
     */
    if (pluginConfig?.tenantsArrayField?.includeDefaultField !== false) {
      adminUsersCollection.fields.push(tenantsArrayField(pluginConfig?.tenantsArrayField || {}))
    }

    const globalCollectionSlugs = []
    let tenantCollection: CollectionConfig | undefined

    /**
     * Modify collections
     */
    incomingConfig.collections.forEach((collection) => {
      if (collection.slug === tenantsCollectionSlug) {
        tenantCollection = collection
        /**
         * Modify tenants collection
         */
        collection.access = collectionAccessKeys.reduce((acc, key) => {
          acc[key] = withTenantAccess({
            accessFunction: collection?.access?.[key],
            fieldName: 'id',
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
        collection.fields.splice(
          0,
          0,
          tenantField({
            ...(pluginConfig?.tenantField || {}),
            name: tenantFieldName,
            debug: pluginConfig.debug,
            tenantsCollectionSlug,
            unique: Boolean(pluginConfig.collections[collection.slug].isGlobal),
            userHasAccessToAllTenants: pluginConfig.userHasAccessToAllTenants,
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
          collection.access = collectionAccessKeys.reduce((acc, key) => {
            acc[key] = withTenantAccess({
              accessFunction: collection?.access?.[key],
              fieldName: tenantFieldName,
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

    if (!tenantCollection) {
      throw new Error(`Tenants collection not found with slug: ${tenantsCollectionSlug}`)
    }

    /**
     * Add global redirect action
     */
    if (globalCollectionSlugs.length) {
      incomingConfig.admin.components.actions.push({
        path: '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect',
        serverProps: {
          globalSlugs: globalCollectionSlugs,
          tenantFieldName,
        },
      })
    }

    /**
     * Add tenant selector to admin UI
     */
    incomingConfig.admin.components.beforeNavLinks.push({
      clientProps: {
        tenantsCollectionSlug,
        useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
      },
      path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelector',
    })

    return incomingConfig
  }

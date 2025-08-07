import type { AcceptedLanguages } from '@payloadcms/translations'
import type { CollectionConfig, Config } from 'payload'

import { deepMergeSimple } from 'payload'

import type { PluginDefaultTranslationsObject } from './translations/types.js'
import type { MultiTenantPluginConfig } from './types.js'

import { defaults } from './defaults.js'
import { getTenantOptionsEndpoint } from './endpoints/getTenantOptionsEndpoint.js'
import { tenantField } from './fields/tenantField/index.js'
import { tenantsArrayField } from './fields/tenantsArrayField/index.js'
import { filterDocumentsByTenants } from './filters/filterDocumentsByTenants.js'
import { addTenantCleanup } from './hooks/afterTenantDelete.js'
import { translations } from './translations/index.js'
import { addCollectionAccess } from './utilities/addCollectionAccess.js'
import { addFilterOptionsToFields } from './utilities/addFilterOptionsToFields.js'
import { combineFilters } from './utilities/combineFilters.js'

export const multiTenantPlugin =
  <ConfigType>(pluginConfig: MultiTenantPluginConfig<ConfigType>) =>
  (incomingConfig: Config): Config => {
    if (pluginConfig.enabled === false) {
      return incomingConfig
    }

    /**
     * Set defaults
     */
    const userHasAccessToAllTenants: Required<
      MultiTenantPluginConfig<ConfigType>
    >['userHasAccessToAllTenants'] =
      typeof pluginConfig.userHasAccessToAllTenants === 'function'
        ? pluginConfig.userHasAccessToAllTenants
        : () => false
    const tenantsCollectionSlug = (pluginConfig.tenantsSlug =
      pluginConfig.tenantsSlug || defaults.tenantCollectionSlug)
    const tenantFieldName = pluginConfig?.tenantField?.name || defaults.tenantFieldName
    const tenantsArrayFieldName =
      pluginConfig?.tenantsArrayField?.arrayFieldName || defaults.tenantsArrayFieldName
    const tenantsArrayTenantFieldName =
      pluginConfig?.tenantsArrayField?.arrayTenantFieldName || defaults.tenantsArrayTenantFieldName
    const basePath = pluginConfig.basePath || defaults.basePath

    /**
     * Add defaults for admin properties
     */
    if (!incomingConfig.admin) {
      incomingConfig.admin = {}
    }
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
    if (!incomingConfig.collections) {
      incomingConfig.collections = []
    }

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

    if (!adminUsersCollection) {
      throw Error('An auth enabled collection was not found')
    }

    /**
     * Add tenants array field to users collection
     */
    if (pluginConfig?.tenantsArrayField?.includeDefaultField !== false) {
      adminUsersCollection.fields.push(
        tenantsArrayField({
          ...(pluginConfig?.tenantsArrayField || {}),
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
          tenantsCollectionSlug,
        }),
      )
    }

    addCollectionAccess({
      adminUsersSlug: adminUsersCollection.slug,
      collection: adminUsersCollection,
      fieldName: `${tenantsArrayFieldName}.${tenantsArrayTenantFieldName}`,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      userHasAccessToAllTenants,
    })

    if (pluginConfig.useUsersTenantFilter !== false) {
      if (!adminUsersCollection.admin) {
        adminUsersCollection.admin = {}
      }

      const baseFilter =
        adminUsersCollection.admin?.baseFilter ?? adminUsersCollection.admin?.baseListFilter
      adminUsersCollection.admin.baseFilter = combineFilters({
        baseFilter,
        customFilter: (args) =>
          filterDocumentsByTenants({
            filterFieldName: `${tenantsArrayFieldName}.${tenantsArrayTenantFieldName}`,
            req: args.req,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
          }),
      })
    }

    let tenantCollection: CollectionConfig | undefined

    const [collectionSlugs, globalCollectionSlugs] = Object.keys(pluginConfig.collections).reduce<
      [string[], string[]]
    >(
      (acc, slug) => {
        if (pluginConfig?.collections?.[slug]?.isGlobal) {
          acc[1].push(slug)
        } else {
          acc[0].push(slug)
        }

        return acc
      },
      [[], []],
    )

    /**
     * Modify collections
     */
    incomingConfig.collections.forEach((collection) => {
      /**
       * Modify tenants collection
       */
      if (collection.slug === tenantsCollectionSlug) {
        tenantCollection = collection

        if (pluginConfig.useTenantsCollectionAccess !== false) {
          /**
           * Add access control constraint to tenants collection
           * - constrains access a users assigned tenants
           */
          addCollectionAccess({
            adminUsersSlug: adminUsersCollection.slug,
            collection,
            fieldName: 'id',
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            userHasAccessToAllTenants,
          })
        }

        if (pluginConfig.useTenantsListFilter !== false) {
          /**
           * Add list filter to tenants collection
           * - filter by selected tenant
           */
          if (!collection.admin) {
            collection.admin = {}
          }

          const baseFilter = collection.admin?.baseFilter ?? collection.admin?.baseListFilter
          collection.admin.baseFilter = combineFilters({
            baseFilter,
            customFilter: (args) =>
              filterDocumentsByTenants({
                filterFieldName: 'id',
                req: args.req,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug,
              }),
          })
        }

        if (pluginConfig.cleanupAfterTenantDelete !== false) {
          /**
           * Add cleanup logic when tenant is deleted
           * - delete documents related to tenant
           * - remove tenant from users
           */
          addTenantCleanup({
            collection,
            enabledSlugs: [...collectionSlugs, ...globalCollectionSlugs],
            tenantFieldName,
            tenantsCollectionSlug,
            usersSlug: adminUsersCollection.slug,
            usersTenantsArrayFieldName: tenantsArrayFieldName,
            usersTenantsArrayTenantFieldName: tenantsArrayTenantFieldName,
          })
        }

        /**
         * Add custom tenant field that watches and dispatches updates to the selector
         */
        collection.fields.push({
          name: '_watchTenant',
          type: 'ui',
          admin: {
            components: {
              Field: {
                path: '@payloadcms/plugin-multi-tenant/client#WatchTenantCollection',
              },
            },
          },
        })

        collection.endpoints = [
          ...(collection.endpoints || []),
          getTenantOptionsEndpoint<ConfigType>({
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
            useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
            userHasAccessToAllTenants,
          }),
        ]
      } else if (pluginConfig.collections?.[collection.slug]) {
        const isGlobal = Boolean(pluginConfig.collections[collection.slug]?.isGlobal)

        if (isGlobal) {
          collection.disableDuplicate = true
        }

        /**
         * Modify enabled collections
         */
        addFilterOptionsToFields({
          config: incomingConfig,
          fields: collection.fields,
          tenantEnabledCollectionSlugs: collectionSlugs,
          tenantEnabledGlobalSlugs: globalCollectionSlugs,
          tenantFieldName,
          tenantsCollectionSlug,
        })

        const overrides = pluginConfig.collections[collection.slug]?.tenantFieldOverrides
          ? pluginConfig.collections[collection.slug]?.tenantFieldOverrides
          : pluginConfig.tenantField || {}

        /**
         * Add tenant field to enabled collections
         */
        collection.fields.splice(
          0,
          0,
          tenantField({
            name: tenantFieldName,
            debug: pluginConfig.debug,
            overrides,
            tenantsCollectionSlug,
            unique: isGlobal,
          }),
        )

        const { useBaseFilter, useBaseListFilter } = pluginConfig.collections[collection.slug] || {}

        if (useBaseFilter ?? useBaseListFilter ?? true) {
          /**
           * Add list filter to enabled collections
           * - filters results by selected tenant
           */
          if (!collection.admin) {
            collection.admin = {}
          }

          const baseFilter = collection.admin?.baseFilter ?? collection.admin?.baseListFilter
          collection.admin.baseFilter = combineFilters({
            baseFilter,
            customFilter: (args) =>
              filterDocumentsByTenants({
                filterFieldName: tenantFieldName,
                req: args.req,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug,
              }),
          })
        }

        if (pluginConfig.collections[collection.slug]?.useTenantAccess !== false) {
          /**
           * Add access control constraint to tenant enabled collection
           */
          addCollectionAccess({
            adminUsersSlug: adminUsersCollection.slug,
            collection,
            fieldName: tenantFieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            userHasAccessToAllTenants,
          })
        }
      }
    })

    if (!tenantCollection) {
      throw new Error(`Tenants collection not found with slug: ${tenantsCollectionSlug}`)
    }

    /**
     * Add TenantSelectionProvider to admin providers
     */
    incomingConfig.admin.components.providers.push({
      clientProps: {
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        tenantsCollectionSlug: tenantCollection.slug,
        useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
        userHasAccessToAllTenants,
      },
      path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider',
    })

    /**
     * Add global redirect action
     */
    if (globalCollectionSlugs.length) {
      incomingConfig.admin.components.actions.push({
        path: '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect',
        serverProps: {
          basePath,
          globalSlugs: globalCollectionSlugs,
          tenantFieldName,
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
          tenantsCollectionSlug,
          useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
          userHasAccessToAllTenants,
        },
      })
    }

    /**
     * Add tenant selector to admin UI
     */
    incomingConfig.admin.components.beforeNavLinks.push({
      clientProps: {
        label: pluginConfig.tenantSelectorLabel || undefined,
      },
      path: '@payloadcms/plugin-multi-tenant/client#TenantSelector',
    })

    /**
     * Merge plugin translations
     */
    if (!incomingConfig.i18n) {
      incomingConfig.i18n = {}
    }
    Object.entries(translations).forEach(([locale, pluginI18nObject]) => {
      const typedLocale = locale as AcceptedLanguages
      if (!incomingConfig.i18n!.translations) {
        incomingConfig.i18n!.translations = {}
      }
      if (!(typedLocale in incomingConfig.i18n!.translations)) {
        incomingConfig.i18n!.translations[typedLocale] = {}
      }
      if (!('plugin-multi-tenant' in incomingConfig.i18n!.translations[typedLocale]!)) {
        ;(incomingConfig.i18n!.translations[typedLocale] as PluginDefaultTranslationsObject)[
          'plugin-multi-tenant'
        ] = {} as PluginDefaultTranslationsObject['plugin-multi-tenant']
      }

      ;(incomingConfig.i18n!.translations[typedLocale] as PluginDefaultTranslationsObject)[
        'plugin-multi-tenant'
      ] = {
        ...pluginI18nObject.translations['plugin-multi-tenant'],
        ...(pluginConfig.i18n?.translations?.[typedLocale] || {}),
      }
    })

    return incomingConfig
  }

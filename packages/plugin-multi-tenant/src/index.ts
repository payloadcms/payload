import type { AcceptedLanguages } from '@payloadcms/translations'
import type { CollectionConfig, Config } from 'payload'

import chalk from 'chalk'
import { hasAutosaveEnabled } from 'payload/shared'

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
import { miniChalk } from './utilities/miniChalk.js'

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

    /**
     * Add defaults for admin properties
     */
    if (!incomingConfig.admin) {
      incomingConfig.admin = {}
    }
    if (!incomingConfig.admin?.components) {
      incomingConfig.admin.components = {
        actions: [],
        beforeNav: [],
        providers: [],
      }
    }
    if (!incomingConfig.admin.components?.providers) {
      incomingConfig.admin.components.providers = []
    }
    if (!incomingConfig.admin.components?.actions) {
      incomingConfig.admin.components.actions = []
    }
    if (!incomingConfig.admin.components?.beforeNav) {
      incomingConfig.admin.components.beforeNav = []
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
      accessResultCallback: pluginConfig.usersAccessResultOverride,
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
          filterDocumentsByTenants<ConfigType>({
            filterFieldName: `${tenantsArrayFieldName}.${tenantsArrayTenantFieldName}`,
            req: args.req,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
            userHasAccessToAllTenants,
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

    // used to track and not duplicate filterOptions on referenced blocks
    const blockReferencesWithFilters: string[] = []

    // used to validate enabled collection slugs
    const multiTenantCollectionsFound: string[] = []

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
                userHasAccessToAllTenants,
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
            disableBulkEdit: true,
            disableListColumn: true,
          },
        })

        collection.endpoints = [
          ...(collection.endpoints || []),
          getTenantOptionsEndpoint({
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
            useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
            userHasAccessToAllTenants,
          }),
        ]
      } else if (pluginConfig.collections?.[collection.slug]) {
        multiTenantCollectionsFound.push(collection.slug)
        const isGlobal = Boolean(pluginConfig.collections[collection.slug]?.isGlobal)

        if (isGlobal) {
          collection.disableDuplicate = true
        }

        if (!pluginConfig.debug && !isGlobal) {
          collection.admin ??= {}
          collection.admin.components ??= {}
          collection.admin.components.edit ??= {}
          collection.admin.components.edit.editMenuItems ??= []
          collection.admin.components.edit.editMenuItems.push({
            path: '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger',
          })
        }

        /**
         * Add filter options to all relationship fields
         */
        collection.fields = addFilterOptionsToFields({
          blockReferencesWithFilters,
          config: incomingConfig,
          fields: collection.fields,
          tenantEnabledCollectionSlugs: collectionSlugs,
          tenantEnabledGlobalSlugs: globalCollectionSlugs,
          tenantFieldName,
          tenantsArrayFieldName,
          tenantsArrayTenantFieldName,
          tenantsCollectionSlug,
          userHasAccessToAllTenants,
        })

        if (pluginConfig.collections[collection.slug]?.customTenantField !== true) {
          /**
           * Add tenant field to enabled collections
           */
          collection.fields.unshift(
            tenantField({
              name: tenantFieldName,
              debug: pluginConfig.debug,
              isAutosaveEnabled: hasAutosaveEnabled(collection),
              overrides: pluginConfig.collections[collection.slug]?.tenantFieldOverrides
                ? pluginConfig.collections[collection.slug]?.tenantFieldOverrides
                : pluginConfig.tenantField || {},
              tenantsArrayFieldName,
              tenantsArrayTenantFieldName,
              tenantsCollectionSlug,
              unique: isGlobal,
            }),
          )
        }

        const { useBaseFilter, useBaseListFilter } = pluginConfig.collections[collection.slug] || {}
        if (useBaseFilter ?? useBaseListFilter ?? true) {
          /**
           * Add list filter to enabled collections
           * - filters results by selected tenant
           */
          collection.admin = collection.admin || {}
          collection.admin.baseFilter = combineFilters({
            baseFilter: collection.admin?.baseFilter ?? collection.admin?.baseListFilter,
            customFilter: (args) =>
              filterDocumentsByTenants({
                filterFieldName: tenantFieldName,
                req: args.req,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug,
                userHasAccessToAllTenants,
              }),
          })
        }

        if (pluginConfig.collections[collection.slug]?.useTenantAccess !== false) {
          /**
           * Add access control constraint to tenant enabled collection
           */
          addCollectionAccess({
            accessResultCallback: pluginConfig.collections[collection.slug]?.accessResultOverride,
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

    if (
      multiTenantCollectionsFound.length !==
      collectionSlugs.length + globalCollectionSlugs.length
    ) {
      const missingSlugs = [...collectionSlugs, ...globalCollectionSlugs].filter(
        (slug) => !multiTenantCollectionsFound.includes(slug),
      )
      // eslint-disable-next-line no-console
      console.error(
        miniChalk.yellowBold('WARNING (plugin-multi-tenant)'),
        'missing collections',
        missingSlugs,
        'try placing the multi-tenant plugin after other plugins.',
      )
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
    incomingConfig.admin.components.beforeNav.push({
      clientProps: {
        enabledSlugs: [
          ...collectionSlugs,
          ...globalCollectionSlugs,
          adminUsersCollection.slug,
          tenantCollection.slug,
        ],
        label: pluginConfig.tenantSelectorLabel || undefined,
      },
      path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelector',
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

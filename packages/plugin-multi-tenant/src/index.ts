import type { AcceptedLanguages } from '@payloadcms/translations'
import type { Block, CollectionConfig } from 'payload'

import { definePlugin } from 'payload'
import { hasAutosaveEnabled } from 'payload/shared'

import type { MultiTenantPluginConfig } from './types.js'

import { defaults } from './defaults.js'
import { getTenantOptionsEndpoint } from './endpoints/getTenantOptionsEndpoint.js'
import { tenantField } from './fields/tenantField/index.js'
import { tenantsArrayField } from './fields/tenantsArrayField/index.js'
import { filterDocumentsByTenants } from './filters/filterDocumentsByTenants.js'
import { addTenantCleanup } from './hooks/afterTenantDelete.js'
import { enforceTenantMembership } from './hooks/enforceTenantMembership.js'
import { translations } from './translations/index.js'
import { addCollectionAccess, type TenantAccessConfig } from './utilities/addCollectionAccess.js'
import { addFilterOptionsToFields } from './utilities/addFilterOptionsToFields.js'
import { combineFilters } from './utilities/combineFilters.js'
import { miniChalk } from './utilities/miniChalk.js'

export const multiTenantPlugin = definePlugin<MultiTenantPluginConfig>({
  slug: '@payloadcms/plugin-multi-tenant',
  plugin: ({ config, options: pluginConfig }) => {
    if (pluginConfig.enabled === false) {
      return config
    }

    let incomingConfig = config

    /**
     * Set defaults
     */
    const userHasAccessToAllTenants: Required<MultiTenantPluginConfig>['userHasAccessToAllTenants'] =
      typeof pluginConfig.userHasAccessToAllTenants === 'function'
        ? pluginConfig.userHasAccessToAllTenants
        : () => false
    const tenantsCollectionSlug = pluginConfig.tenantsSlug || defaults.tenantCollectionSlug
    const tenantFieldName = pluginConfig?.tenantField?.name || defaults.tenantFieldName
    const tenantsArrayFieldName =
      pluginConfig?.tenantsArrayField?.arrayFieldName || defaults.tenantsArrayFieldName
    const tenantsArrayTenantFieldName =
      pluginConfig?.tenantsArrayField?.arrayTenantFieldName || defaults.tenantsArrayTenantFieldName
    const collectionAccessConfigs: TenantAccessConfig[] = []

    /**
     * Add tenants array field to users collection
     */
    const originalAdminUsersCollection = incomingConfig.collections?.find(({ slug, auth }) => {
      if (incomingConfig.admin?.user) {
        return slug === incomingConfig.admin.user
      } else if (auth) {
        return true
      }
    })

    if (!originalAdminUsersCollection) {
      throw Error('An auth enabled collection was not found')
    }

    let adminUsersCollection: CollectionConfig = originalAdminUsersCollection

    /**
     * Add tenants array field to users collection
     */
    if (pluginConfig?.tenantsArrayField?.includeDefaultField !== false) {
      adminUsersCollection = {
        ...adminUsersCollection,
        fields: [
          ...adminUsersCollection.fields,
          tenantsArrayField({
            ...(pluginConfig?.tenantsArrayField || {}),
            arrayFieldAccess: {
              create: ({ req }) => Boolean(req.user && userHasAccessToAllTenants(req.user)),
              update: ({ req }) => Boolean(req.user && userHasAccessToAllTenants(req.user)),
              ...(pluginConfig?.tenantsArrayField?.arrayFieldAccess || {}),
            },
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
          }),
        ],
      }
    }

    collectionAccessConfigs.push({
      accessResultCallback: pluginConfig.usersAccessResultOverride,
      adminUsersSlug: adminUsersCollection.slug,
      collection: adminUsersCollection,
      fieldName: `${tenantsArrayFieldName}.${tenantsArrayTenantFieldName}`,
      tenantsArrayFieldName,
      tenantsArrayTenantFieldName,
      userHasAccessToAllTenants,
    })

    if (pluginConfig.useUsersTenantFilter !== false) {
      const baseFilter =
        adminUsersCollection.admin?.baseFilter ?? adminUsersCollection.admin?.baseListFilter
      adminUsersCollection = {
        ...adminUsersCollection,
        admin: {
          ...adminUsersCollection.admin,
          baseFilter: combineFilters({
            baseFilter,
            customFilter: (args) =>
              filterDocumentsByTenants({
                filterFieldName: `${tenantsArrayFieldName}.${tenantsArrayTenantFieldName}`,
                req: args.req,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug,
                userHasAccessToAllTenants,
              }),
          }),
        },
      }
    }

    let tenantCollection: CollectionConfig | undefined

    const [collectionSlugs, globalCollectionSlugs] = Object.keys(pluginConfig.collections).reduce<
      [string[], string[]]
    >(
      (acc, slug) => {
        if (slug === adminUsersCollection.slug) {
          return acc
        }
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
    const collections = (incomingConfig.collections || []).map((originalCollection) => {
      let collection =
        originalCollection.slug === adminUsersCollection.slug
          ? adminUsersCollection
          : originalCollection
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
          collectionAccessConfigs.push({
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
          const baseFilter = collection.admin?.baseFilter ?? collection.admin?.baseListFilter
          collection = {
            ...collection,
            admin: {
              ...collection.admin,
              baseFilter: combineFilters({
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
              }),
            },
          }
        }

        if (pluginConfig.cleanupAfterTenantDelete !== false) {
          /**
           * Add cleanup logic when tenant is deleted
           * - delete documents related to tenant
           * - remove tenant from users
           */
          collection = addTenantCleanup({
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
        collection = {
          ...collection,
          endpoints: [
            ...(collection.endpoints || []),
            getTenantOptionsEndpoint({
              tenantsArrayFieldName,
              tenantsArrayTenantFieldName,
              tenantsCollectionSlug,
              useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
              userHasAccessToAllTenants,
            }),
          ],
          fields: [
            ...collection.fields,
            {
              name: '_watchTenant',
              type: 'ui',
              admin: {
                components: {
                  Field: {
                    path: '@payloadcms/plugin-multi-tenant/client#WatchTenantCollection',
                  },
                },
                disabled: { bulkEdit: true, column: true },
              },
            },
          ],
        }
        tenantCollection = collection
      } else if (pluginConfig.collections?.[collection.slug]) {
        if (collection.slug === adminUsersCollection.slug) {
          // eslint-disable-next-line no-console
          console.warn(
            `[plugin-multi-tenant] The admin users collection "${collection.slug}" should not be listed in pluginConfig.collections — it is already handled by the plugin. Skipping tenant-field processing for this collection to avoid double access control and validation errors.`,
          )
          return collection
        }
        multiTenantCollectionsFound.push(collection.slug)
        const isGlobal = Boolean(pluginConfig.collections[collection.slug]?.isGlobal)

        if (isGlobal) {
          collection = { ...collection, disableDuplicate: true }
        }

        if (!pluginConfig.debug && !isGlobal) {
          collection = {
            ...collection,
            admin: {
              ...collection.admin,
              components: {
                ...collection.admin?.components,
                edit: {
                  ...collection.admin?.components?.edit,
                  editMenuItems: [
                    ...(collection.admin?.components?.edit?.editMenuItems || []),
                    { path: '@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger' },
                  ],
                },
              },
            },
          }
        }

        /**
         * Add filter options to all relationship fields
         */
        collection = {
          ...collection,
          fields: addFilterOptionsToFields({
            blockReferencesWithFilters,
            fields: collection.fields,
            tenantEnabledCollectionSlugs: collectionSlugs,
            tenantEnabledGlobalSlugs: globalCollectionSlugs,
            tenantFieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
            userHasAccessToAllTenants,
          }),
        }

        if (pluginConfig.collections[collection.slug]?.customTenantField !== true) {
          /**
           * Add tenant field to enabled collections
           */
          collection = {
            ...collection,
            fields: [
              tenantField({
                name: tenantFieldName,
                adminUsersSlug: adminUsersCollection.slug,
                debug: pluginConfig.debug,
                isAutosaveEnabled: hasAutosaveEnabled(collection),
                overrides: pluginConfig.collections[collection.slug]?.tenantFieldOverrides
                  ? pluginConfig.collections[collection.slug]?.tenantFieldOverrides
                  : pluginConfig.tenantField || {},
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug,
                unique: isGlobal,
                userHasAccessToAllTenants,
              }),
              ...collection.fields,
            ],
          }
        }

        collection = {
          ...collection,
          hooks: {
            ...collection.hooks,
            beforeValidate: [
              ...(collection.hooks?.beforeValidate || []),
              enforceTenantMembership({
                collectionSlug: collection.slug,
                tenantFieldName,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                userHasAccessToAllTenants,
              }),
            ],
          },
        }

        const { useBaseFilter, useBaseListFilter } = pluginConfig.collections[collection.slug] || {}
        if (useBaseFilter ?? useBaseListFilter ?? true) {
          /**
           * Add list filter to enabled collections
           * - filters results by selected tenant
           */
          collection = {
            ...collection,
            admin: {
              ...collection.admin,
              baseFilter: combineFilters({
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
              }),
            },
          }
        }

        if (pluginConfig.collections[collection.slug]?.useTenantAccess !== false) {
          /**
           * Add access control constraint to tenant enabled collection
           */
          collectionAccessConfigs.push({
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
      return collection
    })

    incomingConfig = { ...incomingConfig, collections }

    // Referenced blocks are shared config objects. Transform each referenced definition once.
    const updatedBlocks = new Map<string, Block>()
    for (const slug of blockReferencesWithFilters) {
      const block = incomingConfig.blocks?.find((block) => block.slug === slug)
      if (block) {
        updatedBlocks.set(slug, {
          ...block,
          fields: addFilterOptionsToFields({
            blockReferencesWithFilters,
            fields: block.fields,
            tenantEnabledCollectionSlugs: collectionSlugs,
            tenantEnabledGlobalSlugs: globalCollectionSlugs,
            tenantFieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            tenantsCollectionSlug,
            userHasAccessToAllTenants,
          }),
        })
      }
    }
    if (updatedBlocks.size) {
      incomingConfig = {
        ...incomingConfig,
        blocks: incomingConfig.blocks?.map((block) => updatedBlocks.get(block.slug) || block),
      }
    }

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

    incomingConfig = addCollectionAccess({
      collectionAccessConfigs,
      config: incomingConfig,
    })

    const pluginTranslations = Object.fromEntries(
      Object.entries(translations).map(([locale, pluginI18nObject]) => {
        const typedLocale = locale as AcceptedLanguages

        return [
          locale,
          {
            ...incomingConfig.i18n?.translations?.[typedLocale],
            'plugin-multi-tenant': {
              ...pluginI18nObject.translations['plugin-multi-tenant'],
              ...(pluginConfig.i18n?.translations?.[typedLocale] || {}),
            },
          },
        ]
      }),
    )

    return {
      ...incomingConfig,
      admin: {
        ...incomingConfig.admin,
        components: {
          ...incomingConfig.admin?.components,
          actions: [
            ...(incomingConfig.admin?.components?.actions || []),
            ...(globalCollectionSlugs.length
              ? [
                  {
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
                  },
                ]
              : []),
          ],
          beforeNav: [
            ...(incomingConfig.admin?.components?.beforeNav || []),
            {
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
            },
          ],
          providers: [
            ...(incomingConfig.admin?.components?.providers || []),
            {
              clientProps: {
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug: tenantCollection.slug,
                useAsTitle: tenantCollection.admin?.useAsTitle || 'id',
                userHasAccessToAllTenants,
              },
              path: '@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider',
            },
          ],
        },
      },
      i18n: {
        ...incomingConfig.i18n,
        translations: {
          ...incomingConfig.i18n?.translations,
          ...pluginTranslations,
        },
      },
    }
  },
})

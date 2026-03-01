import type { I18nClient, TFunction } from '@payloadcms/translations'
import type { DeepPartial } from 'ts-essentials'

import type { ImportMap } from '../bin/generateImportMap/index.js'
import type { ClientBlock } from '../fields/config/types.js'
import type { BlockSlug, TypedUser } from '../index.js'
import type {
  ClientWidget,
  RootLivePreviewConfig,
  SanitizedConfig,
  ServerOnlyLivePreviewProperties,
} from './types.js'

import {
  type ClientCollectionConfig,
  createClientCollectionConfigs,
} from '../collections/config/client.js'
import { createClientBlocks, createClientFields } from '../fields/config/client.js'
import { type ClientGlobalConfig, createClientGlobalConfigs } from '../globals/config/client.js'

export type ServerOnlyRootProperties = keyof Pick<
  SanitizedConfig,
  | 'bin'
  | 'cors'
  | 'csrf'
  | 'custom'
  | 'db'
  | 'editor'
  | 'email'
  | 'endpoints'
  | 'graphQL'
  | 'hooks'
  | 'i18n'
  | 'jobs'
  | 'kv'
  | 'logger'
  | 'onInit'
  | 'plugins'
  | 'queryPresets'
  | 'secret'
  | 'sharp'
  | 'slugify'
  | 'typescript'
>

export type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>

export type ClientConfig = {
  admin: {
    dashboard?: {
      widgets: ClientWidget[]
    }
    livePreview?: Omit<RootLivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<SanitizedConfig['admin'], 'components' | 'dashboard' | 'dependencies' | 'livePreview'>
  blocks: ClientBlock[]
  blocksMap: Record<BlockSlug, ClientBlock>
  collections: ClientCollectionConfig[]
  custom?: Record<string, any>
  globals: ClientGlobalConfig[]
  unauthenticated?: boolean
} & Omit<SanitizedConfig, 'admin' | 'collections' | 'globals' | 'i18n' | ServerOnlyRootProperties>

export type UnauthenticatedClientConfig = {
  admin: {
    routes: ClientConfig['admin']['routes']
    user: ClientConfig['admin']['user']
  }
  collections: [
    {
      auth: ClientCollectionConfig['auth']
      slug: string
    },
  ]
  globals: []
  routes: ClientConfig['routes']
  serverURL: ClientConfig['serverURL']
  unauthenticated: true
}

export const serverOnlyAdminConfigProperties: readonly Partial<ServerOnlyRootAdminProperties>[] = []

export const serverOnlyConfigProperties: readonly Partial<ServerOnlyRootProperties>[] = [
  'endpoints',
  'db',
  'editor',
  'plugins',
  'sharp',
  'slugify',
  'onInit',
  'secret',
  'hooks',
  'bin',
  'i18n',
  'typescript',
  'cors',
  'csrf',
  'email',
  'custom',
  'graphQL',
  'jobs',
  'logger',
  'kv',
  'queryPresets',
  // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
]

export type CreateClientConfigArgs = {
  config: SanitizedConfig
  i18n: I18nClient
  importMap: ImportMap
  /**
   * If unauthenticated, the client config will omit some sensitive properties
   * such as field schemas, etc. This is useful for login and error pages where
   * the page source should not contain this information.
   *
   * For example, allow `true` to generate a client config for the "create first user" page
   * where there is no user yet, but the config should still be complete.
   */
  user: true | TypedUser
}

export const createUnauthenticatedClientConfig = ({
  clientConfig,
}: {
  /**
   * Send the previously generated client config to share memory when applicable.
   * E.g. the admin-enabled collection config can reference the existing collection rather than creating a new object.
   */
  clientConfig: ClientConfig
}): UnauthenticatedClientConfig => {
  /**
   * To share memory, find the admin user collection from the existing client config.
   */
  const adminUserCollection = clientConfig.collections.find(
    ({ slug }) => slug === clientConfig.admin.user,
  )!

  return {
    admin: {
      routes: clientConfig.admin.routes,
      user: clientConfig.admin.user,
    },
    collections: [
      {
        slug: adminUserCollection.slug,
        auth: adminUserCollection.auth,
      },
    ],
    globals: [],
    routes: clientConfig.routes,
    serverURL: clientConfig.serverURL,
    unauthenticated: true,
  }
}

export const createClientConfig = ({
  config,
  i18n,
  importMap,
}: CreateClientConfigArgs): ClientConfig => {
  const clientConfig = {} as DeepPartial<ClientConfig>

  for (const key in config) {
    if (serverOnlyConfigProperties.includes(key as any)) {
      continue
    }

    switch (key) {
      case 'admin':
        clientConfig.admin = {
          autoLogin: config.admin.autoLogin,
          autoRefresh: config.admin.autoRefresh,
          avatar: config.admin.avatar,
          custom: config.admin.custom,
          dateFormat: config.admin.dateFormat,
          importMap: config.admin.importMap,
          meta: config.admin.meta,
          routes: config.admin.routes,
          theme: config.admin.theme,
          timezones: config.admin.timezones,
          toast: config.admin.toast,
          user: config.admin.user,
        }

        if (config.admin.dashboard?.widgets) {
          ;(clientConfig.admin.dashboard ??= {}).widgets = config.admin.dashboard.widgets.map(
            (widget) => {
              const { ComponentPath: _, fields, label, ...rest } = widget
              return {
                ...rest,
                ...(fields?.length
                  ? {
                      fields: createClientFields({
                        defaultIDType: config.db.defaultIDType,
                        fields,
                        i18n,
                        importMap,
                      }),
                    }
                  : {}),
                // Resolve label function to string for client
                label:
                  typeof label === 'function' ? label({ i18n, t: i18n.t as TFunction }) : label,
              }
            },
          )
        }

        if (config.admin.livePreview) {
          clientConfig.admin.livePreview = {}

          if (config.admin.livePreview.breakpoints) {
            clientConfig.admin.livePreview.breakpoints = config.admin.livePreview.breakpoints
          }

          if (config.admin.livePreview.collections) {
            clientConfig.admin.livePreview.collections = config.admin.livePreview.collections
          }

          if (config.admin.livePreview.globals) {
            clientConfig.admin.livePreview.globals = config.admin.livePreview.globals
          }
        }

        break

      case 'blocks': {
        ;(clientConfig.blocks as ClientBlock[]) = createClientBlocks({
          blocks: config.blocks!,
          defaultIDType: config.db.defaultIDType,
          i18n,
          importMap,
        }).filter((block) => typeof block !== 'string') as ClientBlock[]

        clientConfig.blocksMap = {}
        if (clientConfig.blocks?.length) {
          for (const block of clientConfig.blocks) {
            if (!block?.slug) {
              continue
            }

            clientConfig.blocksMap[block.slug] = block as ClientBlock
          }
        }

        break
      }

      case 'collections':
        ;(clientConfig.collections as ClientCollectionConfig[]) = createClientCollectionConfigs({
          collections: config.collections,
          defaultIDType: config.db.defaultIDType,
          i18n,
          importMap,
        })

        break

      case 'folders':
        if (config.folders) {
          clientConfig.folders = {
            slug: config.folders.slug,
            browseByFolder: config.folders.browseByFolder,
            debug: config.folders.debug,
            fieldName: config.folders.fieldName,
          }
        }

        break

      case 'globals':
        ;(clientConfig.globals as ClientGlobalConfig[]) = createClientGlobalConfigs({
          defaultIDType: config.db.defaultIDType,
          globals: config.globals,
          i18n,
          importMap,
        })

        break

      case 'localization':
        if (typeof config.localization === 'object' && config.localization) {
          clientConfig.localization = {}

          if (config.localization.defaultLocale) {
            clientConfig.localization.defaultLocale = config.localization.defaultLocale
          }

          if (config.localization.defaultLocalePublishOption) {
            clientConfig.localization.defaultLocalePublishOption =
              config.localization.defaultLocalePublishOption
          }

          if (config.localization.fallback) {
            clientConfig.localization.fallback = config.localization.fallback
          }

          if (config.localization.localeCodes) {
            clientConfig.localization.localeCodes = config.localization.localeCodes
          }

          if (config.localization.locales) {
            clientConfig.localization.locales = []

            for (const locale of config.localization.locales) {
              if (locale) {
                const clientLocale: Partial<(typeof config.localization.locales)[0]> = {}

                if (locale.code) {
                  clientLocale.code = locale.code
                }

                if (locale.fallbackLocale) {
                  clientLocale.fallbackLocale = locale.fallbackLocale
                }

                if (locale.label) {
                  clientLocale.label = locale.label
                }

                if (locale.rtl) {
                  clientLocale.rtl = locale.rtl
                }

                clientConfig.localization.locales.push(clientLocale)
              }
            }
          }
        }

        break

      default:
        ;(clientConfig as any)[key] = config[key as keyof SanitizedConfig]
    }
  }

  return clientConfig as ClientConfig
}

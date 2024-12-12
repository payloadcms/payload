import type { I18nClient } from '@payloadcms/translations'
import type { DeepPartial } from 'ts-essentials'

import type { ImportMap } from '../bin/generateImportMap/index.js'
import type {
  LivePreviewConfig,
  SanitizedConfig,
  ServerOnlyLivePreviewProperties,
} from './types.js'

import {
  type ClientCollectionConfig,
  createClientCollectionConfigs,
} from '../collections/config/client.js'
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
  | 'jobs'
  | 'kv'
  | 'logger'
  | 'onInit'
  | 'plugins'
  | 'secret'
  | 'sharp'
  | 'typescript'
>

export type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>

export type ClientConfig = {
  admin: {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  } & Omit<SanitizedConfig['admin'], 'components' | 'dependencies' | 'livePreview'>
  collections: ClientCollectionConfig[]
  custom?: Record<string, any>
  globals: ClientGlobalConfig[]
  i18n?: Omit<SanitizedConfig['i18n'], 'supportedLanguages'>
} & Omit<SanitizedConfig, 'admin' | 'collections' | 'globals' | 'i18n' | ServerOnlyRootProperties>

export const serverOnlyAdminConfigProperties: readonly Partial<ServerOnlyRootAdminProperties>[] = []

export const serverOnlyConfigProperties: readonly Partial<ServerOnlyRootProperties>[] = [
  'endpoints',
  'db',
  'editor',
  'plugins',
  'sharp',
  'onInit',
  'secret',
  'hooks',
  'bin',
  'typescript',
  'cors',
  'csrf',
  'email',
  'custom',
  'graphQL',
  'jobs',
  'logger',
  'kv',
  // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
]

export const createClientConfig = ({
  config,
  i18n,
  importMap,
}: {
  config: SanitizedConfig
  i18n: I18nClient
  importMap: ImportMap
}): ClientConfig => {
  const clientConfig = {} as DeepPartial<ClientConfig>

  for (const key in config) {
    if (serverOnlyConfigProperties.includes(key as any)) {
      continue
    }
    switch (key) {
      case 'admin':
        clientConfig.admin = {
          autoLogin: config.admin.autoLogin,
          avatar: config.admin.avatar,
          custom: config.admin.custom,
          dateFormat: config.admin.dateFormat,
          disable: config.admin.disable,
          importMap: config.admin.importMap,
          meta: config.admin.meta,
          routes: config.admin.routes,
          theme: config.admin.theme,
          user: config.admin.user,
        }
        if (config.admin.livePreview) {
          clientConfig.admin.livePreview = {}

          if (config.admin.livePreview.breakpoints) {
            clientConfig.admin.livePreview.breakpoints = config.admin.livePreview.breakpoints
          }
        }
        break
      case 'collections':
        ;(clientConfig.collections as ClientCollectionConfig[]) = createClientCollectionConfigs({
          collections: config.collections,
          defaultIDType: config.db.defaultIDType,
          i18n,
          importMap,
        })
        break
      case 'globals':
        ;(clientConfig.globals as ClientGlobalConfig[]) = createClientGlobalConfigs({
          defaultIDType: config.db.defaultIDType,
          globals: config.globals,
          i18n,
          importMap,
        })
        break
      case 'i18n':
        clientConfig.i18n = {
          fallbackLanguage: config.i18n.fallbackLanguage,
          translations: config.i18n.translations,
        }
        break
      case 'localization':
        if (typeof config.localization === 'object' && config.localization) {
          clientConfig.localization = {}
          if (config.localization.defaultLocale) {
            clientConfig.localization.defaultLocale = config.localization.defaultLocale
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
        clientConfig[key] = config[key]
    }
  }
  return clientConfig as ClientConfig
}

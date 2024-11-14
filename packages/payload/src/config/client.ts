import type { I18nClient } from '@payloadcms/translations'

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
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

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
    components: null
    dependencies?: Record<string, React.ReactNode>
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
  // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
]

export const createClientConfig = ({
  config,
  i18n,
}: {
  config: SanitizedConfig
  i18n: I18nClient
}): ClientConfig => {
  // We can use deepCopySimple here, as the clientConfig should be JSON serializable anyways, since it will be sent from server => client
  const clientConfig = deepCopyObjectSimple(config, true) as unknown as ClientConfig

  for (const key of serverOnlyConfigProperties) {
    if (key in clientConfig) {
      delete clientConfig[key]
    }
  }

  if ('localization' in clientConfig && clientConfig.localization) {
    for (const locale of clientConfig.localization.locales) {
      delete locale.toString
    }
  }

  if (
    'i18n' in clientConfig &&
    'supportedLanguages' in clientConfig.i18n &&
    clientConfig.i18n.supportedLanguages
  ) {
    delete clientConfig.i18n.supportedLanguages
  }

  if (!clientConfig.admin) {
    clientConfig.admin = {} as ClientConfig['admin']
  }

  clientConfig.admin.components = null

  if (
    'livePreview' in clientConfig.admin &&
    clientConfig.admin.livePreview &&
    'url' in clientConfig.admin.livePreview
  ) {
    delete clientConfig.admin.livePreview.url
  }

  clientConfig.collections = createClientCollectionConfigs({
    collections: config.collections,
    defaultIDType: config.db.defaultIDType,
    i18n,
  })

  clientConfig.globals = createClientGlobalConfigs({
    defaultIDType: config.db.defaultIDType,
    globals: config.globals,
    i18n,
  })

  return clientConfig
}

import type { TFunction } from '@payloadcms/translations'

import type { ClientCollectionConfig } from '../collections/config/client.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { ClientGlobalConfig } from '../globals/config/client.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type {
  LivePreviewConfig,
  SanitizedConfig,
  ServerOnlyLivePreviewProperties,
} from './types.js'

import { createClientCollectionConfigs } from '../collections/config/client.js'
import { createClientGlobalConfigs } from '../globals/config/client.js'

export type ServerOnlyRootProperties = keyof Pick<
  SanitizedConfig,
  | 'bin'
  | 'cors'
  | 'csrf'
  | 'db'
  | 'editor'
  | 'email'
  | 'endpoints'
  | 'hooks'
  | 'onInit'
  | 'plugins'
  | 'secret'
  | 'sharp'
  | 'typescript'
>

export type ServerOnlyRootAdminProperties = keyof Pick<SanitizedConfig['admin'], 'components'>

export type ClientConfig = Omit<
  SanitizedConfig,
  'admin' | 'collections' | 'globals' | ServerOnlyRootProperties
> & {
  admin: Omit<SanitizedConfig['admin'], ServerOnlyRootAdminProperties & 'livePreview'> & {
    livePreview?: Omit<LivePreviewConfig, ServerOnlyLivePreviewProperties>
  }
  collections: ClientCollectionConfig[]
  globals: ClientGlobalConfig[]
}

export const createClientConfig = async ({
  config,
  t,
}: {
  config: SanitizedConfig
  t: TFunction
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<ClientConfig> => {
  const clientConfig: ClientConfig = { ...config }

  const serverOnlyConfigProperties: Partial<ServerOnlyRootProperties>[] = [
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
    // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
  ]

  serverOnlyConfigProperties.forEach((key) => {
    if (key in clientConfig) {
      delete clientConfig[key]
    }
  })

  if ('localization' in clientConfig && clientConfig.localization) {
    clientConfig.localization = { ...clientConfig.localization }

    clientConfig.localization.locales.forEach((locale) => {
      delete locale.toString
    })
  }

  if ('admin' in clientConfig) {
    clientConfig.admin = { ...clientConfig.admin }

    const serverOnlyAdminProperties: Partial<ServerOnlyRootAdminProperties>[] = ['components']

    serverOnlyAdminProperties.forEach((key) => {
      if (key in clientConfig.admin) {
        delete clientConfig.admin[key]
      }
    })

    if ('livePreview' in clientConfig.admin) {
      clientConfig.admin.livePreview = { ...clientConfig.admin.livePreview }
      delete clientConfig.admin.livePreview.url
    }
  }

  clientConfig.collections = createClientCollectionConfigs({
    collections: clientConfig.collections as SanitizedCollectionConfig[],
    t,
  })

  clientConfig.globals = createClientGlobalConfigs({
    globals: clientConfig.globals as SanitizedGlobalConfig[],
    t,
  })

  return clientConfig
}

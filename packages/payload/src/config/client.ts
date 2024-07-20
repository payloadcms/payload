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
  | 'custom'
  | 'db'
  | 'editor'
  | 'email'
  | 'endpoints'
  | 'graphQL'
  | 'hooks'
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
  } & Omit<SanitizedConfig['admin'], 'livePreview' & ServerOnlyRootAdminProperties>
  collections: ClientCollectionConfig[]
  custom?: Record<string, any>
  globals: ClientGlobalConfig[]
} & Omit<SanitizedConfig, 'admin' | 'collections' | 'globals' | ServerOnlyRootProperties>

const serverOnlyConfigProperties: readonly Partial<ServerOnlyRootProperties>[] = [
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
  // `admin`, `onInit`, `localization`, `collections`, and `globals` are all handled separately
]

const serverOnlyAdminProperties: readonly Partial<ServerOnlyRootAdminProperties>[] = ['components']

export const createClientConfig = async ({
  config,
  t,
}: {
  config: SanitizedConfig
  t: TFunction
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<ClientConfig> => {
  const clientConfig: ClientConfig = { ...config }

  for (const key of serverOnlyConfigProperties) {
    if (key in clientConfig) {
      delete clientConfig[key]
    }
  }

  if ('localization' in clientConfig && clientConfig.localization) {
    clientConfig.localization = { ...clientConfig.localization }

    for (const locale of clientConfig.localization.locales) {
      delete locale.toString
    }
  }

  if ('admin' in clientConfig) {
    clientConfig.admin = { ...clientConfig.admin }

    for (const key of serverOnlyAdminProperties) {
      if (key in clientConfig.admin) {
        delete clientConfig.admin[key]
      }
    }

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

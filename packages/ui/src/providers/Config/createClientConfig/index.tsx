import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, ClientGlobalConfig , LivePreviewConfig , Payload , SanitizedCollectionConfig , SanitizedConfig, SanitizedGlobalConfig, ServerOnlyLivePreviewProperties } from 'payload'

import { createClientCollectionConfigs } from './collections.js'
import { createClientGlobalConfigs } from './globals.js'

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
  children,
  config,
  i18n,
  payload,
}: {
  children: React.ReactNode
  config: SanitizedConfig
  i18n: I18nClient
  payload: Payload
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<{ clientConfig: ClientConfig; render: React.ReactNode }> => {
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
    t: i18n.t,
  })

  clientConfig.globals = createClientGlobalConfigs({
    globals: clientConfig.globals as SanitizedGlobalConfig[],
    t: i18n.t,
  })

  const NestProviders = ({
    children,
    providers,
  }: {
    children: React.ReactNode
    providers: React.FC<{ children?: React.ReactNode }>[]
  }) => {
    const Component = providers[0]
    if (providers.length > 1) {
      return (
        <Component>
          <NestProviders providers={providers.slice(1)}>{children}</NestProviders>
        </Component>
      )
    }
    return <Component>{children}</Component>
  }

  const render =
    Array.isArray(config.admin?.components?.providers) &&
    config.admin?.components?.providers.length > 0 ? (
      <NestProviders
        providers={config.admin?.components?.providers.map(
          (Component) =>
            getComponent({
              importMap,
              payloadComponent: Component,
            }).Component,
        )}
      >
        {children}
      </NestProviders>
    ) : (
      children
    )

  return { clientConfig, render }
}

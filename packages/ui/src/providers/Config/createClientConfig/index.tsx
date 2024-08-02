import type { I18nClient } from '@payloadcms/translations'
import {
  serverOnlyConfigProperties,
  type ClientConfig,
  type Payload,
  type SanitizedCollectionConfig,
  type SanitizedConfig,
  type SanitizedGlobalConfig,
} from 'payload'

import { createClientCollectionConfigs } from './collections.js'
import { createClientGlobalConfigs } from './globals.js'
import type { ImportMap } from 'packages/payload/src/bin/generateImportMap/index.js'
import { PayloadIcon } from '@payloadcms/ui'
import { getCreateMappedComponent, PayloadLogo } from '@payloadcms/ui/shared'

export const createClientConfig = async ({
  children,
  config,
  i18n,
  payload,
  importMap,
}: {
  children: React.ReactNode
  config: SanitizedConfig
  i18n: I18nClient
  payload: Payload
  importMap: ImportMap
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<{ clientConfig: ClientConfig; render: React.ReactNode }> => {
  const clientConfig: ClientConfig = { ...(config as any as ClientConfig) } // invert the type

  const createMappedComponent = getCreateMappedComponent({
    importMap,
    serverProps: {
      i18n,
      payload,
    },
  })

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

    clientConfig.admin.components.graphics.Icon = createMappedComponent(
      config.admin?.components?.graphics?.Icon,
      undefined,
      PayloadIcon,
    )

    clientConfig.admin.components.graphics.Logo = createMappedComponent(
      config.admin?.components?.graphics?.Logo,
      undefined,
      PayloadLogo,
    )

    clientConfig.admin.components.actions = createMappedComponent(config.admin?.components?.actions)

    clientConfig.admin.components.LogoutButton = createMappedComponent(
      config.admin?.components?.logout?.Button,
    )

    clientConfig.admin.components.Avatar = createMappedComponent(
      config.admin?.avatar &&
        typeof config.admin?.avatar === 'object' &&
        config.admin?.avatar &&
        'Component' in config.admin?.avatar &&
        config.admin?.avatar.Component,
    )

    if ('livePreview' in clientConfig.admin) {
      clientConfig.admin.livePreview = { ...clientConfig.admin.livePreview }
      // @ts-expect-error
      delete clientConfig.admin.livePreview.url
    }
  }

  clientConfig.collections = createClientCollectionConfigs({
    collections: clientConfig.collections as any as SanitizedCollectionConfig[], // invert the type
    t: i18n.t,
  })

  clientConfig.globals = createClientGlobalConfigs({
    globals: clientConfig.globals as any as SanitizedGlobalConfig[], // invert the type
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

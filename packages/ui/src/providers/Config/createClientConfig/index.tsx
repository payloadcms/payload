import type { I18nClient } from '@payloadcms/translations'

import {
  type AdminViewProps,
  type ClientConfig,
  type EditViewProps,
  type ImportMap,
  type Payload,
  type SanitizedCollectionConfig,
  type SanitizedConfig,
  type SanitizedGlobalConfig,
  serverOnlyConfigProperties,
} from 'payload'

import { PayloadIcon } from '../../../graphics/Icon/index.js'
import { PayloadLogo } from '../../../graphics/Logo/index.js'
import { createClientCollectionConfig, createClientCollectionConfigs } from './collections.js'
import { getComponent } from './getComponent.js'
import { getCreateMappedComponent } from './getCreateMappedComponent.js'
import { createClientGlobalConfig, createClientGlobalConfigs } from './globals.js'

export {
  createClientCollectionConfig,
  createClientCollectionConfigs,
  createClientGlobalConfig,
  createClientGlobalConfigs,
}

export const createClientConfig = async ({
  DefaultEditView,
  DefaultListView,
  children,
  config,
  i18n,
  importMap,
  payload,
}: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  children: React.ReactNode
  config: SanitizedConfig
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload

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

    clientConfig.admin.components = {
      Avatar: createMappedComponent(
        config.admin?.avatar &&
          typeof config.admin?.avatar === 'object' &&
          config.admin?.avatar &&
          'Component' in config.admin.avatar &&
          config.admin?.avatar.Component,
      ),
      LogoutButton: createMappedComponent(config.admin?.components?.logout?.Button),
      actions: config.admin?.components?.actions?.map((Component) =>
        createMappedComponent(Component),
      ),
      graphics: {
        Icon: createMappedComponent(
          config.admin?.components?.graphics?.Icon,
          undefined,
          PayloadIcon,
        ),
        Logo: createMappedComponent(
          config.admin?.components?.graphics?.Logo,
          undefined,
          PayloadLogo,
        ),
      },
    }

    if ('livePreview' in clientConfig.admin) {
      clientConfig.admin.livePreview = { ...clientConfig.admin.livePreview }
      // @ts-expect-error
      delete clientConfig.admin.livePreview.url
    }
  }

  clientConfig.collections = createClientCollectionConfigs({
    DefaultEditView,
    DefaultListView,
    collections: [...(clientConfig.collections as any as SanitizedCollectionConfig[])], // invert the type
    createMappedComponent,
    t: i18n.t,
  })

  clientConfig.globals = createClientGlobalConfigs({
    DefaultEditView,
    createMappedComponent,
    globals: [...(clientConfig.globals as any as SanitizedGlobalConfig[])], // invert the type
    t: i18n.t,
  })

  const NestProviders = ({
    children,
    providers,
  }: {
    readonly children: React.ReactNode
    readonly providers: React.FC<{ children?: React.ReactNode }>[]
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

import type { I18nClient } from '@payloadcms/translations'

import {
  type AdminViewProps,
  type ClientConfig,
  deepCopyObjectSimple,
  type EditViewProps,
  type ImportMap,
  type Payload,
  type PayloadComponent,
  type SanitizedConfig,
  serverOnlyConfigProperties,
} from 'payload'
import React from 'react'

import { createClientCollectionConfig, createClientCollectionConfigs } from './collections.js'
import { createClientField, createClientFields } from './fields.js'
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
  children,
  config,
  DefaultEditView,
  DefaultListView,
  i18n,
  importMap,
  payload,
}: {
  children: React.ReactNode
  config: SanitizedConfig
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  i18n: I18nClient
  importMap: ImportMap
  payload: Payload
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<{ clientConfig: ClientConfig; render: React.ReactNode }> => {
  // We can use deepCopySimple here, as the clientConfig should be JSON serializable anyways, since it will be sent from server => client
  const clientConfig: ClientConfig = deepCopyObjectSimple(config) as unknown as ClientConfig

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
    for (const locale of clientConfig.localization.locales) {
      delete locale.toString
      delete locale.access
    }
  }

  if ('admin' in clientConfig) {
    if (
      config.admin?.avatar &&
      typeof config.admin?.avatar === 'object' &&
      config.admin?.avatar &&
      'Component' in config.admin.avatar
    ) {
      clientConfig.admin.components.Avatar = createMappedComponent(
        config.admin.avatar.Component,
        undefined,
        undefined,
        'config.admin.avatar.Component',
      )
    }

    if (config.admin?.components?.logout?.Button) {
      clientConfig.admin.components.LogoutButton = createMappedComponent(
        config.admin.components.logout.Button,
        undefined,
        undefined,
        'config.admin.components.logout.Button',
      )
    }

    if (config.admin?.components?.actions && config.admin?.components?.actions.length > 0) {
      clientConfig.admin.components.actions = config.admin.components.actions.map((Component) =>
        createMappedComponent(Component, undefined, undefined, 'config.admin.components.actions'),
      )
    }

    if (config.admin?.components?.graphics?.Icon) {
      clientConfig.admin.components.graphics.Icon = createMappedComponent(
        config.admin.components.graphics.Icon,
        undefined,
        undefined,
        'config.admin.components.graphics.Icon',
      )
    }

    if (config.admin?.components?.graphics?.Logo) {
      clientConfig.admin.components.graphics.Logo = createMappedComponent(
        config.admin.components.graphics.Logo,
        undefined,
        undefined,
        'config.admin.components.graphics.Logo',
      )
    }

    if (config.admin?.dependencies) {
      clientConfig.admin.dependencies = {}
      for (const key in config.admin.dependencies) {
        const dependency = config.admin.dependencies[key]

        if (dependency.type === 'component') {
          const payloadComponent: PayloadComponent = {
            clientProps: dependency.clientProps,
            path: dependency.path,
            serverProps: dependency.serverProps,
          }

          clientConfig.admin.dependencies[key] = createMappedComponent(
            payloadComponent,
            undefined,
            undefined,
            `config.admin.dependencies.${key}`,
          )
          continue
        }
      }
    }
  }

  if (
    'livePreview' in clientConfig.admin &&
    clientConfig.admin.livePreview &&
    'url' in clientConfig.admin.livePreview
  ) {
    delete clientConfig.admin.livePreview.url
  }

  clientConfig.collections = createClientCollectionConfigs({
    clientCollections: clientConfig.collections,
    collections: config.collections,
    createMappedComponent,
    DefaultEditView,
    DefaultListView,
    i18n,
    importMap,
    payload,
  })

  clientConfig.globals = createClientGlobalConfigs({
    clientGlobals: clientConfig.globals,
    createMappedComponent,
    DefaultEditView,
    globals: config.globals,
    i18n,
    importMap,
    payload,
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
              identifier: 'config.admin?.components?.providers',
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
export { createClientField, createClientFields }

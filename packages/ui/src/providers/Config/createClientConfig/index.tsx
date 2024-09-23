import { getTranslation, type I18nClient } from '@payloadcms/translations'
import {
  type ClientConfig,
  type ClientField,
  deepCopyObjectSimple,
  type PayloadComponent,
  type SanitizedConfig,
  serverOnlyConfigProperties,
} from 'payload'

import type { getCreateMappedComponent } from './getCreateMappedComponent.js'

import { createClientCollectionConfig, createClientCollectionConfigs } from './collections.js'
import { createClientField, createClientFields } from './fields.js'
import { createClientGlobalConfig, createClientGlobalConfigs } from './globals.js'

export {
  createClientCollectionConfig,
  createClientCollectionConfigs,
  createClientGlobalConfig,
  createClientGlobalConfigs,
}

export const createClientConfig = async ({
  config,
  createMappedComponent,
  i18n,
}: {
  config: SanitizedConfig
  createMappedComponent: ReturnType<typeof getCreateMappedComponent>
  i18n: I18nClient
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<ClientConfig> => {
  // We can use deepCopySimple here, as the clientConfig should be JSON serializable anyways, since it will be sent from server => client
  const clientConfig = deepCopyObjectSimple(config) as unknown as ClientConfig

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

  clientConfig.collections = config.collections.map((collection) => ({
    slug: collection.slug,
    admin: {
      enableRichTextRelationship: collection.admin.enableRichTextRelationship,
      useAsTitle: collection.admin.useAsTitle,
    },
    auth: {
      loginWithUsername: collection.auth.loginWithUsername,
    },
    fields: collection.fields.reduce((acc, field) => {
      // TODO: map over all fields to create a "lite" version of the client field config (no components)
      // This is needed for places where _all_ collection are needing to be processed, for things like collection labels and useAsTitle
      // The full client configs are generated on-demand when the views are loaded
      acc.push({
        ...('name' in field ? { name: field.name } : {}),
        type: field.type,
        ...(field.type === 'date'
          ? {
              admin: {
                date: {
                  displayFormat: field?.admin?.date?.displayFormat,
                },
              },
            }
          : {}),
      } as ClientField)

      return acc
    }, [] as ClientField[]),
    labels: Object.entries(collection.labels).reduce(
      (acc, [labelType, collectionLabel]) => {
        if (typeof collectionLabel === 'function') {
          acc[labelType] = collectionLabel({ t: i18n.t })
        }

        if (typeof collectionLabel === 'object') {
          acc[labelType] = getTranslation(collectionLabel, i18n)
        }

        acc[labelType] = collectionLabel

        return acc
      },
      {
        plural: '',
        singular: '',
      },
    ),
    upload: collection.upload,
  }))

  clientConfig.globals = config.globals.map((global) => ({
    slug: global.slug,
  }))

  // clientConfig.collections = createClientCollectionConfigs({
  //   clientCollections: clientConfig.collections,
  //   collections: config.collections,
  //   createMappedComponent,
  //   i18n,
  //   importMap,
  //   payload,
  // })

  // clientConfig.globals = createClientGlobalConfigs({
  //   clientGlobals: clientConfig.globals,
  //   createMappedComponent,
  //   globals: config.globals,
  //   i18n,
  //   importMap,
  //   payload,
  // })

  // const NestProviders = ({
  //   children,
  //   providers,
  // }: {
  //   readonly children: React.ReactNode
  //   readonly providers: React.FC<{ children?: React.ReactNode }>[]
  // }) => {
  //   const Component = providers[0]
  //   if (providers.length > 1) {
  //     return (
  //       <Component>
  //         <NestProviders providers={providers.slice(1)}>{children}</NestProviders>
  //       </Component>
  //     )
  //   }
  //   return <Component>{children}</Component>
  // }

  // const render =
  //   Array.isArray(config.admin?.components?.providers) &&
  //   config.admin?.components?.providers.length > 0 ? (
  //     <NestProviders
  //       providers={config.admin?.components?.providers.map(
  //         (Component) =>
  //           getComponent({
  //             identifier: 'config.admin?.components?.providers',
  //             importMap,
  //             payloadComponent: Component,
  //           }).Component,
  //       )}
  //     >
  //       {children}
  //     </NestProviders>
  //   ) : (
  //     children
  //   )

  return clientConfig
}

export { createClientField, createClientFields }

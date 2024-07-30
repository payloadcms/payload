import type {
  AdminViewProps,
  EditViewProps,
  ImportMap,
  JsonObject,
  MappedComponent,
  Payload,
  PayloadComponent,
  ServerProps,
} from 'payload'

import { isReactServerComponentOrFunction } from 'payload/shared'
import React from 'react'

import type { ComponentMap } from './types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { PayloadIcon } from '../../../exports/client/index.js'
import { mapCollections } from './collections.js'
import { getComponent } from './getComponent.js'
import { getCreateMappedComponent } from './getCreateMappedComponent.js'
import { mapGlobals } from './globals.js'

export type CreateMappedComponent = {
  <T extends JsonObject>(
    component: { ReactComponent: React.FC<T> } | PayloadComponent<T> | null,
    props?: object,
    fallback?: React.FC,
  ): MappedComponent<T>

  <T extends JsonObject>(
    components: ({ ReactComponent: React.FC<T> } | PayloadComponent<T>)[],
    props?: object,
    fallback?: React.FC,
  ): MappedComponent<T>[]
}

export const buildComponentMap = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  children: React.ReactNode
  i18n: ServerProps['i18n']
  /**
   * The importMap is generated in packages/payload/src/bin/generateImportMap/index.ts
   * every time HMR runs, or when executing the `payload generate:importmap` command.
   */
  importMap: ImportMap
  payload: Payload
  readOnly?: boolean
}): {
  componentMap: ComponentMap
  wrappedChildren: React.ReactNode
} => {
  const { DefaultEditView, DefaultListView, children, i18n, importMap, payload, readOnly } = args
  const config = payload.config

  const createMappedComponent = getCreateMappedComponent({
    importMap,
    serverProps: {
      i18n,
      payload,
    },
  })

  const collections = mapCollections({
    DefaultEditView,
    DefaultListView,
    collections: config.collections,
    config,
    createMappedComponent,
    i18n,
    importMap,
    readOnly,
  })

  const globals = mapGlobals({
    args: {
      DefaultEditView,
      config,
      createMappedComponent,
      globals: config.globals,
      i18n,
      importMap,
      readOnly,
    },
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

  const LogoutButton = createMappedComponent(config.admin?.components?.logout?.Button)

  const Icon = createMappedComponent(
    config.admin?.components?.graphics?.Icon,
    undefined,
    PayloadIcon,
  )

  const custom = {}
  if (config?.admin?.adminDependencies) {
    for (const [key, dependency] of Object.entries(config.admin.adminDependencies)) {
      if (dependency.type === 'component') {
        const CustomComponent = importMap[dependency.path]

        if (isReactServerComponentOrFunction(CustomComponent)) {
          custom[key] = {
            type: 'server',
            Component: <CustomComponent {...dependency.serverProps} />,
          }
        } else {
          custom[key] = {
            type: 'client',
            Component: CustomComponent,
            props: dependency.clientProps,
          }
        }
      }
    }
  }

  const avatar = config?.admin?.avatar

  return {
    componentMap: {
      CustomAvatar: createMappedComponent(
        avatar && typeof avatar === 'object' && avatar && 'Component' in avatar && avatar.Component,
      ),
      Icon,
      LogoutButton,
      actions: createMappedComponent(config.admin?.components?.actions),
      collections,
      custom,
      globals,
    },
    wrappedChildren:
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
      ),
  }
}

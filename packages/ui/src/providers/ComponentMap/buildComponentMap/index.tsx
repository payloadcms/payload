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

import { PayloadIcon } from '../../../graphics/Icon/index.js'
import { mapCollections } from './collections.js'
import { getComponent } from './getComponent.js'
import { mapGlobals } from './globals.js'

export type CreateMappedComponent = {
  (
    payloadComponent: ({ ReactComponent: React.FC } | PayloadComponent)[],
    props?: object,
    fallback?: React.FC,
  ): MappedComponent[]
  (
    payloadComponent: { ReactComponent: React.FC } | PayloadComponent,
    props?: object,
    fallback?: React.FC,
  ): MappedComponent
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

  const createSingleMappedComponent = (
    payloadComponent: { ReactComponent: React.FC<any> } | PayloadComponent,
    key: number | string,
    props?: JsonObject,
    Fallback?: React.FC<any>,
  ): MappedComponent => {
    if (!payloadComponent) {
      if (!Fallback) {
        return undefined
      }
      if (isReactServerComponentOrFunction(Fallback)) {
        return {
          type: 'server',
          Component: <Fallback i18n={i18n} key={key} payload={payload} {...props} />,
        }
      } else {
        return {
          type: 'client',
          Component: Fallback,
          props,
        }
      }
    }
    const resolvedComponent =
      payloadComponent &&
      typeof payloadComponent === 'object' &&
      'ReactComponent' in payloadComponent
        ? {
            Component: payloadComponent.ReactComponent,
          }
        : getComponent({
            importMap,
            payloadComponent: payloadComponent as any,
          })

    if (!resolvedComponent.Component) {
      console.error(`Component not found in importMap: ${key}`)
    }

    if (isReactServerComponentOrFunction(resolvedComponent.Component)) {
      const Component: React.FC<any> = resolvedComponent.Component
      return {
        type: 'server',
        Component: (
          <Component
            i18n={i18n}
            key={key}
            payload={payload}
            {...resolvedComponent.serverProps}
            {...props}
          />
        ),
      }
    } else {
      return {
        type: 'client',
        Component: resolvedComponent.Component,
        props: {
          ...(resolvedComponent.clientProps || {}),
          ...props,
        },
      }
    }
  }

  const createMappedComponent: CreateMappedComponent = (payloadComponent, props, fallback) => {
    if (!payloadComponent && !fallback) {
      return undefined as any
    }
    if (payloadComponent && Array.isArray(payloadComponent)) {
      const mappedComponents: MappedComponent[] = []
      for (let i = 0; i < payloadComponent.length; i++) {
        const component = createSingleMappedComponent(payloadComponent[i], i, props, fallback)
        mappedComponents.push(component)
      }
      return mappedComponents as any
    } else {
      return createSingleMappedComponent(payloadComponent, undefined, props, fallback) as any
    }
  }

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

  return {
    componentMap: {
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

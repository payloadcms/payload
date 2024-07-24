import type {
  AdminViewProps,
  ComponentImportMap,
  EditViewProps,
  Payload,
  ResolvedComponent,
  ServerProps,
} from 'payload'

import React from 'react'

import type { ComponentMap } from './types.js'

import { WithServerSideProps as WithServerSidePropsGeneric } from '../../../elements/WithServerSideProps/index.js'
import { mapCollections } from './collections.js'
import { getComponent } from './getComponent.js'
import { mapGlobals } from './globals.js'

export type WithServerSidePropsPrePopulated = React.FC<{
  [key: string]: any
  Component: ResolvedComponent<any, any>
}>

export const buildComponentMap = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  children: React.ReactNode
  /**
   * The componentImportMap is generated in packages/payload/src/bin/generateComponentImportMap/index.ts
   * every time HMR runs, or when executing the `payload generatecomponentimportmap` command.
   */
  componentImportMap: ComponentImportMap
  i18n: ServerProps['i18n']
  payload: Payload
  readOnly?: boolean
}): {
  componentMap: ComponentMap
  wrappedChildren: React.ReactNode
} => {
  const {
    DefaultEditView,
    DefaultListView,
    children,
    componentImportMap,
    i18n,
    payload,
    readOnly,
  } = args
  const config = payload.config

  const WithServerSideProps: WithServerSidePropsPrePopulated = ({ Component, ...rest }) => {
    if (!Component.component) {
      return null
    }
    return (
      <WithServerSidePropsGeneric
        Component={Component.component}
        serverOnlyProps={{
          i18n,
          payload,
          ...(Component.serverProps || {}),
        }}
        {...rest}
        {...(Component.clientProps || {})}
      />
    )
  }

  const collections = mapCollections({
    DefaultEditView,
    DefaultListView,
    WithServerSideProps,
    collections: config.collections,
    componentImportMap,
    config,
    i18n,
    readOnly,
  })

  const globals = mapGlobals({
    args: {
      DefaultEditView,
      WithServerSideProps,
      componentImportMap,
      config,
      globals: config.globals,
      i18n,
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

  const LogoutButtonComponent = getComponent({
    componentImportMap,
    payloadComponent: config.admin?.components?.logout?.Button,
  })

  const LogoutButton = LogoutButtonComponent?.component ? (
    <WithServerSideProps Component={LogoutButtonComponent} />
  ) : null

  const IconComponent = getComponent({
    componentImportMap,
    payloadComponent: config.admin?.components?.graphics?.Icon,
  })

  const Icon = IconComponent?.component ? <WithServerSideProps Component={IconComponent} /> : null

  return {
    componentMap: {
      Icon,
      LogoutButton,
      actions: config.admin?.components?.actions?.map((Component, i) => (
        <WithServerSideProps
          Component={getComponent({
            componentImportMap,
            payloadComponent: Component,
          })}
          key={i}
        />
      )),
      collections,
      globals,
    },
    wrappedChildren:
      Array.isArray(config.admin?.components?.providers) &&
      config.admin?.components?.providers.length > 0 ? (
        <NestProviders
          providers={config.admin?.components?.providers.map(
            (Component) =>
              getComponent({
                componentImportMap,
                payloadComponent: Component,
              }).component,
          )}
        >
          {children}
        </NestProviders>
      ) : (
        children
      ),
  }
}

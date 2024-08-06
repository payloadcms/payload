import type {
  AdminViewProps,
  EditViewProps,
  Payload,
  ServerProps,
  WithServerSidePropsComponentProps,
} from 'payload'

import React from 'react'

import type { ComponentMap } from './types.js'

import { WithServerSideProps as WithServerSidePropsGeneric } from '../../../elements/WithServerSideProps/index.js'
import { mapCollections } from './collections.js'
import { mapGlobals } from './globals.js'

export type WithServerSidePropsPrePopulated = React.FC<
  Omit<WithServerSidePropsComponentProps, 'serverOnlyProps'>
>

export const buildComponentMap = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  children: React.ReactNode
  i18n: ServerProps['i18n']
  payload: Payload
  readOnly?: boolean
}): {
  componentMap: ComponentMap
  wrappedChildren: React.ReactNode
} => {
  const { DefaultEditView, DefaultListView, children, i18n, payload, readOnly } = args
  const config = payload.config

  const WithServerSideProps: WithServerSidePropsPrePopulated = ({ Component, ...rest }) => {
    return (
      <WithServerSidePropsGeneric
        Component={Component}
        serverOnlyProps={{
          i18n,
          payload,
        }}
        {...rest}
      />
    )
  }

  const collections = mapCollections({
    DefaultEditView,
    DefaultListView,
    WithServerSideProps,
    collections: config.collections,
    config,
    i18n,
    payload,
    readOnly,
  })

  const globals = mapGlobals({
    args: {
      DefaultEditView,
      WithServerSideProps,
      config,
      globals: config.globals,
      i18n,
      payload,
      readOnly,
    },
  })

  const NestProviders = ({ children, providers }) => {
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

  const LogoutButtonComponent = config.admin?.components?.logout?.Button

  const LogoutButton = LogoutButtonComponent ? (
    <WithServerSideProps Component={LogoutButtonComponent} />
  ) : null

  const IconComponent = config.admin?.components?.graphics?.Icon

  const Icon = IconComponent ? <WithServerSideProps Component={IconComponent} /> : null

  return {
    componentMap: {
      Icon,
      LogoutButton,
      actions: config.admin?.components?.actions?.map((Component, i) => (
        <WithServerSideProps Component={Component} key={i} />
      )),
      collections,
      globals,
    },
    wrappedChildren:
      Array.isArray(config.admin?.components?.providers) &&
      config.admin?.components?.providers.length > 0 ? (
        <NestProviders providers={config.admin?.components?.providers}>{children}</NestProviders>
      ) : (
        children
      ),
  }
}

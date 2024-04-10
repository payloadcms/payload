import type { I18n } from '@payloadcms/translations'
import type { AdminViewProps, EditViewProps, Payload, SanitizedConfig } from 'payload/types'

import { isReactServerComponent } from 'packages/payload/utilities.js'
import React from 'react'

import type { ComponentMap, WithPayload as WithPayloadType } from './types.js'

import { mapCollections } from './collections.js'
import { mapGlobals } from './globals.js'

export const buildComponentMap = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  children: React.ReactNode
  config: SanitizedConfig
  i18n: I18n
  payload: Payload
  readOnly?: boolean
}): {
  componentMap: ComponentMap
  wrappedChildren: React.ReactNode
} => {
  const { DefaultEditView, DefaultListView, children, config, i18n, payload, readOnly } = args

  const WithPayload: WithPayloadType = ({ Component, ...rest }) => {
    if (Component) {
      const WithPayload: React.FC<any> = (passedProps) => {
        const propsWithPayload = {
          ...passedProps,
          payload: isReactServerComponent(Component) ? payload : undefined,
        }

        return <Component {...propsWithPayload} />
      }

      return <WithPayload {...rest} />
    }

    return null
  }

  const collections = mapCollections({
    DefaultEditView,
    DefaultListView,
    WithPayload,
    collections: config.collections,
    config,
    i18n,
    readOnly,
  })

  const globals = mapGlobals({
    DefaultEditView,
    WithPayload,
    config,
    globals: config.globals,
    i18n,
    readOnly,
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
    <WithPayload Component={LogoutButtonComponent} />
  ) : null

  const IconComponent = config.admin?.components?.graphics?.Icon

  const Icon = IconComponent ? <WithPayload Component={IconComponent} /> : null

  return {
    componentMap: {
      Icon,
      LogoutButton,
      actions: config.admin?.components?.actions?.map((Component) => (
        <WithPayload Component={Component} />
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

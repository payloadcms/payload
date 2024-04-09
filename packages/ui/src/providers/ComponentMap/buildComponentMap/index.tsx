import type { I18n } from '@payloadcms/translations'
import type { AdminViewProps, EditViewProps, SanitizedConfig } from 'payload/types'

import React from 'react'

import type { ComponentMap } from './types.js'

import { mapCollections } from './collections.js'
import { mapGlobals } from './globals.js'

export const buildComponentMap = (args: {
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<AdminViewProps>
  children: React.ReactNode
  config: SanitizedConfig
  i18n: I18n
  readOnly?: boolean
}): {
  componentMap: ComponentMap
  wrappedChildren: React.ReactNode
} => {
  const { DefaultEditView, DefaultListView, children, config, i18n, readOnly } = args

  const collections = mapCollections({
    DefaultEditView,
    DefaultListView,
    collections: config.collections,
    config,
    i18n,
    readOnly,
  })

  const globals = mapGlobals({
    DefaultEditView,
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

  const LogoutButton = LogoutButtonComponent ? <LogoutButtonComponent /> : null

  const IconComponent = config.admin?.components?.graphics?.Icon

  const Icon = IconComponent ? <IconComponent /> : null

  return {
    componentMap: {
      Icon,
      LogoutButton,
      actions: config.admin?.components?.actions?.map((Component) => <Component />),
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

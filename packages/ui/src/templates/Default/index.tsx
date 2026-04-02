import type {
  CustomComponent,
  DocumentSubViewTypes,
  NavPreferences,
  PayloadRequest,
  ServerProps,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import React from 'react'

import type { WithViewRenderer } from '../../utilities/createViewRenderer.js'

import { DefaultNav } from '../../elements/Nav/index.js'
import './index.scss'
import { useViewRenderer } from '../../providers/ViewRenderer/index.js'
import { createViewRenderer } from '../../utilities/createViewRenderer.js'
import { DefaultTemplateShell } from './DefaultTemplateShell.js'

export type DefaultTemplateProps = {
  children?: React.ReactNode
  className?: string
  collectionSlug?: string
  docID?: number | string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  navPreferences?: NavPreferences
  req?: PayloadRequest
  viewActions?: CustomComponent[]
  viewType?: ViewTypes
  visibleEntities: VisibleEntities
} & ServerProps

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  children,
  className,
  collectionSlug,
  docID,
  documentSubViewType,
  globalSlug,
  i18n,
  locale,
  navPreferences,
  params,
  payload,
  permissions,
  req,
  searchParams,
  user,
  viewActions,
  viewType,
  visibleEntities,
}) => {
  const {
    admin: {
      avatar,
      components,
      components: { header: CustomHeader, Nav: CustomNav } = {
        header: undefined,
        Nav: undefined,
      },
    } = {},
  } = payload.config || {}
  const renderView = useViewRenderer() ?? createViewRenderer({ importMap: payload.importMap })

  const clientProps = {
    documentSubViewType,
    viewType,
    visibleEntities,
  }

  const serverProps: {
    collectionSlug: string
    docID: number | string
    globalSlug: string
    navPreferences?: NavPreferences
    req: PayloadRequest
  } & ServerProps &
    WithViewRenderer = {
    collectionSlug,
    docID,
    globalSlug,
    i18n,
    locale,
    navPreferences,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewRenderer: renderView,
  }

  const Actions: Record<string, React.ReactNode> = {}
  for (const action of viewActions ?? []) {
    if (!action) {
      continue
    }
    const key = typeof action === 'object' ? action.path : action
    Actions[key] = renderView({
      clientProps,
      Component: action,
      serverProps,
    })
  }

  const NavComponent = renderView({
    clientProps,
    Component: CustomNav,
    Fallback: DefaultNav,
    serverProps,
  })

  return (
    <DefaultTemplateShell
      actions={Actions}
      className={className}
      collectionSlug={collectionSlug}
      CustomAvatar={
        avatar !== 'gravatar' && avatar !== 'default'
          ? renderView({
              Component: avatar.Component,
              serverProps,
            })
          : undefined
      }
      CustomHeader={renderView({
        clientProps,
        Component: CustomHeader,
        serverProps,
      })}
      CustomIcon={
        components?.graphics?.Icon
          ? renderView({
              Component: components.graphics.Icon,
              serverProps,
            })
          : undefined
      }
      Nav={NavComponent}
      visibleEntities={visibleEntities}
    >
      {children}
    </DefaultTemplateShell>
  )
}

export { DefaultTemplateShell } from './DefaultTemplateShell.js'

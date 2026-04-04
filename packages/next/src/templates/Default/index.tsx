import type {
  CustomComponent,
  DocumentSubViewTypes,
  PayloadRequest,
  ServerProps,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import { DefaultTemplate as DefaultTemplateUI } from '@payloadcms/ui/templates/Default'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

export type DefaultTemplateProps = {
  children?: React.ReactNode
  className?: string
  collectionSlug?: string
  docID?: number | string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
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

  const clientProps = {
    documentSubViewType,
    viewType,
    visibleEntities,
  }

  const serverProps: {
    collectionSlug: string
    docID: number | string
    globalSlug: string
    req: PayloadRequest
  } & ServerProps = {
    collectionSlug,
    docID,
    globalSlug,
    i18n,
    locale,
    params,
    payload,
    permissions,
    renderComponent: RenderServerComponent,
    req,
    searchParams,
    user,
  }

  const Actions: Record<string, React.ReactNode> = {}
  for (const action of viewActions ?? []) {
    if (!action) {
      continue
    }
    const key = typeof action === 'object' ? action.path : action
    Actions[key] = RenderServerComponent({
      clientProps,
      Component: action,
      importMap: payload.importMap,
      serverProps,
    })
  }

  const NavComponent = RenderServerComponent({
    clientProps,
    Component: CustomNav,
    Fallback: DefaultNav,
    importMap: payload.importMap,
    serverProps,
  })

  return (
    <DefaultTemplateUI
      Actions={Actions}
      className={className}
      collectionSlug={collectionSlug}
      CustomAvatar={
        avatar !== 'gravatar' && avatar !== 'default'
          ? RenderServerComponent({
              Component: avatar.Component,
              importMap: payload.importMap,
              serverProps,
            })
          : undefined
      }
      CustomHeader={RenderServerComponent({
        clientProps,
        Component: CustomHeader,
        importMap: payload.importMap,
        serverProps,
      })}
      CustomIcon={
        components?.graphics?.Icon
          ? RenderServerComponent({
              Component: components.graphics.Icon,
              importMap: payload.importMap,
              serverProps,
            })
          : undefined
      }
      NavComponent={NavComponent}
      visibleEntities={visibleEntities}
    >
      {children}
    </DefaultTemplateUI>
  )
}

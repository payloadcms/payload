import type {
  CustomComponent,
  DocumentSubViewTypes,
  PayloadRequest,
  ServerProps,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { isUserMenuSettingsGroup } from 'payload/shared'

import './index.css'

import React from 'react'

/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary */
import {
  ActionsProvider,
  AppHeader,
  BulkUploadProvider,
  CommandPalette,
  EntityVisibilityProvider,
  DefaultTemplateWrapper as Wrapper,
} from '../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */
import type { UserMenuSettingsGroup } from '../../elements/UserMenu/SettingsMenu/index.js'

import { DefaultNav } from '../../elements/Nav/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

const baseClass = 'template-default'

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
} & Omit<ServerProps, 'server'>

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
    req,
    searchParams,
    server: req?.server,
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

  const settingsItemGroups: UserMenuSettingsGroup[] = []
  if (components?.userMenuSettingsItems && Array.isArray(components.userMenuSettingsItems)) {
    const groupedItemsByLabel = new Map<string, React.ReactNode[]>()
    const groupLabels: string[] = []
    const ungroupedItems: React.ReactNode[] = []

    for (const [itemIndex, userMenuSettingsItem] of components.userMenuSettingsItems.entries()) {
      // Ungrouped items are collected as orphans rendered at the bottom
      if (!isUserMenuSettingsGroup(userMenuSettingsItem)) {
        ungroupedItems.push(
          RenderServerComponent({
            clientProps,
            Component: userMenuSettingsItem,
            importMap: payload.importMap,
            key: `user-menu-settings-ungrouped-${itemIndex}`,
            serverProps,
          }),
        )

        continue
      }

      const groupLabel = getTranslation(userMenuSettingsItem.group, i18n)
      const existingItems = groupedItemsByLabel.get(groupLabel)
      const renderedItems = userMenuSettingsItem.items.map((groupedItem, groupedItemIndex) =>
        RenderServerComponent({
          clientProps,
          Component: groupedItem,
          importMap: payload.importMap,
          key: `user-menu-settings-group-${groupLabel}-${itemIndex}-${groupedItemIndex}`,
          serverProps,
        }),
      )

      if (existingItems) {
        existingItems.push(...renderedItems)
      } else if (renderedItems.length > 0) {
        groupedItemsByLabel.set(groupLabel, renderedItems)
        groupLabels.push(groupLabel)
      }
    }

    for (const groupLabel of groupLabels) {
      const items = groupedItemsByLabel.get(groupLabel)
      if (items?.length) {
        settingsItemGroups.push({
          group: groupLabel,
          items,
        })
      }
    }

    if (ungroupedItems.length > 0) {
      settingsItemGroups.push({
        items: ungroupedItems,
      })
    }
  }

  const NavComponent = RenderServerComponent({
    clientProps,
    Component: CustomNav,
    Fallback: DefaultNav,
    importMap: payload.importMap,
    serverProps,
  })

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <CommandPalette />
      <BulkUploadProvider modalSlugPrefix={collectionSlug}>
        <ActionsProvider Actions={Actions}>
          {RenderServerComponent({
            clientProps,
            Component: CustomHeader,
            importMap: payload.importMap,
            serverProps,
          })}
          <div style={{ position: 'relative' }}>
            <Wrapper baseClass={baseClass} className={className}>
              {NavComponent}
              <div className={`${baseClass}__wrap`}>
                <AppHeader
                  CustomAvatar={
                    avatar !== 'gravatar' && avatar !== 'default'
                      ? RenderServerComponent({
                          Component: avatar.Component,
                          importMap: payload.importMap,
                          serverProps,
                        })
                      : undefined
                  }
                  settingsItemGroups={settingsItemGroups}
                />
                {children}
              </div>
            </Wrapper>
          </div>
        </ActionsProvider>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  )
}

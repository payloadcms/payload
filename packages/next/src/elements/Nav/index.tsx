import type { PayloadRequest, ServerProps } from 'payload'

import { Logout } from '@payloadcms/ui'
import { DefaultNav as DefaultNavUI } from '@payloadcms/ui/elements/Nav'
import { getNavData } from '@payloadcms/ui/elements/Nav/getNavData'
import React from 'react'

import { RenderServerComponent } from '../RenderServerComponent/index.js'

export type NavProps = {
  req?: PayloadRequest
} & ServerProps

export const DefaultNav: React.FC<NavProps> = async (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props

  if (!payload?.config) {
    return null
  }

  const {
    admin: {
      components: { afterNav, afterNavLinks, beforeNav, beforeNavLinks, logout, settingsMenu },
    },
  } = payload.config

  const { groups, navPreferences } = await getNavData({
    i18n,
    permissions,
    req,
    visibleEntities,
  })

  const clientProps = { documentSubViewType, viewType }
  const serverProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    renderComponent: RenderServerComponent,
    searchParams,
    user,
  }

  const LogoutComponent = RenderServerComponent({
    clientProps,
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item, index) =>
          RenderServerComponent({
            clientProps,
            Component: item,
            importMap: payload.importMap,
            key: `settings-menu-item-${index}`,
            serverProps,
          }),
        )
      : []

  return (
    <DefaultNavUI
      afterNav={RenderServerComponent({
        clientProps,
        Component: afterNav,
        importMap: payload.importMap,
        serverProps,
      })}
      afterNavLinks={RenderServerComponent({
        clientProps,
        Component: afterNavLinks,
        importMap: payload.importMap,
        serverProps,
      })}
      beforeNav={RenderServerComponent({
        clientProps,
        Component: beforeNav,
        importMap: payload.importMap,
        serverProps,
      })}
      beforeNavLinks={RenderServerComponent({
        clientProps,
        Component: beforeNavLinks,
        importMap: payload.importMap,
        serverProps,
      })}
      groups={groups}
      logoutComponent={LogoutComponent}
      navPreferences={navPreferences}
      settingsMenu={RenderedSettingsMenu}
    />
  )
}

import type { PayloadRequest, ServerProps } from 'payload'

import { AlignJustifiedIcon, Logout } from '@payloadcms/ui'
import { getNavData } from '@payloadcms/ui/elements/Nav/getNavData'
import { DefaultNavClient } from '@payloadcms/ui/elements/Nav/index.client'
import { NavWrapper } from '@payloadcms/ui/elements/Nav/NavWrapper'
import { SettingsMenuButton } from '@payloadcms/ui/elements/Nav/SettingsMenuButton'
import React from 'react'

import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { SidebarTabs } from './SidebarTabs/index.js'
import './index.css'

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
    payload,
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

  const RenderedBeforeNav = RenderServerComponent({
    clientProps,
    Component: beforeNav,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedBeforeNavLinks = RenderServerComponent({
    clientProps,
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedAfterNavLinks = RenderServerComponent({
    clientProps,
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedAfterNav = RenderServerComponent({
    clientProps,
    Component: afterNav,
    importMap: payload.importMap,
    serverProps,
  })

  const allTabs = [
    {
      slug: 'nav',
      components: {
        Content: (
          <>
            {RenderedBeforeNavLinks}
            <DefaultNavClient groups={groups} navPreferences={navPreferences} />
            {RenderedAfterNavLinks}
          </>
        ),
        Icon: <AlignJustifiedIcon size={24} />,
      },
      isDefaultActive: true,
      label: i18n.t('general:collections'),
    },
    ...(payload.config.admin?.components?.sidebar?.tabs?.filter((tab) => !tab.disabled) || []),
  ]

  const baseClass = 'nav'

  return (
    <NavWrapper baseClass={baseClass}>
      {RenderedBeforeNav}
      <nav className={`${baseClass}__wrap`}>
        <SidebarTabs
          documentSubViewType={documentSubViewType}
          i18n={i18n}
          locale={locale}
          navPreferences={navPreferences}
          params={params}
          payload={payload}
          permissions={permissions}
          req={req}
          searchParams={searchParams}
          tabs={allTabs}
          user={user}
          viewType={viewType}
        />
        <div className={`${baseClass}__controls`}>
          <SettingsMenuButton settingsMenu={RenderedSettingsMenu} />
          {LogoutComponent}
        </div>
      </nav>
      {RenderedAfterNav}
    </NavWrapper>
  )
}

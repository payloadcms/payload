import type { PayloadRequest, ServerProps } from 'payload'

import React from 'react'

import { AlignJustifiedIcon } from '../../icons/AlignJustified/index.js'
import { Logout } from '../Logout/index.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { getNavData } from './getNavData.js'
import { DefaultNavClient } from './index.client.js'
import { NavWrapper } from './NavWrapper/index.js'
import { SettingsMenuButton } from './SettingsMenuButton/index.js'
import { SidebarTabs } from './SidebarTabs/index.js'
import './index.css'

export type NavServerProps = {
  req?: PayloadRequest
} & ServerProps

export const DefaultNavServer: React.FC<NavServerProps> = async (props) => {
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

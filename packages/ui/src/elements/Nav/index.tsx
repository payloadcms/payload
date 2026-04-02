import type { PayloadRequest, ServerProps } from 'payload'

import React from 'react'

import type { WithViewRenderer } from '../../utilities/createViewRenderer.js'
import type { EntityToGroup } from '../../utilities/groupNavItems.js'

import { createViewRenderer } from '../../utilities/createViewRenderer.js'
import { EntityType, groupNavItems } from '../../utilities/groupNavItems.js'
import { Logout } from '../Logout/index.js'
import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import { SettingsMenuButton } from './SettingsMenuButton/index.js'
import './index.scss'

const baseClass = 'nav'

import { getNavPrefs } from './getNavPrefs.js'
import { DefaultNavClient } from './index.client.js'

export type NavProps = {
  req?: PayloadRequest
} & ServerProps &
  WithViewRenderer

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

  const renderView = props.viewRenderer ?? createViewRenderer({ importMap: payload.importMap })

  const {
    admin: {
      components: { afterNav, afterNavLinks, beforeNav, beforeNavLinks, logout, settingsMenu },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities.collections.includes(slug))
        .map(
          (collection) =>
            ({
              type: EntityType.collection,
              entity: collection,
            }) satisfies EntityToGroup,
        ),
      ...globals
        .filter(({ slug }) => visibleEntities.globals.includes(slug))
        .map(
          (global) =>
            ({
              type: EntityType.global,
              entity: global,
            }) satisfies EntityToGroup,
        ),
    ],
    permissions,
    i18n,
  )

  const navPreferences = await getNavPrefs(req)
  const serverProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user,
    viewRenderer: renderView,
  } satisfies ServerProps & WithViewRenderer

  const LogoutComponent = renderView({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: logout?.Button,
    Fallback: Logout,
    serverProps,
  })

  const RenderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item, index) =>
          renderView({
            clientProps: {
              documentSubViewType,
              viewType,
            },
            Component: item,
            key: `settings-menu-item-${index}`,
            serverProps,
          }),
        )
      : []

  const RenderedBeforeNav = renderView({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: beforeNav,
    serverProps,
  })

  const RenderedBeforeNavLinks = renderView({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: beforeNavLinks,
    serverProps,
  })

  const RenderedAfterNavLinks = renderView({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: afterNavLinks,
    serverProps,
  })

  const RenderedAfterNav = renderView({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: afterNav,
    serverProps,
  })

  return (
    <NavWrapper baseClass={baseClass}>
      {RenderedBeforeNav}
      <nav className={`${baseClass}__wrap`}>
        {RenderedBeforeNavLinks}
        <DefaultNavClient groups={groups} navPreferences={navPreferences} />
        {RenderedAfterNavLinks}
        <div className={`${baseClass}__controls`}>
          <SettingsMenuButton settingsMenu={RenderedSettingsMenu} />
          {LogoutComponent}
        </div>
      </nav>
      {RenderedAfterNav}
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}

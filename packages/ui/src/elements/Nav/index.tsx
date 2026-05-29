import type { PayloadRequest, ServerProps } from 'payload'

import { EntityType } from 'payload'
import React from 'react'

import type { EntityToGroup } from '../../utilities/groupNavItems.js'

/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary */
import {
  DefaultNavClient,
  Logout,
  NavWrapper,
  SettingsMenuButton,
} from '../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */
import { AlignJustifiedIcon } from '../../icons/AlignJustified/index.js'
import { groupNavItems } from '../../utilities/groupNavItems.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { SidebarTabs } from './SidebarTabs/index.js'
import './index.css'

const baseClass = 'nav'

import { getNavPrefs } from './getNavPrefs.js'

export type NavProps = ServerProps & {
  req?: PayloadRequest
}

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
    collections,
    globals,
  } = payload.config

  // Group collections and globals for nav display
  // These groups are passed to SidebarTabs -> CollectionsTab to avoid recomputing
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

  const LogoutComponent = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const RenderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item, index) =>
          RenderServerComponent({
            clientProps: {
              documentSubViewType,
              viewType,
            },
            Component: item,
            importMap: payload.importMap,
            key: `settings-menu-item-${index}`,
            serverProps: {
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            },
          }),
        )
      : []

  const RenderedBeforeNav = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: beforeNav,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const RenderedBeforeNavLinks = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const RenderedAfterNavLinks = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const RenderedAfterNav = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType,
    },
    Component: afterNav,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  // Build the full tabs array, starting with the default nav tab
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
          server={req?.server}
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

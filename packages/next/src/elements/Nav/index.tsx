import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { PayloadRequest, ServerProps } from 'payload'

import { Logout } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import React from 'react'

import { DefaultNavClient } from './index.client.js'
import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import { SettingsMenuButton } from './SettingsMenuButton/index.js'
import { SidebarRail } from './SidebarRail/index.js'
import { DEFAULT_NAV_TAB_SLUG } from './SidebarTabs/constants.js'
import { SidebarTabs } from './SidebarTabs/index.js'
import { SidebarItemsContent } from './SidebarTabs/SidebarItemsContent.js'
import { SidebarItemsProvider } from './SidebarTabs/SidebarItemsProvider.js'
import './index.scss'

const baseClass = 'nav'

import { getNavPrefs } from './getNavPrefs.js'

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
      components: { afterNavLinks, beforeNavLinks, logout, settingsMenu },
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

  const sidebarTabs =
    payload.config.admin?.components?.sidebar?.tabs?.filter((tab) => !tab.disabled) || []

  const sidebarMode = payload.config.admin?.components?.sidebar?.mode || 'tabs'

  const initialActiveTabID =
    navPreferences.activeTab ||
    sidebarTabs.find((tab) => tab.isDefaultActive)?.slug ||
    DEFAULT_NAV_TAB_SLUG

  const renderedBeforeNavLinks = RenderServerComponent({
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

  const renderedAfterNavLinks = RenderServerComponent({
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

  const initialTabContents: Record<string, React.ReactNode> = {
    [DEFAULT_NAV_TAB_SLUG]: (
      <DefaultNavClient
        afterNavLinks={renderedAfterNavLinks}
        beforeNavLinks={renderedBeforeNavLinks}
        groups={groups}
        navPreferences={navPreferences}
      />
    ),
  }

  if (sidebarMode === 'rail' && initialActiveTabID !== DEFAULT_NAV_TAB_SLUG) {
    const activeTab = sidebarTabs.find((t) => t.slug === initialActiveTabID)
    if (activeTab) {
      initialTabContents[activeTab.slug] = RenderServerComponent({
        clientProps: {
          documentSubViewType,
          viewType,
        },
        Component: activeTab.component,
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
    }
  }

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

  const renderedSettingsMenu =
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

  // Render tabs mode (self-contained with provider)
  if (sidebarMode === 'tabs' && sidebarTabs.length > 0) {
    return (
      <NavWrapper baseClass={baseClass}>
        <nav className={`${baseClass}__wrap`}>
          <SidebarTabs
            afterNavLinks={renderedAfterNavLinks}
            beforeNavLinks={renderedBeforeNavLinks}
            documentSubViewType={documentSubViewType}
            groups={groups}
            i18n={i18n}
            locale={locale}
            navPreferences={navPreferences}
            params={params}
            payload={payload}
            permissions={permissions}
            searchParams={searchParams}
            tabs={sidebarTabs}
            user={user}
            viewType={viewType}
          />
          <div className={`${baseClass}__controls`}>
            <SettingsMenuButton settingsMenu={renderedSettingsMenu} />
            {LogoutComponent}
          </div>
        </nav>
        <div className={`${baseClass}__header`}>
          <div className={`${baseClass}__header-content`}>
            <NavHamburger baseClass={baseClass} />
          </div>
        </div>
      </NavWrapper>
    )
  }

  // Render rail mode (shared provider wraps rail + sidebar content)
  if (sidebarMode === 'rail' && sidebarTabs.length > 0) {
    return (
      <SidebarItemsProvider
        initialActiveID={initialActiveTabID}
        initialContents={initialTabContents}
      >
        <SidebarRail
          documentSubViewType={documentSubViewType}
          i18n={i18n}
          locale={locale}
          params={params}
          payload={payload}
          permissions={permissions}
          searchParams={searchParams}
          tabs={sidebarTabs}
          user={user}
          viewType={viewType}
        />
        <NavWrapper baseClass={baseClass}>
          <nav className={`${baseClass}__wrap`}>
            <SidebarItemsContent />
            <div className={`${baseClass}__controls`}>
              <SettingsMenuButton settingsMenu={renderedSettingsMenu} />
              {LogoutComponent}
            </div>
          </nav>
          <div className={`${baseClass}__header`}>
            <div className={`${baseClass}__header-content`}>
              <NavHamburger baseClass={baseClass} />
            </div>
          </div>
        </NavWrapper>
      </SidebarItemsProvider>
    )
  }

  // Render default (no tabs)
  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        <DefaultNavClient
          afterNavLinks={renderedAfterNavLinks}
          beforeNavLinks={renderedBeforeNavLinks}
          groups={groups}
          navPreferences={navPreferences}
        />
        <div className={`${baseClass}__controls`}>
          <SettingsMenuButton settingsMenu={renderedSettingsMenu} />
          {LogoutComponent}
        </div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}

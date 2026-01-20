import type { NavGroupType } from '@payloadcms/ui/shared'
import type { NavPreferences, SidebarTab } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { ListViewIcon } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { NavProps } from '../index.js'

import { DefaultNavClient } from '../index.client.js'
import { DEFAULT_NAV_TAB_SLUG } from './constants.js'
import { SidebarTabsClient } from './index.client.js'
import './index.scss'

export type SidebarTabsProps = {
  groups: NavGroupType[]
  navPreferences: NavPreferences
  tabs: SidebarTab[]
} & NavProps

const baseClass = 'sidebar-tabs'

export const SidebarTabs: React.FC<SidebarTabsProps> = (props) => {
  const {
    documentSubViewType,
    groups,
    i18n,
    locale,
    navPreferences,
    params,
    payload,
    permissions,
    searchParams,
    tabs,
    user,
    viewType,
  } = props

  // Determine which tab should be active on initial load
  const initialActiveTabID =
    navPreferences.activeTab ||
    tabs.find((tab) => tab.isDefaultActive)?.slug ||
    DEFAULT_NAV_TAB_SLUG

  // Build initial tab contents - always include nav, conditionally include active custom tab
  const initialTabContents: Record<string, React.ReactNode> = {
    [DEFAULT_NAV_TAB_SLUG]: <DefaultNavClient groups={groups} navPreferences={navPreferences} />,
  }

  if (initialActiveTabID !== DEFAULT_NAV_TAB_SLUG) {
    const activeTab = tabs.find((t) => t.slug === initialActiveTabID)
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

  return (
    <SidebarTabsClient
      baseClass={baseClass}
      initialActiveTabID={initialActiveTabID}
      initialTabContents={initialTabContents}
      tabs={[
        {
          slug: DEFAULT_NAV_TAB_SLUG,
          icon: <ListViewIcon />,
          isDefaultActive: true,
          label: i18n.t('general:collections'),
        },
        ...tabs.map((tab) => {
          const iconComponent = RenderServerComponent({
            clientProps: {
              documentSubViewType,
              viewType,
            },
            Component: tab.icon,
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

          const labelText = tab.label ? getTranslation(tab.label, i18n) : tab.slug

          return {
            slug: tab.slug,
            icon: iconComponent,
            isDefaultActive: tab.isDefaultActive,
            label: labelText,
          }
        }),
      ]}
    />
  )
}

import type { NavPreferences, SidebarTab } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { NavProps } from '../index.js'

import { SidebarTabsClient } from './index.client.js'
import './index.scss'

type SidebarTabWithReactNode = {
  component: React.ReactNode | SidebarTab['component']
  icon: React.ReactNode | SidebarTab['icon']
} & Omit<SidebarTab, 'component' | 'icon'>

export type SidebarTabsProps = {
  navPreferences: NavPreferences
  tabs: SidebarTabWithReactNode[]
} & NavProps

const baseClass = 'sidebar-tabs'

export const SidebarTabs: React.FC<SidebarTabsProps> = (props) => {
  const {
    documentSubViewType,
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
    navPreferences.activeTab || tabs.find((tab) => tab.isDefaultActive)?.slug || tabs[0]?.slug

  // Build initial tab contents - render the initially active tab on server
  const initialTabContents: Record<string, React.ReactNode> = {}

  const activeTab = tabs.find((t) => t.slug === initialActiveTabID)
  if (activeTab) {
    // Check if component is already a React node
    if (React.isValidElement(activeTab.component)) {
      initialTabContents[activeTab.slug] = activeTab.component
    } else {
      // Otherwise render it as a CustomComponent
      initialTabContents[activeTab.slug] = RenderServerComponent({
        clientProps: {
          documentSubViewType,
          viewType,
        },
        Component: activeTab.component as SidebarTab['component'],
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
      tabs={tabs.map((tab) => {
        // Check if icon is already a React element
        const iconComponent = React.isValidElement(tab.icon)
          ? tab.icon
          : RenderServerComponent({
              clientProps: {
                documentSubViewType,
                viewType,
              },
              Component: tab.icon as SidebarTab['icon'],
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
      })}
    />
  )
}

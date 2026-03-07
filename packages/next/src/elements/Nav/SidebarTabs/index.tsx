import type { NavPreferences, PayloadComponent, SidebarTab } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { NavProps } from '../index.js'

import { SidebarTabsClient } from './index.client.js'
import './index.scss'

type SidebarTabWithReactNode = {
  components: {
    Content: PayloadComponent | React.ReactNode
    Icon: PayloadComponent | React.ReactNode
  }
} & Omit<SidebarTab, 'components'>

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
  // First try saved preference, then default tab, then first tab
  const preferredTabSlug =
    navPreferences.activeTab || tabs.find((tab) => tab.isDefaultActive)?.slug || tabs[0]?.slug

  // Verify the preferred tab actually exists, otherwise fall back to default or first tab
  const activeTab =
    tabs.find((t) => t.slug === preferredTabSlug) ||
    tabs.find((tab) => tab.isDefaultActive) ||
    tabs[0]

  const initialActiveTabID = activeTab?.slug || tabs[0]?.slug

  // Build initial tab contents
  // Strategy: Pre-render tabs that are already React elements (can't be lazy-loaded),
  // and only render the initially active tab if it's a CustomComponent (can be lazy-loaded)
  const initialTabContents: Record<string, React.ReactNode> = {}

  const renderComponent = (component: PayloadComponent | React.ReactNode): React.ReactNode => {
    // Check if component is already a React node (payload provided React component)
    if (React.isValidElement(component)) {
      return component
    } else {
      // Otherwise render it as a CustomComponent
      return RenderServerComponent({
        clientProps: {
          documentSubViewType,
          viewType,
        },
        Component: component as PayloadComponent,
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

  for (const tab of tabs) {
    if (React.isValidElement(tab.components.Content)) {
      initialTabContents[tab.slug] = tab.components.Content
    }
  }

  // If the active tab is a CustomComponent (lazy-loadable), render it now
  if (activeTab && !React.isValidElement(activeTab.components.Content)) {
    initialTabContents[activeTab.slug] = renderComponent(activeTab.components.Content)
  }

  return (
    <SidebarTabsClient
      baseClass={baseClass}
      initialActiveTabID={initialActiveTabID}
      initialTabContents={initialTabContents}
      tabs={tabs.map((tab) => {
        const labelText = tab.label ? getTranslation(tab.label, i18n) : tab.slug

        return {
          slug: tab.slug,
          icon: renderComponent(tab.components.Icon),
          isDefaultActive: tab.isDefaultActive,
          label: labelText,
        }
      })}
    />
  )
}

import type { NavGroupType } from '@payloadcms/ui/shared'
import type { NavPreferences, SidebarTab } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { ListViewIcon } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { NavProps } from '../index.js'

import { DefaultNavClient } from '../index.client.js'
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

  // Built-in default nav tab (collections and globals)
  const defaultNavTab = {
    slug: 'nav',
    content: <DefaultNavClient groups={groups} navPreferences={navPreferences} />,
    icon: <ListViewIcon />,
    isDefaultActive: true,
    label: i18n.t('general:collections'),
  }

  // User-provided custom tabs
  const customTabs = tabs.map((tab) => {
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

    const contentComponent = RenderServerComponent({
      clientProps: {
        documentSubViewType,
        viewType,
      },
      Component: tab.component,
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

    // Resolve label to string on server side
    const labelText = tab.label ? getTranslation(tab.label, i18n) : tab.slug

    return {
      slug: tab.slug,
      content: contentComponent,
      icon: iconComponent,
      isDefaultActive: tab.isDefaultActive,
      label: labelText,
    }
  })

  const renderedTabs = [defaultNavTab, ...customTabs]

  return (
    <SidebarTabsClient
      baseClass={baseClass}
      navPreferences={navPreferences}
      renderedTabs={renderedTabs}
    />
  )
}
